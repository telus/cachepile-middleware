const followRedirects = require('follow-redirects')
const { createHash } = require('crypto')

const { debug } = require('./logger')
const redis = require('./redis')
const { send } = require('./utility')
const events = require('./events')
const config = require('./config')

const sendImmediateResponse = (outgoing) => {
  debug(`wait header active - sending 201`)
  outgoing.status(201)
  outgoing.send()
}

const proxyRequest = (options, id, outgoing, {
  protocol,
  wait,
  ttl
}) => {
  const { http, https } = followRedirects
  const target = (protocol === 'http' ? http : https).request(options)

  target.on('request', events.handleRequestStart(id))
  target.on('response', events.handleRequestResponse(id, wait, outgoing, ttl))
  // should be 500 error
  target.on('error', events.handleRequestError)

  target.end()
}

const getCache = async (id) => {
  const instance = redis.instance
  const results = await instance.get(id)
  instance.quit()
  return results
}

module.exports.proxyHandler = async (incoming, outgoing) => {
  const localhost = incoming.socket.address()
  const { headers, method, url } = incoming

  debug(`incoming request: ${method} ${url}`)

  // clean up the headers for later use
  delete headers['host'] // TD: rewrite to X-Forwarded-Host
  delete headers['date'] // Date headers will not help keep our cache consistent
  

  // parse incoming config headers
  const params = config.extratHeadersFromRequest(incoming, localhost)
  const { force, hostname, port, wait } = params

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

  const cache = await getCache(id)

  if (cache && !force) {
    debug(`[${id}]: found cache entry`)
    return send(outgoing, id, cache)
  }

  // return response right away if wait header is not specified or false
  if (!wait) {
    sendImmediateResponse(outgoing)
  }

  proxyRequest(options, id, outgoing, params)
}
