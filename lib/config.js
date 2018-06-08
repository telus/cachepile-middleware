const headerKeys = {
  force: 'force',
  hostname: 'target-host',
  port: 'target-port',
  protocol: 'target-proto',
  ttl: 'ttl',
  wait: 'wait'
}

class Config {
  constructor () {
    this._header_prefix = 'cp'
  }

  set headerPrefix (value) {
    if (value) {
      this._header_prefix = value
    }
  }

  get headerPrefix () {
    return this._header_prefix
  }

  init (configs = {}) {
    this.headerPrefix = configs.headerPrefix || 'cp'
  }

  getPrefixedHeaderKey (key) {
    return `${this.headerPrefix}-${key}`
  }

  extratHeadersFromRequest (req, localhost) {
    const { headers } = req
    const {
      force,
      hostname,
      port,
      protocol,
      ttl,
      wait
    } = headerKeys
    const returnValue = {
      force: headers[this.getPrefixedHeaderKey(force)] || false,
      hostname: headers[this.getPrefixedHeaderKey(hostname)] || localhost.address,
      port: headers[this.getPrefixedHeaderKey(port)] || localhost.port,
      protocol: headers[this.getPrefixedHeaderKey(protocol)] || 'http',
      ttl: headers[this.getPrefixedHeaderKey(ttl)] || process.env.CACHEPILE_DEFAULT_TTL || 1,
      wait: headers[this.getPrefixedHeaderKey(wait)] === 'true'
    }
    return returnValue
  }
}

module.exports = new Config()
