import { MockerProxyRoute, MockerResult } from './';
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
export default function delay(proxy: MockerProxyRoute, timer?: number): MockerResult;
