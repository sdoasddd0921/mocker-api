/// <reference types="node" />
import URL from 'url';
import * as net from "net";
import * as http from "http";
import { Request, Response, NextFunction, Application } from 'express';
import bodyParser from 'body-parser';
import httpProxy from 'http-proxy';
import chokidar from 'chokidar';
export declare type ProxyTargetUrl = string | Partial<URL.Url>;
export declare type MockerResultFunction = ((req: Request, res: Response, next?: NextFunction) => void);
export declare type MockerResult = string | number | Array<any> | Record<string, any> | MockerResultFunction;
/**
 * Setting a proxy router.
 * @example
 *
 * ```json
 * {
 *   '/api/user': {
 *     id: 1,
 *     username: 'kenny',
 *     sex: 6
 *   },
 *   'DELETE /api/user/:id': (req, res) => {
 *     res.send({ status: 'ok', message: '删除成功！' });
 *   }
 * }
 * ```
 */
export declare type MockerProxyRoute = Record<string, MockerResult> & {
    /**
     * This is the option parameter setting for apiMocker
     * Priority processing.
     * apiMocker(app, path, option)
     * {@link MockerOption}
     */
    _proxy?: MockerOption;
};
/**
 * Listening for proxy events.
 * This options contains listeners for [node-http-proxy](https://github.com/http-party/node-http-proxy#listening-for-proxy-events).
 * {typeof httpProxy.on}
 * {@link httpProxy}
 */
export interface HttpProxyListeners extends Record<string, any> {
    start?: (req: http.IncomingMessage, res: http.ServerResponse, target: ProxyTargetUrl) => void;
    proxyReq?: (proxyReq: http.ClientRequest, req: http.IncomingMessage, res: http.ServerResponse, options: httpProxy.ServerOptions) => void;
    proxyRes?: (proxyRes: http.IncomingMessage, req: http.IncomingMessage, res: http.ServerResponse) => void;
    proxyReqWs?: (proxyReq: http.ClientRequest, req: http.IncomingMessage, socket: net.Socket, options: httpProxy.ServerOptions, head: any) => void;
    econnreset?: (err: Error, req: http.IncomingMessage, res: http.ServerResponse, target: ProxyTargetUrl) => void;
    end?: (req: http.IncomingMessage, res: http.ServerResponse, proxyRes: http.IncomingMessage) => void;
    /**
     * This event is emitted once the proxy websocket was closed.
     */
    close?: (proxyRes: http.IncomingMessage, proxySocket: net.Socket, proxyHead: any) => void;
}
export interface MockerOption {
    /**
     * `Boolean` Setting req headers host.
     */
    changeHost?: boolean;
    /**
     * rewrite target's url path.
     * Object-keys will be used as RegExp to match paths. [#62](https://github.com/jaywcjlove/mocker-api/issues/62)
     * @default `{}`
     */
    pathRewrite?: Record<string, string>;
    /**
     * Proxy settings, Turn a path string such as `/user/:name` into a regular expression. [path-to-regexp](https://www.npmjs.com/package/path-to-regexp)
     * @default `{}`
     */
    proxy?: Record<string, string>;
    /**
     * Set the [listen event](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events) and [configuration](https://github.com/nodejitsu/node-http-proxy#options) of [http-proxy](https://github.com/nodejitsu/node-http-proxy)
     * @default `{}`
     */
    httpProxy?: {
        options?: httpProxy.ServerOptions;
        listeners?: HttpProxyListeners;
    };
    /**
     * bodyParser settings.
     * @example
     *
     * ```js
     * bodyParser = {"text/plain": "text","text/html": "text"}
     * ```
     *
     * will parsed `Content-Type='text/plain' and Content-Type='text/html'` with `bodyParser.text`
     *
     * @default `{}`
     */
    bodyParserConf?: {
        [key: string]: 'raw' | 'text' | 'urlencoded' | 'json';
    };
    /**
     * [`bodyParserJSON`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserjsonoptions) JSON body parser
     * @default `{}`
     */
    bodyParserJSON?: bodyParser.OptionsJson;
    /**
     * [`bodyParserText`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparsertextoptions) Text body parser
     * @default `{}`
     */
    bodyParserText?: bodyParser.OptionsText;
    /**
     * [`bodyParserRaw`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserrawoptions) Raw body parser
     * @default `{}`
     */
    bodyParserRaw?: bodyParser.Options;
    /**
     * [`bodyParserUrlencoded`](https://github.com/expressjs/body-parser/tree/56a2b73c26b2238bc3050ad90af9ab9c62f4eb97#bodyparserurlencodedoptions) URL-encoded form body parser
     * @default `{}`
     */
    bodyParserUrlencoded?: bodyParser.OptionsUrlencoded;
    /**
     * Options object as defined [chokidar api options](https://github.com/paulmillr/chokidar#api)
     * @default `{}`
     */
    watchOptions?: chokidar.WatchOptions;
    /**
     * Access Control Allow options.
     * @default `{}`
     * @example
     * ```js
     * {
     *  header: {
     *    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
     *  }
     * }
     * ```
     */
    header?: Record<string, string | number | string[]>;
    /**
     * mock 地址前缀
     * @default ``
     */
    forward?: string;
}
export default function (app: Application, watchFile: string | string[] | MockerProxyRoute, conf?: MockerOption): (req: Request, res: Response, next: NextFunction) => void;
