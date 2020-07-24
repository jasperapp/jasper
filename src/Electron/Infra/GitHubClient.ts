import nodePath from 'path';
import {Timer} from '../../Util/Timer';

export type Response = {
  body?: any;
  headers?: any;
  statusCode?: number;
  error?: Error;
}

export class GitHubClient {
  private readonly host: string;
  private readonly options: RequestInit;
  private readonly pathPrefix: string;

  constructor(accessToken, host, pathPrefix, https = true){
    if (!accessToken || !host) {
      console.error('invalid access token or host');
      throw new Error('invalid access token or host');
    }

    this.host = `http${https ? 's' : ''}://${host}`;
    this.pathPrefix = pathPrefix;
    this.options = {
      headers: {
        'Authorization': `token ${accessToken}`
      }
    }
  }

  async request(path: string, query?: {[key: string]: any}): Promise<Response> {
    let requestPath = nodePath.normalize(`/${this.pathPrefix}/${path}`);
    requestPath = requestPath.replace(/\\/g, '/'); // for windows

    if (query) {
      const queryString = Object.keys(query).map(k=> `${k}=${encodeURIComponent(query[k])}`);
      requestPath = `${requestPath}?${queryString.join('&')}`;
    }

    const url = `${this.host}${requestPath}`;

    // this.log(path, query);

    try {
      const res = await fetch(url, this.options);

      const headers = res.headers;
      if (headers.get('x-ratelimit-limit')) {
        const limit = parseInt(headers.get('x-ratelimit-limit'), 10);
        const remaining = parseInt(headers.get('x-ratelimit-remaining'), 10);
        const resetTime = parseInt(headers.get('x-ratelimit-reset'), 10) * 1000;
        const waitMilli = resetTime - Date.now();
        if (remaining === 0) {
          console.warn(`[rate limit remaining] limit = ${limit}, remaining = ${remaining}, resetSec = ${waitMilli/1000}, path = ${path}`);
          await Timer.sleep(waitMilli);
        }
      }

      if (res.status !== 200) {
        const errorText = await res.text();
        return {error: new Error(errorText), statusCode: res.status}
      }

      const body = await res.json();
      return {body, statusCode: res.status, headers: res.headers};
    } catch(e) {
      return {error: e};
    }
  }

  // async _onResponse(resolve, reject, requestOptions, res) {
  //   let body = '';
  //   const statusCode = res.statusCode;
  //   const headers = res.headers;
  //
  //   // github.com has rate limit, but ghe does not have rate limit
  //   if (headers['x-ratelimit-limit']) {
  //     const limit = 1 * headers['x-ratelimit-limit'];
  //     const remaining = 1 * headers['x-ratelimit-remaining'];
  //     const resetTime = headers['x-ratelimit-reset'] * 1000;
  //     const waitMilli = resetTime - Date.now();
  //     console.log(`[rate limit remaining] limit = ${limit}, remaining = ${remaining}, resetSec = ${waitMilli/1000}, path = ${requestOptions.path}`);
  //     if (remaining === 0) {
  //       const resetTime = headers['x-ratelimit-reset'] * 1000;
  //       const waitMilli = resetTime - Date.now();
  //       await Timer.sleep(waitMilli);
  //     }
  //   }
  //
  //   res.setEncoding('utf8');
  //
  //   res.on('data', (chunk) => body += chunk);
  //
  //   res.on('end', ()=>{
  //     if (statusCode !== 200) {
  //       reject(new Error(body));
  //       return;
  //     }
  //
  //     try {
  //       body = JSON.parse(body);
  //       resolve({body, statusCode, headers});
  //     } catch (e) {
  //       reject(new Error(body));
  //     }
  //   });
  //
  //   res.resume();
  // }

  // log(path, query) {
  //   if (query) {
  //     const queryString = Object.keys(query).map((k)=> `${k}=${query[k]}`);
  //     console.log(`[request] ${path}?${queryString.join('&')}`);
  //   } else {
  //     console.log(`[request] ${path}`);
  //   }
  // }

  // _getUserAgent() {
  //   let version;
  //   if (electron.app) {
  //     version = electron.app.getVersion();
  //   } else {
  //     version = 'NaN'; // through from setup.html, electron.app is not defined
  //   }
  //
  //   return `Jasper/${version} Node/${process.version} Electron/${process.versions.electron} ${os.type()}/${os.release()}`;
  // }
}
