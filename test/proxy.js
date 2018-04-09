const tap = require('tap')
const sinon = require('sinon')

tap.test('it should initialize the proxy', (t) => {
  const { proxyHandler } = require('../lib/handler')
  const redis = require('../lib/redis')
  const express = require('express')
  const spy = sinon.spy(redis, 'config', ['set'])
  const stub = {
    use: sinon.spy(),
    all: sinon.spy()
  }
  const routerStub = sinon.stub(express, 'Router').returns(stub)
  const proxy = require('../lib/proxy')
  proxy()

  t.ok(routerStub.called, 'create new router')
  t.ok(stub.use.calledTwice, 'add middleware')
  t.ok(stub.all.calledWith('*', proxyHandler))
  t.ok(spy.set.called, 'set redis config')
  t.end()
})
