var express = require('express');
var app = express();

var server = app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on port %d', server.address().port);
});

// serve static files
// app.use(express.static(__dirname));

app.use('/', express.static('app'));
