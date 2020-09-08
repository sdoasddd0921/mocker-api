"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = delay;

/**
 * You can use functional tool to enhance mock. [#17](https://github.com/jaywcjlove/webpack-api-mocker/issues/17)
 * 
 * ```js
 * const delay = require('mocker-api/lib/delay');
 * const noProxy = process.env.NO_PROXY === 'true';
 * 
 * const proxy = {
 *   'GET /api/user': {
 *     id: 1,
 *     username: 'kenny',
 *     sex: 6
 *   },
 *   // ...
 * }
 * module.exports = (noProxy ? {} : delay(proxy, 1000));
 * ```
 */
function delay(proxy) {
  var timer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var mockApi = {};
  Object.keys(proxy).forEach(function (key) {
    var result = proxy[key];

    if (Object.prototype.toString.call(result) === '[object String]' && /^http/.test(result) || key === '_proxy' || timer === 0) {
      mockApi[key] = proxy[key];
    } else {
      mockApi[key] = function (req, res) {
        var foo;

        if (Object.prototype.toString.call(result) === '[object Function]') {
          foo = result;
        } else {
          foo = function foo(_req, _res) {
            return _res.json(result);
          };
        }

        setTimeout(function () {
          foo(req, res);
        }, timer);
      };
    }
  });
  return mockApi;
}

module.exports = exports.default; 
//# sourceMappingURL=delay.js.map