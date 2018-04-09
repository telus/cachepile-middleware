const redis = require('redis')
const util = require('util')

class RedisClient {
  constructor () {
    this._config = {}
  }

  set config (config) {
    this._config = config
  }

  get instance () {
    const instance = redis.createClient(this._config)
    instance.set = util.promisify(instance.hmset).bind(instance)
    instance.get = util.promisify(instance.hgetall).bind(instance)
    instance.expire = util.promisify(instance.expire).bind(instance)
    return instance
  }
}

module.exports = new RedisClient()
