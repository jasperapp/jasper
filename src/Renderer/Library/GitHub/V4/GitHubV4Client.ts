import {RemoteGitHubV4Entity} from '../../Type/RemoteGitHubV4/RemoteGitHubV4Entity';
import {TimerUtil} from '../../Util/TimerUtil';
import {Logger} from '../../Infra/Logger';

export class GitHubV4Client {
  private readonly options: RequestInit;
  private readonly apiEndPoint: string;
  protected readonly gheVersion: string;
  protected readonly isGitHubCom: boolean;

  constructor(accessToken: string, host: string, https: boolean, gheVersion: string) {
    if (!accessToken || !host) {
      console.error('invalid access token or host');
      throw new Error('invalid access token or host');
    }

    this.isGitHubCom = host === 'api.github.com';
    const pathPrefix = this.isGitHubCom ? '' : 'api/';
    this.gheVersion = this.isGitHubCom ? '' : gheVersion;
    this.apiEndPoint = `http${https ? 's' : ''}://${host}/${pathPrefix}graphql`;
    this.options = {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${accessToken}`,
      },
    };
  }

  protected async request<T extends RemoteGitHubV4Entity>(query: string): Promise<{error?: Error; data?: T; statusCode?: number; headers?: Headers}> {
    this.options.body = this.buildRequestBody(query);

    try {
      const res = await fetch(this.apiEndPoint, this.options);

      if (res.status !== 200) {
        const errorText = await res.text();
        Logger.error(GitHubV4Client.name, `request error`, {error: new Error(errorText), statusCode: res.status});
        return {error: new Error(errorText), statusCode: res.status}
      }

      const body = await res.json() as {data: T, errors: Array<{message: string; type?: string}>};
      if (body.errors) {
        Logger.error(GitHubV4Client.name, `response has errors`, {
          errors: body.errors.map(e => ({message: e.message, type: e.type}))
        });
        const allNotFound = body.errors.every(error => error.type === 'NOT_FOUND' || error.type === 'FORBIDDEN');
        if (allNotFound) {
          // partial success
        } else {
          return {error: new Error(body.errors[0]?.message), statusCode: res.status};
        }
      }

      const data = body.data;
      await this.waitRateLimit(data);

      return {data, statusCode: res.status, headers: res.headers};
    } catch(e) {
      Logger.error(GitHubV4Client.name, `request error`, {errors: e});
      return {error: e};
    }
  }

  private buildRequestBody(query: string): string {
    const graphqlQuery = QUERY_TEMPLATE.replace(`__QUERY__`, query);
    return JSON.stringify({query: graphqlQuery});
  }

  private async waitRateLimit(data: RemoteGitHubV4Entity) {
    // GHEの場合、rateLimitが設定されていない場合がある
    if (!data.rateLimit) return;
    if (data.rateLimit.remaining > 0) return;

    const resetAtMillSec = new Date(data.rateLimit.resetAt).getTime();
    const waitMillSec = resetAtMillSec - Date.now();
    Logger.warning(GitHubV4Client.name, 'rate limit', {resetSec: waitMillSec / 1000});
    await TimerUtil.sleep(waitMillSec);
  }
}

const QUERY_TEMPLATE = `
query {
  __QUERY__
  
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
`;
