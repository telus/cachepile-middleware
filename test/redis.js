const tap = require('tap')
const redis = require('redis')
const sinon = require('sinon')
const redisService = require('../lib/redis')

let config
let sandbox

tap.beforeEach((next) => {
  sandbox = sinon.sandbox.create()
  config = {
    host: '127.0.0.1',
    port: 6379
  }
  next()
})

tap.afterEach((next) => {
  if (sandbox && sandbox.restore) {
    sandbox.restore()
  }
  next()
})

tap.test('sets configs', t => {
  redisService.config = config
  t.ok(redisService._config === config)
  t.end()
})

tap.test('get instance', async (t) => {
  const stubValue = {
    hmset: (key, value, callback) => callback(null, 'hmset'),
    hgetall: (key, callback) => callback(null, 'hgetAll'),
    expire: (value, key, callback) => callback(null, 'expire')
  }

  const stub = sandbox.stub(redis, 'createClient')
    .returns(stubValue)

  const hmsetSpy = sandbox.spy(stubValue, 'hmset')
  const hgetallSpy = sandbox.spy(stubValue, 'hgetall')
  const expireSpy = sandbox.spy(stubValue, 'expire')

  redisService.config = config
  const instance = redisService.instance
  const hmset = await instance.set('key', 'value')
  const hgetall = await instance.get('key')
  const expire = await instance.expire('key', 'value')

  t.ok(stub.calledWith(config))
  t.ok(hmsetSpy.called)
  t.ok(hmset === 'hmset')
  t.ok(hgetallSpy.called)
  t.ok(hgetall === 'hgetAll')
  t.ok(expireSpy.called)
  t.ok(expire === 'expire')

  t.end()
})
