const express = require('express')
const proxy = require('../lib/proxy')

const app = express()
app.use(proxy({
  headerPrefix: 't'
}))

app.listen(3000, () => console.log(`listening on port 3000`))
