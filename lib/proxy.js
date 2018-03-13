const { createClient } = require('redis')
const { createHash } = require('crypto')
const { debuglog, promisify } = require('util')
const { raw } = require('body-parser')
const { Router } = require('express')
const { gunzip } = require('zlib')
const http = require('follow-redirects').http
const https = require('follow-redirects').https
const compression = require('compression')

const decompress = promisify(gunzip)
const debug = debuglog('cachepile')

// TODO follow redirects?
// TODO test https vs http
// TODO handle timeout
// TODO ensure ttl is > 1
// TODO remove all unique headers from incoming

function send(response, id, data) {
  debug(`[${id}]: sending outgoing response`)

  response.status(data.statusCode)
  response.set(JSON.parse(data.headers))
  response.send(data.body)
  response.end()
}

module.exports = function (config = {}) {
  // initiate redis client
  const redis = createClient(config.redis)
  const set = promisify(redis.hmset).bind(redis)
  const get = promisify(redis.hgetall).bind(redis)
  const expire = promisify(redis.expire).bind(redis)

  // initiate router
  const router = Router()

  // get the raw incoming body
  router.use(raw())
  router.use(compression())

  // handle all methods and all paths
  router.all('*', async (incoming, outgoing) => {
    const localhost = incoming.socket.address()
    const { headers, method, url } = incoming

    debug(`incoming request: ${method} ${url}`)

    // clean up the headers for later use
    delete headers['host'] // TODO: rewrite to X-Forwarded-Host
    delete headers['date'] // Date headers will not help keep our cache consistent

    // parse incoming config headers
    const force = incoming.headers['cp-force'] || false
    const hostname = incoming.headers['cp-target-host'] || localhost.address
    const port = incoming.headers['cp-target-port'] || localhost.port
    const protocol = incoming.headers['cp-target-proto'] || 'http'
    const ttl = incoming.headers['cp-ttl'] || process.env.CACHEPILE_DEFAULT_TTL || 1
    const wait = incoming.headers['cp-wait'] === 'true' || false

    // configure outgoing request
    const options = {
      path: url,
      hostname,
      port,
      method,
      headers
      // timeout
    }

    // assign unique identifier
    const id = createHash('sha1').update(JSON.stringify(options)).digest('hex')

    debug(`assigning id: ${id}`)

    const cache = await get(id)

    if (cache && !force) {
      debug(`[${id}]: found cache entry`)

      return send(outgoing, id, cache)
    }

    // return response right away if wait header is not specified or false
    if (!wait) {
      debug(`wait header active - sending 201`)
      outgoing.status(201).send()
    }

    // create new request
    const target = (protocol === 'http' ? http : https).request(options)

    target.on('request', () => debug(`[${id}]: sending request`))

    target.on('response', response => {
      let body = []
      const { statusCode, statusMessage, headers } = response

      debug(`[${id}]: processing response`)

      response.on('data', chunk => body.push(chunk))
      response.on('end', async () => {
        body = Buffer.concat(body)

        // decompress gzipped bodies before storing
        if (/gzip/.test(response.headers['content-encoding'])) {
          delete response.headers['content-encoding']
          const dezipped = await decompress(body)
          body = dezipped.toString()
        }

        debug(`[${id}]: save to cache: ttl = ${ttl}`)

        const data = { statusCode, statusMessage, body, headers: JSON.stringify(headers) }

        await set(id, data)
        await expire(id, parseInt(ttl, 10))

        // only return response if user has specified the wait header
        if (wait) {
          send(outgoing, id, data)
        }
      })

      // should be 500 error
      response.on('error', err => console.error(`response error: ${err}`))
    })

    // should be 500 error
    target.on('error', err => console.error(`target error: ${err}`))

    target.end()
  })

  return router
}
