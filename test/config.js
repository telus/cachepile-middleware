const tap = require('tap')

const configs = require('../lib/config')

tap.test('returns config instance and sets header prefix', (t) => {
  configs.headerPrefix = 't'
  t.equal(configs.headerPrefix, 't', 'should set header prefix')
  t.end()
})

tap.test('initialize the config class', t => {
  configs.init({
    headerPrefix: 't'
  })
  t.equal(configs.headerPrefix, 't', 'should set header prefix')
  t.end()
})

tap.test('initialize to defaults', t => {
  configs.init()
  t.equal(configs.headerPrefix, 'cp', 'should set header prefix')
  t.end()
})

tap.test('does not set headerPrefix if values empty', t => {
  configs.init()
  configs.headerPrefix = null
  t.equal(configs.headerPrefix, 'cp', 'should not change header prefix if falsy')
  t.end()
})
