var superagent = require('superagent')
var res = yield superagent.get('http://google.com')
return res.status
