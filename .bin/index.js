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

function parseFile(filename) {
	return new Promise(function (resolve, reject) {
		const lr = new LineByLineReader(filename)
		const lines = []
		lr.on('error', function (err) {
			reject(err)
		})

		lr.on('line', function (line) {
			// pause emitting of lines...
			// lr.pause()
			// 2020-05-06 07:10 +00:00
			const parts = line.match(new RegExp(cli.argv['regex-log-datetime'] || '(\\d{1,4})-(\\d{1,2})-(\\d{1,2}) (\\d{1,2}):(\\d{1,2})'))
			if (parts) {
				const logDateTime = timeZonedDate(new Date(parts[0]))
				if (cli.argv.verbose) {
					// eslint-disable-next-line no-console
					// console.dir({ logDateTime, logLine })
				}
				lines.push({ logDateTime, logLine: line })
			}

			// ...do your asynchronous line processing..
			// setTimeout(function () {
			// ...and continue emitting lines.
			// lr.resume()
			// }, 100)
		})

		lr.on('end', function () {
			resolve(lines)
		})
	})
}

cli.runcom(async function (rc) {
	this.argv.notNull('pattern')

	const datetimeOffset = this.argv['datetime-offset'] || 300000
	const dt = timeZonedDate()
	dt.setMilliseconds(dt.getMilliseconds() - datetimeOffset)
	if (this.argv.verbose === true) {
		// eslint-disable-next-line no-console
		console.log(this.argv)
		// eslint-disable-next-line no-console
		console.log(`verify logs since "${dt.toISOString()}"`)
	}
	const files = await glob(this.argv.pattern, { dot: true })
	let logs = []
	for (let f = 0; f < files.length; f++) {
		const file = files[f]
		const parts = file.match(new RegExp(this.argv['argv.regex-file-datetime'] || '(\\d{1,4})-(\\d{1,2})-(\\d{1,2})'))
		const fileDatetime = (parts ? new Date(parts[0]) : timeZonedDate())

		if (this.argv.verbose === true) {
			// eslint-disable-next-line no-console
			console.log(file, fileDatetime.toISOString())
		}

		if (dt < fileDatetime) {
			/* console.dir(file)
			console.dir(fileDatetime) */
			const lines = await parseFile(file)
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