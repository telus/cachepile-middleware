const { debug } = require('./logger')

module.exports.send = (response, id, data) => {
  debug(`[${id}]: sending outgoing response`)

  response.status(data.statusCode)
  response.set(JSON.parse(data.headers))
  response.send(data.body)
  response.end()
}
