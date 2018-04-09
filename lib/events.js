const zlib = require('zlib')

const utility = require('./utility')
const redis = require('./redis')
const logger = require('./logger')

const createResponseEndHandler = ({
  id,
  wait,
  outgoing,
  ttl,
  body,
  response
}) => async () => {
  const { statusCode, statusMessage, headers } = response

  body = Buffer.concat(body)

  // decompress gzipped bodies before storing
  if (/gzip/.test(response.headers['content-encoding'])) {
    delete response.headers['content-encoding']
    const dezipped = zlib.gunzipSync(body)
    body = dezipped.toString()
  }

  logger.debug(`[${id}]: save to cache: ttl = ${ttl}`)

  const data = { statusCode, statusMessage, body, headers: JSON.stringify(headers) }

  const redisInstance = redis.instance
  await redisInstance.set(id, data)
  await redisInstance.expire(id, parseInt(ttl, 10))
  redisInstance.quit()

  // only return response if user has specified the wait header
  if (wait) {
    utility.send(outgoing, id, data)
  }
}

module.exports.handleRequestResponse = (id, wait, outgoing, ttl) => response => {
  let body = []

  logger.debug(`[${id}]: processing response`)

  response.on('data', chunk => body.push(chunk))
  response.on('end', createResponseEndHandler({ id, wait, outgoing, ttl, body, response }))

  // should be 500 error
  response.on('error', err => console.error(`response error: ${err}`))
}

module.exports.handleRequestStart = (id) => () => logger.debug(`[${id}]: sending request`)

module.exports.handleRequestError = err => console.error(`target error: ${err}`)
