![Logo](https://github.com/cachepile/brand/blob/master/logo.svg)

# Cachepile Express Middleware [![version][npm-version]][npm-url] [![License][license-image]][license-url] [![Build Status][travis-image]][travis-url]

> [CachePile][cachepile] Express Middleware

## Install

```bash
npm install --production --save @cachepile/middleware
```

## API

### lib()

#### Middleware usage

```js
const express = require('express')
const middleware = require('@cachepile/middleware')

const app = express()
app.use(middleware)
app.listen(3000, () =>  console.log(`Cachepile listening on 3000`))
```

```bash
# call api to cache through the proxy
curl -i -H "cp-target-port: 443" -H "cp-ttl: 10" -H "CP-TARGET-HOST: reqres.in" -H "CP-TARGET-PROTO: https"  localhost:3000/api/users
```

#### Headers

Header          | Description                                          | Default Value
--------------- | ---------------------------------------------------- | --------------
CP-FORCE        | Force request to call through to specified end point | false
CP-TARGET-HOST  | host of endpoint to cache                            | requested host
CP-TARGET-PORT  | port of endpoint to cache                            | requested port
CP-TARGET-PROTO | protocol for endpoint to cache                       | http
CP-TTL          | time in seconds to cache response                    | 1

---

> License: [ISC][license-url] •
> Copyright: [ahmadnassri.com](https://www.ahmadnassri.com) •
> Github: [@ahmadnassri](https://github.com/ahmadnassri) •
> Twitter: [@ahmadnassri](https://twitter.com/ahmadnassri)

[license-url]: http://choosealicense.com/licenses/isc/

[license-image]: https://img.shields.io/github/license/cachepile/middleware.svg?style=flat-square

[travis-url]: https://travis-ci.org/cachepile/middleware

[travis-image]: https://img.shields.io/travis/cachepile/middleware.svg?style=flat-square

[npm-url]: https://www.npmjs.com/package/@cachepile/middleware

[npm-version]: https://img.shields.io/npm/v/@cachepile/middleware.svg?style=flat-square

[cachepile]: https://cachepile.github.io
