import electron from 'electron';
import Logger from 'color-logger';
import _path from 'path';
import https from 'https';
import http from 'http';
import os from 'os';
import {GitHubClientDeliver} from './GitHubClientDeliver';
import {Timer} from '../Util/Timer';
import {Identifier} from '../Util/Identifier';
import {Global} from '../Main/Global';

type Response = {
  body: any;
  headers: any;
  statusCode: number;
}

export class GitHubClient {
  private readonly _accessToken: string;
  private readonly _host: string;
  private readonly _pathPrefix: string;
  private readonly _https: boolean;
  private readonly _userAgent: string;
  private readonly _name: string;

  constructor(accessToken, host, pathPrefix, https = true){
    if (!accessToken || !host) {
      Logger.e('invalid access token or host');
      process.exit(1);
    }

    this._accessToken = accessToken;
    this._host = host;
    this._pathPrefix = pathPrefix;
    this._https = https;
    this._userAgent = this._getUserAgent();
    this._name = `GitHubClient:${Identifier.getId()}`;
  }

  requestImmediate(path, query?) {
    return GitHubClientDeliver.pushImmediate((resolve, reject)=> {
      this._request(path, query).then(resolve).catch(reject);
    }, this._name) as Promise<Response>;
  }

  request(path, query?) {
    return GitHubClientDeliver.push((resolve, reject)=> {
      this._request(path, query).then(resolve).catch(reject);
    }, this._name) as Promise<Response>;
  }

  cancel() {
    GitHubClientDeliver.cancel(this._name);
  }

  _request(path, query) {
    return new Promise(async (resolve, reject)=>{
      let requestPath = _path.normalize(`/${this._pathPrefix}/${path}`);
      requestPath = requestPath.replace(/\\/g, '/'); // for windows

      if (query) {
        const queryString = Object.keys(query).map((k)=> `${k}=${encodeURIComponent(query[k])}`);
        requestPath = `${requestPath}?${queryString.join('&')}`;
      }

      const options = {
        hostname: this._host,
        port: this._https ? 443 : 80,
        path: requestPath,
        headers: {
          'User-Agent': this._userAgent,
          'Authorization': `token ${this._accessToken}`
        }
      };

      // todo: ここでmainWindowに触るのはさすがに微妙なのでなんとかする
      const allCookies = await Global.getMainWindow().webContents.session.cookies.get({
        domain: this._host,
        url: `https://${this._host}`,
      });
      const secureCookies = allCookies.filter(cookie => cookie.secure && cookie.httpOnly)
      if (secureCookies.length) {
        options.headers['Cookie'] = secureCookies.map(cookie => `${cookie.name}=${cookie.value}`).join(';');
      }

      const httpModule = this._https ? https : http;

      this._log(path, query);
      const req = httpModule.request(
        options,
        this._onResponse.bind(this, resolve, reject, options)
      ).on('error', (e)=> reject(e));

      req.end();
    });
  }

  async _onResponse(resolve, reject, requestOptions, res) {
    let body = '';
    const statusCode = res.statusCode;
    const headers = res.headers;

    // github.com has rate limit, but ghe does not have rate limit
    if (headers['x-ratelimit-limit']) {
      const limit = 1 * headers['x-ratelimit-limit'];
      const remaining = 1 * headers['x-ratelimit-remaining'];
      const resetTime = headers['x-ratelimit-reset'] * 1000;
      const waitMilli = resetTime - Date.now();
      Logger.n(`[rate limit remaining] limit = ${limit}, remaining = ${remaining}, resetSec = ${waitMilli/1000}, path = ${requestOptions.path}`);
      if (remaining === 0) {
        const resetTime = headers['x-ratelimit-reset'] * 1000;
        const waitMilli = resetTime - Date.now();
        await Timer.sleep(waitMilli);
      }
    }

    res.setEncoding('utf8');

    res.on('data', (chunk) => body += chunk);

    res.on('end', ()=>{
      if (statusCode !== 200) {
        reject(new Error(body));
        return;
      }

      try {
        body = JSON.parse(body);
        resolve({body, statusCode, headers});
      } catch (e) {
        reject(new Error(body));
      }
    });

    res.resume();
  }

  _log(path, query) {
    if (query) {
      const queryString = Object.keys(query).map((k)=> `${k}=${query[k]}`);
      Logger.n(`[request] ${path}?${queryString.join('&')}`);
    } else {
      Logger.n(`[request] ${path}`);
    }
  }

  _getUserAgent() {
    let version;
    if (electron.app) {
      version = electron.app.getVersion();
    } else {
      version = 'NaN'; // through from setup.html, electron.app is not defined
    }

    return `Jasper/${version} Node/${process.version} Electron/${process.versions.electron} ${os.type()}/${os.release()}`;
  }
}
