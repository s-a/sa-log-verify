#!/usr/bin/env node

const glob = require('fast-glob')

function Log() {
	return this
}

Log.prototype.list = async function () {
}

const Cli = require('n-cli')
const firstArgument = process.argv.slice(2)[0]
const cli = new Cli({
	silent: ['--help', '-v'].indexOf(firstArgument) === -1,
	handleUncaughtException: true, // beautifies error output to console
	handledRejectionPromiseError: true, // beautifyies error output to console
	runcom: '.log-verify'
})
/*
cli.on('unicorn', function () {
	this.log(this)
})
 */

const LineByLineReader = require('line-by-line')

function timeZonedDate(d) {
	const dt = d || new Date()
	dt.setHours(dt.getHours() + (cli.argv['timezone-offset'] || 2))
	return dt
}

function parseFile(timeRangeStart, filename) {
	return new Promise(function (resolve, reject) {
		const lr = new LineByLineReader(filename)
		const lines = []
		lr.on('error', function (err) {
			reject(err)
		})

		lr.on('line', function (line) {
			const parts = line.match(new RegExp(cli.argv['regex-log-datetime'] || '(\\d{1,4})-(\\d{1,2})-(\\d{1,2}) (\\d{1,2}):(\\d{1,2})'))
			if (parts) {
				const logDateTime = timeZonedDate(new Date(parts[0]))
				const ignore = logDateTime >= timeRangeStart
				if (!ignore) {
					lines.push({ logDateTime, logLine: line })
				}
				verboseLog({ file: filename, time: logDateTime, ignore, line })
			}
		})

		lr.on('end', function () {
			resolve(lines)
		})
	})
}

const verboseLog = function (message) {
	if (cli.argv.verbose === true) {
		// eslint-disable-next-line no-console
		console.log(JSON.stringify(message))
	}
}

cli.runcom(async function (rc) {
	this.argv.notNull('pattern')

	const datetimeOffset = this.argv['datetime-offset'] || 300000
	const timeRangeStart = timeZonedDate()
	timeRangeStart.setMilliseconds(timeRangeStart.getMilliseconds() - datetimeOffset)
	if (this.argv.verbose === true) {
		// eslint-disable-next-line no-console
		console.log(this.argv)
		// eslint-disable-next-line no-console
		console.log(`verify logs since "${timeRangeStart.toISOString()}" timezone-offset: ${cli.argv['timezone-offset'] || 2} hours`)
	}
	const files = await glob(this.argv.pattern, { dot: true })
	let logs = []
	for (let f = 0; f < files.length; f++) {
		const file = files[f]
		const parts = file.match(new RegExp(this.argv['argv.regex-file-datetime'] || '(\\d{1,4})-(\\d{1,2})-(\\d{1,2})'))
		const fileDatetime = (parts ? timeZonedDate(new Date(parts[0])) : timeRangeStart)

		const ignore = fileDatetime < timeRangeStart
		verboseLog({ file: file, time: fileDatetime.toISOString(), ignore })
		if (!ignore) {
			/* console.dir(file)
			console.dir(fileDatetime) */
			const lines = await parseFile(timeRangeStart, file)
			logs = logs.concat(lines)
		}
		/* console.dir('---') */
	}
	logs.sort(function compare(a, b) {
		if (a.logDateTime > b.logDateTime) {
			return -1
		}
		if (a.logDateTime < b.logDateTime) {
			return 1
		}
		return 0
	})
	if (logs.length === 0) {
		// eslint-disable-next-line no-process-exit
		process.exit(0)
	} else {
		const lg = logs[0]
		// eslint-disable-next-line no-console
		console.log(`${this.argv.text === undefined ? '' : this.argv.text.replace(/\\n/, '\n')}${lg.logLine}`)
		// eslint-disable-next-line no-process-exit
		// console.dir(lg)
		// eslint-disable-next-line no-process-exit
		process.exit(this.argv.exitcode || 2)
	}
})