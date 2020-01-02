"use strict";

var _express = _interopRequireDefault(require("express"));

var _path = _interopRequireDefault(require("path"));

var _process = _interopRequireDefault(require("process"));

var _fs = _interopRequireDefault(require("fs"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _letterCount = _interopRequireDefault(require("letter-count"));

var _admZip = _interopRequireDefault(require("adm-zip"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var app = (0, _express["default"])();
app.use(_express["default"]["static"]('static'));
app.set('json spaces', 2); // makes the json response look pretty 

app.use(_bodyParser["default"].json());

if (_process["default"].env.NODE_ENV !== 'production') {
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

app.get('/api', function (req, res) {
  _fs["default"].readdir(__dirname + '/../', function (err, items) {
    var directories = items.filter(function (item) {
      if (_fs["default"].lstatSync(item).isDirectory() && item !== 'node_modules') return item;
      return;
    });
    res.status('200').json({
      directories: directories
    });
  });
});
app.post('/api/path', function (req, res) {
  var user_path = req.body.dir;
  validatePath(user_path).then(function (_ref) {
    var absolute = _ref.absolute;
    var directory = absolute ? user_path : __dirname + "/../".concat(user_path);

    _fs["default"].readdir(directory, function (err, items) {
      if (err) {
        if (err.code === 'ENOENT') {
          console.log('File not found!');
          res.status(404).json({
            message: "The directory doesn't exist"
          });
        } else {
          throw err;
        }

        return;
      }

      var textFiles = items.filter(function (item) {
        if (item.match(/\.(txt|zip)$/)) {
          return item;
        } else {
          return null;
        }
      });

      if (textFiles.length === 0) {
        res.status('200').json({
          files: [],
          message: "There are no text files on this directory"
        });
        return;
      } else {
        var processedFiles = processFiles(directory, textFiles);
        var data = processedFiles.reduce(function (acc, file) {
          var wordsArray = acc.wordsArray;
          acc.files.push(file.file); // seems I was mutating the value instead of assigning a new value 
          // like when setting state on react

          acc['wordsArray'] = wordsArray.concat(file.words);
          return acc;
        }, {
          files: [],
          wordsArray: []
        });
        var wordMap = data.wordsArray.reduce(function (acc, word) {
          acc[word] = (acc[word] || 0) + 1;
          return acc;
        }, Object.create(null)); // console.log({wordMap});

        if (processedFiles.length === 0) {
          res.status('200').json({
            files: [],
            message: "There are no text files on this directory"
          });
        } else {
          res.status('200').json({
            files: data.files,
            wordMap: wordMap,
            message: ""
          });
        }
      }
    });
  })["catch"](function (err) {
    console.log("Directory doesn't exist!");
    res.status(404).json({
      message: "The directory doesn't exist"
    });
  });
});

function validatePath(user_path) {
  var promise = new Promise(function (resolve, reject) {
    var dir = _fs["default"].lstat(__dirname + "/../".concat(user_path), function (err, stat) {
      if (err) {
        return _fs["default"].lstat(user_path, function (err, stat) {
          console.log(user_path);

          if (err) {
            reject();
          }

          resolve({
            absolute: true
          });
        });
      }

      resolve({
        absolute: false
      });
    });

    return dir;
  });
  return promise;
}

function processFiles(user_path, files) {
  function readFile(accumulator, file) {
    var source = _path["default"].resolve("".concat(user_path, "/").concat(file));

    if (file.match(/\.txt$/)) {
      var text = _fs["default"].readFileSync(source, 'utf-8');

      var cleanText = text.toLowerCase().replace(/[\n]/g, " ").replace(/[^a-zA-Z ]/g, ""); // console.log({cleanText})

      var words = cleanText.split(/[\s]+/g); // console.log({words});

      return accumulator.concat({
        file: file,
        words: words
      });
    } else {
      var dest = _path["default"].resolve(user_path);

      var zip = new _admZip["default"](source);
      var entries = zip.getEntries();
      zip.extractAllTo(dest, true); // console.log({entries})

      var entriesData = entries.reduce(function (acc, entry) {
        var name = entry.name,
            getData = entry.getData;
        if (!name.match(/\.txt$/)) return acc;
        var data = getData().toString();
        var cleanText = data.toLowerCase().replace(/[\n]/g, " ").replace(/[^a-zA-Z ]/g, "");
        var words = cleanText.split(/[\s]+/g); // console.log({words});

        return acc.concat({
          file: name,
          words: words
        });
      }, []);
      return accumulator.concat(entriesData);
    }
  } // readFile


  return files.reduce(readFile, []);
}

app.listen(3000, function () {
  console.log('App listening on port 3000');
});
//# sourceMappingURL=server.js.map