
const tap = require('tap')
const sinon = require('sinon')
const zlib = require('zlib')

const sampleData = require('./mocks/sample-data')
const events = require('../lib/events')
const redis = require('../lib/redis')
const utility = require('../lib/utility')
const logger = require('../lib/logger')

let sandbox
let redisInstanceValues
let outgoing

tap.beforeEach((next) => {
  sandbox = sinon.createSandbox()
  redisInstanceValues = {
    set: sandbox.stub().resolves(),
    expire: sandbox.stub().resolves(),
    quit: sandbox.stub()
  }
  outgoing = {
    status: sandbox.spy(),
    set: sandbox.spy(),
    send: sandbox.spy(),
    end: sandbox.spy()
  }
  sandbox.stub(redis, 'instance').get(() => redisInstanceValues)
  next()
})

tap.afterEach((next) => {
  if (sandbox) {
    sandbox.restore()
  }
  next()
})

tap.test('handles request response with wait', async (t) => {
  sandbox.spy(utility, 'send')
  const res = {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {},
    on: sandbox.spy()
  }

  events.handleRequestResponse('abc', true, outgoing, 10)(res)

  const response = Buffer.from(JSON.stringify(sampleData))
  res.on.getCall(0).args[1](response)
  await res.on.getCall(1).args[1]()

  t.ok(redisInstanceValues.set.calledWith('abc', {
    statusCode: 200,
    statusMessage: 'OK',
    body: response,
    headers: '{}'
  }))
  t.ok(redisInstanceValues.expire.calledWith('abc', 10))
  t.ok(redisInstanceValues.quit.called)
  t.ok(utility.send.called)
  t.ok(res.on.calledWith('data'))
  t.ok(res.on.calledWith('error'))
  t.ok(res.on.calledWith('end'))
  t.end()
})

tap.test('handles request response without wait', async (t) => {
  sandbox.spy(utility, 'send')
  const res = {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {},
    on: sandbox.spy()
  }

  events.handleRequestResponse('abc', false, outgoing, 10)(res)

  const response = Buffer.from(JSON.stringify(sampleData))
  res.on.getCall(0).args[1](response)
  await res.on.getCall(1).args[1]()

  t.ok(redisInstanceValues.set.calledWith('abc', {
    statusCode: 200,
    statusMessage: 'OK',
    body: response,
    headers: '{}'
  }))
  t.ok(redisInstanceValues.expire.calledWith('abc', 10))
  t.ok(redisInstanceValues.quit.called)
  t.notOk(utility.send.called)
  t.ok(res.on.calledWith('data'))
  t.ok(res.on.calledWith('error'))
  t.ok(res.on.calledWith('end'))
  t.end()
})

tap.test('handles request response with gzip', async (t) => {
  sandbox.spy(utility, 'send')
  const res = {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {
      'content-encoding': 'gzip'
    },
    on: sandbox.spy()
  }

  events.handleRequestResponse('abc', false, outgoing, 10)(res)

  const data = JSON.stringify(sampleData)
  const response = Buffer.from(data)
  const zippedResponse = zlib.gzipSync(response)
  res.on.getCall(0).args[1](zippedResponse)
  await res.on.getCall(1).args[1]()

  t.ok(redisInstanceValues.set.calledWith('abc', {
    statusCode: 200,
    statusMessage: 'OK',
    body: data,
    headers: '{}'
  }))
  t.ok(redisInstanceValues.expire.calledWith('abc', 10))
  t.ok(redisInstanceValues.quit.called)
  t.notOk(utility.send.called)
  t.ok(res.on.calledWith('data'))
  t.ok(res.on.calledWith('error'))
  t.ok(res.on.calledWith('end'))
  t.end()
})

tap.test('handles request error', async (t) => {
  sandbox.stub(console, 'error')
  const res = {
    statusCode: 200,
    statusMessage: 'OK',
    headers: {},
    on: sandbox.spy()
  }

  events.handleRequestResponse('abc', true, outgoing, 10)(res)

  res.on.getCall(2).args[1]('error')
  t.ok(console.error.calledWith('response error: error'))
  t.end()
})

tap.test('handle request start', t => {
  sandbox.stub(logger, 'debug')
  const fn = events.handleRequestStart('123')
  fn()
  t.ok(logger.debug.calledWith('[123]: sending request'))
  t.end()
})

tap.test('handle request error', t => {
  sandbox.stub(console, 'error')
  events.handleRequestError('error')
  t.ok(console.error.calledWith('target error: error'))
  t.end()
})
