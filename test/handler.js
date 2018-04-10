const tap = require('tap')
const followRedirects = require('follow-redirects')
const sinon = require('sinon')
const handler = require('../lib/handler')
const redisClient = require('../lib/redis')
const events = require('../lib/events')
const sampleResponse = require('./mocks/sample-data')

let sandbox
let request
let response

const createRedisInstanceStub = (retrunValues) => {
  const stub = sandbox.stub(redisClient, 'instance')
  stub.get(() => retrunValues)
  return stub
}

tap.beforeEach((end) => {
  sandbox = sinon.sandbox.create()
  request = {
    headers: {},
    method: '',
    url: '',
    socket: {
      address: () => ({
        address: 'http://localhost'
      })
    }
  }

  response = {
    end: sandbox.spy(),
    status: sandbox.spy(),
    set: sandbox.spy(),
    send: sandbox.spy()
  }

  end()
})

tap.afterEach((next) => {
  sandbox.restore()
  next()
})

tap.test('should return cached response', async (t) => {
  request.headers.host = 'host'
  request.headers.date = 'Date: Tue, 15 Nov 2018 08:12:31 GMT'

  const stubReturn = {
    get: () => Promise.resolve({
      statusCode: 200,
      headers: JSON.stringify({}),
      body: JSON.stringify(sampleResponse)
    }),
    quit: sandbox.spy()
  }
  const stubReturnSpy = sandbox.spy(stubReturn, 'get')
  createRedisInstanceStub(stubReturn)

  await handler.proxyHandler(request, response)

  t.ok(stubReturnSpy.calledWith('091d3a75ab90e1fe9fd020248244fdc34068bc2e'))
  t.notOk(request.headers.host, 'removes host from header')
  t.notOk(request.headers.date, 'removes date from headers')
  t.ok(response.send.calledWith(JSON.stringify(sampleResponse)), 'send response to client')
  t.ok(response.set.calledWith({}), 'set headers')
  t.ok(response.status.called, 'set status')
  t.ok(response.end.called, 'end request')
  t.ok(stubReturn.quit.called)
  t.end()
})

tap.test('should return early', async (t) => {
  const stubValues = {
    get: () => Promise.resolve(null),
    quit: sinon.spy()
  }

  request.headers['cp-wait'] = 'false'
  createRedisInstanceStub(stubValues)
  await handler.proxyHandler(request, response)
  t.ok(response.status.calledWith(201), 'returns early')
  t.ok(response.send.called, 'sends response')
  t.ok(stubValues.quit.called)
  t.end()
})

tap.test('should use https', async (t) => {
  const stubReturn = {
    on: sandbox.spy(),
    end: sandbox.spy()
  }
  const redisStubValues = {
    get: () => Promise.resolve(null),
    quit: sinon.spy()
  }
  createRedisInstanceStub(redisStubValues)
  request.headers['cp-wait'] = 'true'
  request.headers['cp-target-proto'] = 'https'
  const noop = () => { }
  const stub = sandbox.stub(followRedirects.https, 'request').returns(stubReturn)
  sandbox.stub(events, 'handleRequestResponse').returns(noop)
  sandbox.stub(events, 'handleRequestStart').returns(noop)
  await handler.proxyHandler(request, response)
  t.ok(stub.called)
  t.ok(stubReturn.on.calledWith('error', events.handleRequestError), 'called with error handler')
  t.ok(stubReturn.on.calledWith('response', noop), 'called with response handler')
  t.ok(stubReturn.on.calledWith('request', noop), 'called with request start handler')
  t.ok(redisStubValues.quit.called)
  t.end()
})

tap.test('should use http', async (t) => {
  request.headers['cp-wait'] = 'true'
  request.headers['cp-target-proto'] = 'http'
  const redisStubValues = {
    get: () => Promise.resolve(null),
    quit: sinon.spy()
  }
  createRedisInstanceStub(redisStubValues)
  const stubReturn = {
    on: sandbox.spy(),
    end: sandbox.spy()
  }
  const noop = () => { }
  const stub = sandbox.stub(followRedirects.http, 'request').returns(stubReturn)
  sandbox.stub(events, 'handleRequestResponse').returns(noop)
  sandbox.stub(events, 'handleRequestStart').returns(noop)
  await handler.proxyHandler(request, response)
  t.ok(stub.called)
  t.ok(stubReturn.on.calledWith('error', events.handleRequestError), 'called with error handler')
  t.ok(stubReturn.on.calledWith('response', noop), 'called with response handler')
  t.ok(stubReturn.on.calledWith('request', noop), 'called with request start handler')
  t.ok(redisStubValues.quit.called)
  t.end()
})
