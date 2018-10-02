"use strict";

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _mongodb = require("mongodb");

var _issue = _interopRequireDefault(require("./issue.js"));

require("@babel/polyfill");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// import express from 'express';
var app = express();
app.use(express.static('static'));
app.set('json spaces', 2); // makes the json response look pretty 

app.use(_bodyParser.default.json());

if (process.env.NODE_ENV !== 'production') {
  var webpack = require('webpack');

  var webpackDevMiddleware = require('webpack-dev-middleware');

  var webpackHotMiddleware = require('webpack-hot-middleware');

  var config = require('../webpack.config');

  config.entry.app.push('webpack-hot-middleware/client', 'webpack/hot/only-dev-server');
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
  var bundler = webpack(config);
  app.use(webpackDevMiddleware(bundler, {
    noInfo: true
  }));
  app.use(webpackHotMiddleware(bundler, {
    log: console.log
  }));
}

app.get('/api/issues', function (req, res) {
  db.collection('issues').find().toArray().then(function (issues) {
    var metadata = {
      total_count: issues.length
    };
    res.json({
      _metadata: metadata,
      records: issues
    });
  }).catch(function (err) {
    console.log(err);
    res.status(500).json({
      message: "Internal Server Error: ".concat(err)
    });
  }); // res.send(JSON.stringify({ _metadata: metadata, records: issues }))
});
app.post('/api/issues', function (req, res) {
  var newIssue = req.body;
  newIssue.created = new Date();

  if (!newIssue.status) {
    newIssue.status = 'New';
  }

  var err = _issue.default.validateIssue(newIssue);

  if (err) {
    res.status(422).json({
      message: "Invalid request: ".concat(err)
    });
    return;
  }

  db.collection('issues').insertOne(newIssue).then(function (result) {
    return db.collection('issues').find({
      _id: result.insertedId
    }).limit(1).next();
  }).then(function (newIssue) {
    res.json(newIssue);
  }).catch(function (err) {
    console.log(err);
    res.status(500).json({
      message: "Invalid request: ".concat(err)
    });
  });
});
var db;

_mongodb.MongoClient.connect('mongodb://localhost/issuetracker').then(function (connection) {
  db = connection.db('issuetracker');
  app.listen(3000, function () {
    console.log('App listening on port 3000');
  });
}).catch(function (err) {
  console.log('ERROR:', error);
});
//# sourceMappingURL=server.js.map