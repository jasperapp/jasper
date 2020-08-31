import {TimerUtil} from '../../Util/TimerUtil';

export class GitHubGraphQLClient {
  private readonly options: RequestInit;
  private readonly apiEndPoint: string;

  constructor(accessToken, host, https = true){
    if (!accessToken || !host) {
      console.error('invalid access token or host');
      throw new Error('invalid access token or host');
    }

    const pathPrefix = host === 'api.github.com' ? '' : 'api/';
    this.apiEndPoint = `http${https ? 's' : ''}://${host}/${pathPrefix}graphql`;
    this.options = {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${accessToken}`,
      },
    };
  }

  protected async request<T>(query: string): Promise<{error?: Error; body?: T; statusCode?: number; headers?: Headers}> {
    this.options.body = JSON.stringify({query});

    try {
      const res = await fetch(this.apiEndPoint, this.options);

      const headers = res.headers;
      if (headers.get('x-ratelimit-limit')) {
        const limit = parseInt(headers.get('x-ratelimit-limit'), 10);
        const remaining = parseInt(headers.get('x-ratelimit-remaining'), 10);
        const resetTime = parseInt(headers.get('x-ratelimit-reset'), 10) * 1000;
        const waitMilli = resetTime - Date.now();
        if (remaining === 0) {
          console.warn(`[rate limit remaining] limit = ${limit}, remaining = ${remaining}, resetSec = ${waitMilli/1000}, query = ${query}`);
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
