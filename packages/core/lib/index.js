"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = _default;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _url = _interopRequireDefault(require("url"));

var _path = _interopRequireDefault(require("path"));

var _bodyParser = _interopRequireDefault(require("body-parser"));

var _httpProxy = _interopRequireDefault(require("http-proxy"));

var toRegexp = _interopRequireWildcard(require("path-to-regexp"));

var _clearModule = _interopRequireDefault(require("clear-module"));

var _chokidar = _interopRequireDefault(require("chokidar"));

var _safe = _interopRequireDefault(require("colors-cli/safe"));

var pathToRegexp = toRegexp.pathToRegexp;
var mocker = {};

function pathMatch(options) {
  options = options || {};
  return function (path) {
    var keys = [];
    var re = pathToRegexp(path, keys, options);
    return function (pathname, params) {
      var m = re.exec(pathname);
      if (!m) return false;
      params = params || {};
      var key, param;

      for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        param = m[i + 1];
        if (!param) continue;
        params[key.name] = decodeURIComponent(param);
        if (key.repeat) params[key.name] = params[key.name].split(key.delimiter);
      }

      return params;
    };
  };
}

function _default(app, watchFile) {
  var conf = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var watchFiles = Array.isArray(watchFile) ? watchFile : typeof watchFile === 'string' ? [watchFile] : [];

  if (watchFiles.some(function (file) {
    return !file;
  })) {
    throw new Error('Mocker file does not exist!.');
  } // Mybe watch file or pass parameters
  // https://github.com/jaywcjlove/mocker-api/issues/116


  var isWatchFilePath = Array.isArray(watchFile) && watchFile.every(function (val) {
    return typeof val === 'string';
  }) || typeof watchFile === 'string';
  mocker = isWatchFilePath ? getConfig() : watchFile;

  if (!mocker) {
    return function (req, res, next) {
      next();
    };
  }

  var options = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, conf), mocker._proxy || {});
  var defaultOptions = {
    changeHost: true,
    pathRewrite: {},
    proxy: {},
    // proxy: proxyConf: {},
    httpProxy: {},
    // httpProxy: httpProxyConf: {},
    bodyParserConf: {},
    bodyParserJSON: {},
    bodyParserText: {},
    bodyParserRaw: {},
    bodyParserUrlencoded: {},
    watchOptions: {},
    header: {},
    forward: ''
  };
  options = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, defaultOptions), options); // changeHost = true,
  // pathRewrite = {},
  // proxy: proxyConf = {},
  // httpProxy: httpProxyConf = {},
  // bodyParserConf= {},
  // bodyParserJSON = {},
  // bodyParserText = {},
  // bodyParserRaw = {},
  // bodyParserUrlencoded = {},
  // watchOptions = {},
  // header = {}

  if (isWatchFilePath) {
    // 监听配置入口文件所在的目录，一般为认为在配置文件/mock 目录下的所有文件
    // 加上require.resolve，保证 `./mock/`能够找到`./mock/index.js`，要不然就要监控到上一级目录了
    var watcher = _chokidar["default"].watch(watchFiles.map(function (watchFile) {
      return _path["default"].dirname(require.resolve(watchFile));
    }), options.watchOptions);

    watcher.on('all', function (event, path) {
      if (event === 'change' || event === 'add') {
        try {
          // 当监听的可能是多个配置文件时，需要清理掉更新文件以及入口文件的缓存，重新获取
          cleanCache(path);
          watchFiles.forEach(function (file) {
            return cleanCache(file);
          });
          mocker = getConfig();

          if (mocker._proxy) {
            options = (0, _objectSpread2["default"])((0, _objectSpread2["default"])({}, options), mocker._proxy);
          }

          console.log("".concat(_safe["default"].green_b.black(' Done: '), " Hot Mocker ").concat(_safe["default"].green(path.replace(process.cwd(), '')), " file replacement success!"));
        } catch (ex) {
          console.error("".concat(_safe["default"].red_b.black(' Failed: '), " Hot Mocker ").concat(_safe["default"].red(path.replace(process.cwd(), '')), " file replacement failed!!"));
        }
      }
    });
  } // 监听文件修改重新加载代码
  // 配置热更新


  app.all('/*', function (req, res, next) {
    /**
     * Get Proxy key
     */
    var proxyKey = Object.keys(options.proxy).find(function (kname) {
      return !!pathToRegexp(kname.replace(new RegExp('^' + req.method + ' '), '')).exec(req.path);
    });
    /**
     * Get Mocker key
     * => `GET /api/:owner/:repo/raw/:ref`
     * => `GET /api/:owner/:repo/raw/:ref/(.*)`
     */

    var mockerKey = Object.keys(mocker).find(function (kname) {
      return !!pathToRegexp(options.forward + kname.replace(new RegExp('^' + req.method + ' '), '')).exec(req.path);
    });
    /**
     * Access Control Allow options.
     * https://github.com/jaywcjlove/mocker-api/issues/61
     */

    var accessOptions = (0, _objectSpread2["default"])({
      'Access-Control-Allow-Origin': req.get('Origin') || '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true'
    }, options.header);
    Object.keys(accessOptions).forEach(function (keyName) {
      res.setHeader(keyName, accessOptions[keyName]);
    }); // fix issue 34 https://github.com/jaywcjlove/mocker-api/issues/34
    // In some cross-origin http request, the browser will send the preflighted options request before sending the request methods written in the code.

    if (!mockerKey && req.method.toLocaleUpperCase() === 'OPTIONS' && Object.keys(mocker).find(function (kname) {
      return !!pathToRegexp(kname.replace(new RegExp('^(PUT|POST|GET|DELETE) '), '')).exec(req.path);
    })) {
      return res.sendStatus(200);
    }

    if (proxyKey && options.proxy[proxyKey]) {
      var currentProxy = options.proxy[proxyKey];

      var url = _url["default"].parse(currentProxy);

      if (options.changeHost) {
        req.headers.host = url.host;
      }

      var _options$httpProxy = options.httpProxy,
          _options$httpProxy$op = _options$httpProxy.options,
          proxyOptions = _options$httpProxy$op === void 0 ? {} : _options$httpProxy$op,
          _options$httpProxy$li = _options$httpProxy.listeners,
          proxyListeners = _options$httpProxy$li === void 0 ? {} : _options$httpProxy$li;
      /**
       * rewrite target's url path. Object-keys will be used as RegExp to match paths.
       * https://github.com/jaywcjlove/mocker-api/issues/62
       */

      Object.keys(options.pathRewrite).forEach(function (rgxStr) {
        var rePath = req.path.replace(new RegExp(rgxStr), options.pathRewrite[rgxStr]);
        var currentPath = [rePath];

        if (req.url.indexOf('?') > 0) {
          currentPath.push(req.url.replace(/(.*)\?/, ''));
        }

        req.query = _url["default"].parse(req.url, true).query;
        req.url = req.originalUrl = currentPath.join('?');
      });

      var proxyHTTP = _httpProxy["default"].createProxyServer({});

      proxyHTTP.on('error', function (err) {
        console.error("".concat(_safe["default"].red_b.black(" Proxy Failed: ".concat(err.name)), " ").concat(err.message || '', " ").concat(err.stack || '', " !!"));
      });
      Object.keys(proxyListeners).forEach(function (event) {
        proxyHTTP.on(event, proxyListeners[event]);
      });
      proxyHTTP.web(req, res, Object.assign({
        target: url.href
      }, proxyOptions));
    } else if (mocker[mockerKey]) {
      var bodyParserMethd = _bodyParser["default"].json((0, _objectSpread2["default"])({}, options.bodyParserJSON)); // 默认使用json解析


      var contentType = req.get('Content-Type');
      /**
       * `application/x-www-form-urlencoded; charset=UTF-8` => `application/x-www-form-urlencoded`
       * Issue: https://github.com/jaywcjlove/mocker-api/issues/50
       */

      contentType = contentType && contentType.replace(/;.*$/, '');

      if (options.bodyParserConf && options.bodyParserConf[contentType]) {
        // 如果存在options.bodyParserConf配置 {'text/plain': 'text','text/html': 'text'}
        switch (options.bodyParserConf[contentType]) {
          // 获取bodyParser的方法
          case 'raw':
            bodyParserMethd = _bodyParser["default"].raw((0, _objectSpread2["default"])({}, options.bodyParserRaw));
            break;

          case 'text':
            bodyParserMethd = _bodyParser["default"].text((0, _objectSpread2["default"])({}, options.bodyParserText));
            break;

          case 'urlencoded':
            bodyParserMethd = _bodyParser["default"].urlencoded((0, _objectSpread2["default"])({
              extended: false
            }, options.bodyParserUrlencoded));
            break;

          case 'json':
            bodyParserMethd = _bodyParser["default"].json((0, _objectSpread2["default"])({}, options.bodyParserJSON));
          //使用json解析 break;
        }
      } else {
        // 兼容原来的代码,默认解析
        // Compatible with the original code, default parsing
        switch (contentType) {
          case 'text/plain':
            bodyParserMethd = _bodyParser["default"].raw((0, _objectSpread2["default"])({}, options.bodyParserRaw));
            break;

          case 'text/html':
            bodyParserMethd = _bodyParser["default"].text((0, _objectSpread2["default"])({}, options.bodyParserText));
            break;

          case 'application/x-www-form-urlencoded':
            bodyParserMethd = _bodyParser["default"].urlencoded((0, _objectSpread2["default"])({
              extended: false
            }, options.bodyParserUrlencoded));
            break;
        }
      }

      bodyParserMethd(req, res, function () {
        var result = mocker[mockerKey];

        if (typeof result === 'function') {
          var rgxStr = ~mockerKey.indexOf(' ') ? ' ' : '';
          req.params = pathMatch({
            sensitive: false,
            strict: false,
            end: false
          })(mockerKey.split(new RegExp(rgxStr))[1])(_url["default"].parse(req.url).pathname);
          result(req, res, next);
        } else {
          res.json(result);
        }
      });
    } else {
      next();
    }
  }); // The old module's resources to be released.

  function cleanCache(modulePath) {
    // The entry file does not have a .js suffix,
    // causing the module's resources not to be released.
    // https://github.com/jaywcjlove/webpack-api-mocker/issues/30
    try {
      modulePath = require.resolve(modulePath);
    } catch (e) {}

    var module = require.cache[modulePath];
    if (!module) return; // remove reference in module.parent

    if (module.parent) {
      module.parent.children.splice(module.parent.children.indexOf(module), 1);
    } // https://github.com/jaywcjlove/mocker-api/issues/42


    (0, _clearModule["default"])(modulePath);
  } // Merge multiple Mockers


  function getConfig() {
    return watchFiles.reduce(function (mocker, file) {
      var mockerItem = require(file);

      return Object.assign(mocker, mockerItem["default"] ? mockerItem["default"] : mockerItem);
    }, {});
  }

  return function (req, res, next) {
    next();
  };
}

module.exports = exports.default; 
//# sourceMappingURL=index.js.map