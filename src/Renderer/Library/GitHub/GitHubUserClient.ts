import {GitHubClient} from './GitHubClient';
import {RemoteUserEntity} from '../Type/RemoteGitHubV3/RemoteIssueEntity';
import {RemoteUserTeamEntity} from '../Type/RemoteGitHubV3/RemoteUserTeamEntity';
import {RemoteUserWatchingEntity} from '../Type/RemoteGitHubV3/RemoteUserWatchingEntity';
import {RemoteGitHubHeaderEntity} from '../Type/RemoteGitHubV3/RemoteGitHubHeaderEntity';

export class GitHubUserClient extends GitHubClient {
  // https://docs.github.com/en/free-pro-team@latest/rest/reference/users#get-the-authenticated-user
  async getUser(): Promise<{error?: Error; user?: RemoteUserEntity; githubHeader?: RemoteGitHubHeaderEntity; statusCode?: number}> {
    // note: アクセストークンのスコープ設定後にキャッシュから読み込ませないためにtをつけている
    const {error, body, githubHeader, statusCode} = await this.request<RemoteUserEntity>(`/user?t=${Date.now()}`);
    if (error) return {error, statusCode};

    return {user: body, githubHeader};
  }

  // https://docs.github.com/en/free-pro-team@latest/rest/reference/teams
  async getUserTeams(page: number = 1, maxPage: number = 10): Promise<{error?: Error; teams?: RemoteUserTeamEntity[]}> {
    const {error, body, headers} = await this.request<RemoteUserTeamEntity[]>('/user/teams', {per_page: 100, page});
    if (error) return {error};

    const teams: RemoteUserTeamEntity[] = body as RemoteUserTeamEntity[];

    const link = headers.get('link');
    if (/page=\d+>; rel="next"/.test(link) && page < maxPage) {
      const res = await this.getUserTeams(page + 1, maxPage);
      if (res.teams) teams.push(...res.teams);
    }

    return {teams};
  }

  async hasTeam(): Promise<{error?: Error; hasTeam?: boolean}> {
    const {error, body} = await this.request<RemoteUserTeamEntity[]>('/user/teams', {per_page: 1, page: 1});
    if (error) return {error};

    return {hasTeam: !!body.length};
  }

  // https://docs.github.com/en/free-pro-team@latest/rest/reference/activity#list-repositories-watched-by-the-authenticated-user
  async getUserWatchings(page: number = 1, maxPage: number = 10): Promise<{error?: Error; watchings?: RemoteUserWatchingEntity[]}> {
    const {error, headers, body} = await this.request<RemoteUserWatchingEntity[]>('/user/subscriptions', {per_page: 100, page});
    if (error) return {error};

    const watchings: RemoteUserWatchingEntity[] = body as RemoteUserWatchingEntity[];

    const link = headers.get('link');
    if (/page=\d+>; rel="next"/.test(link) && page < maxPage) {
      const res = await this.getUserWatchings(page + 1, maxPage);
      if (res.watchings) watchings.push(...res.watchings);
    }

    return {watchings};
  }

  async hasWatching(): Promise<{error?: Error; hasWatching?: boolean}> {
    const {error, body} = await this.request<RemoteUserWatchingEntity[]>('/user/subscriptions', {per_page: 1, page: 1});
    if (error) return {error};

    return {hasWatching: !!body.length};
  }
}
