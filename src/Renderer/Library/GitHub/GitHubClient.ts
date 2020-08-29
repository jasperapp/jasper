import nodePath from 'path';
import {TimerUtil} from '../Util/TimerUtil';

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

  protected async request(path: string, query?: {[key: string]: any}): Promise<{error?: Error; body?: any; statusCode?: number; headers?: Headers}> {
    let requestPath = nodePath.normalize(`/${this.pathPrefix}/${path}`);
    requestPath = requestPath.replace(/\\/g, '/'); // for windows

    if (query) {
      const queryString = Object.keys(query).map(k=> `${k}=${encodeURIComponent(query[k])}`);
      requestPath = `${requestPath}?${queryString.join('&')}`;
    }

    const url = `${this.host}${requestPath}`;

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
          await TimerUtil.sleep(waitMilli);
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
}
