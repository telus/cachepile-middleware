const { debug } = require('./logger')

module.exports.send = (response, id, data) => {
  debug(`[${id}]: sending outgoing response`)

  const headers = { ...JSON.parse(data.headers) }
  // remove encoding headers
  delete headers['transfer-encoding']

  response.status(data.statusCode)
  response.set(headers)
  response.send(data.body)
  response.end()
}
