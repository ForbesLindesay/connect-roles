3.1.1 / 2015-02-04
==================

Fix use of deprecated `Promise.from` method (only impacts use of the async api)

3.1.0 / 2014-11-03
==================

  * Update dependencies
  * Add `matchRelativePaths` option

3.0.3 / 2014-04-22
==================

  * Update path-to-regexp to 0.1.2

3.0.2 / 2014-02-19
==================

  * Fix another bug in use3

3.0.1 / 2014-02-19
==================

  * Fix bug in use3

3.0.0 / 2014-02-19
==================

  * Complete redesign so it's not a singleton anymore
  * Don't set the user when anonymous (this confused way too many people)

2.1.0 / 2013-06-13
==================

  * fix: route handlers would continue falling through even when `true` was returned (thanks to [@doughsay](https://github.com/doughsay) for reporting and helping with the fix)
  * Use npm versions of dependencies, rather than my own GitHub forks

2.0.3 / 2013-02-10
==================

  * fix: extra `/` sometimes appeared in paths

2.0.2 / 2013-02-08
==================

  * fix: pass the keys array to pathToRegexp

2.0.1 / 2013-02-08
==================

  * fix: prepend app.path for mounted apps so handlers always use the full path.

2.0.0 / 2013-02-08
==================

  * redesign API

1.0.1 / 2012-12-27
==================

  * fix: throw real errors not strings

1.0.0 / 2012-08-24
==================

  * First Stable Release
