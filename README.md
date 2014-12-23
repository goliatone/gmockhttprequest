# GMockHttpRequest

[![Build Status](https://secure.travis-ci.org/goliatone/gmockhttprequest.png)](http://travis-ci.org/goliatone/gmockhttprequest)

XMLHttpRequest mock utility

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/goliatone/gmockhttprequest/master/dist/gmockhttprequest.min.js
[max]: https://raw.github.com/goliatone/gmockhttprequest/master/dist/gmockhttprequest.js

## Development
`npm install && bower install && grunt bower`

If you need to `sudo` the `npm` command, you can try to:

```terminal
sudo chown $(whoami) ~/.npm
sudo chown $(whoami) /usr/local/share/npm/bin
sudo chown -R $(whoami) /usr/local/lib/node_modules
```


If you bump versions, remember to update:
- package.json
- bower.json
- component.json
- etc.


## Bower
>Bower is a package manager for the web. It offers a generic, unopinionated solution to the problem of front-end package management, while exposing the package dependency model via an API that can be consumed by a more opinionated build stack. There are no system wide dependencies, no dependencies are shared between different apps, and the dependency tree is flat.

To register gmockhttprequest in the [bower](http://bower.io/) [registry](http://sindresorhus.com/bower-components/):
`bower register gmockhttprequest git://github.com/goliatone/gmockhttprequest.git`

Then, make sure to tag your module:

`git tag -a v0.1.0 -m "Initial release."`

And push it:

`git push --tags`


## Travis
In order to enable Travis for this specific project, you need to do so on your Travi's [profile](https://travis-ci.org/profile). Look for the entry `goliatone/gmockhttprequest`, activate, and sync.


## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
