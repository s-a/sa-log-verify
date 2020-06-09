# Usage

`log-verify [options]`

## Options

`--pattern`             glob pattern files to parse
`--datetime-offset`     date time log entry offset in milliseconds to notify. (Defaults to 300000 "5 minutes")
`--text`                additional console log output text (optional)
`--exitcode`            exitcode to use when a log enty was found (defaults to 2)
`--timezone-offset`     timezone-offset (defaults to 0)
`--regex-file-datetime` file date time parser (defaults to "\d{1,4})-(\d{1,2})-(\d{1,2}")
`--regex-log-datetime`  log line date time parser (defaults to "(\d{1,4})-(\d{1,2})-(\d{1,2}) (\d{1,2}):(\d{1,2})")
`--verbose`             output debug infos
`-v`                    output the version number
`--help`                output usage information
