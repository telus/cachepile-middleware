const { raw } = require('body-parser')
const { Router } = require('express')
const compression = require('compression')

const { proxyHandler } = require('./handler')
const RedisClient = require('./redis')
const Config = require('./config')

// TD: test https vs http
// TD: handle timeout
// TD: remove all unique headers from incoming

module.exports = function (config = {}) {
  // set configs to client
  RedisClient.config = config.redis
  Config.init(config)

  // initiate router
  const router = Router()

  // get the raw incoming body
  router.use(raw())
  router.use(compression())

  // handle all methods and all paths
  router.all('*', proxyHandler)

  return router
}
