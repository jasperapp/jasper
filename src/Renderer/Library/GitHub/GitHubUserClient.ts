import {GitHubClient} from './GitHubClient';
import {RemoteUserEntity} from '../Type/RemoteIssueEntity';
import {RemoteUserTeamEntity} from '../Type/RemoteUserTeamEntity';
import {RemoteUserWatchingEntity} from '../Type/RemoteUserWatchingEntity';

export class GitHubUserClient extends GitHubClient {
  // https://docs.github.com/en/rest/reference/users#get-the-authenticated-user
  async getUser(): Promise<{error?: Error; user?: RemoteUserEntity}> {
    const {error, body} = await this.request('/user');
    if (error) return {error};

    return {user: body};
  }

  // https://docs.github.com/en/rest/reference/teams
  async getUserTeams(page: number = 1): Promise<{error?: Error; teams?: RemoteUserTeamEntity[]}> {
    const {error, body, headers} = await this.request('/user/teams', {per_page: 100, page});
    if (error) return {error};

    const teams: RemoteUserTeamEntity[] = body as RemoteUserTeamEntity[];

    const link = headers.get('link');
    if (/page=\d+>; rel="next"/.test(link)) {
      const res = await this.getUserTeams(page + 1);
      if (res.teams) teams.push(...res.teams);
    }

    return {teams};
  }

  // https://docs.github.com/en/rest/reference/activity#list-repositories-watched-by-the-authenticated-user
  async getUserWatchings(page: number = 1): Promise<{error?: Error; watchings?: RemoteUserWatchingEntity[]}> {
    const {error, headers, body} = await this.request('/user/subscriptions', {per_page: 100, page});
    if (error) return {error};

    const watchings: RemoteUserWatchingEntity[] = body as RemoteUserWatchingEntity[];

    const link = headers.get('link');
    if (/page=\d+>; rel="next"/.test(link)) {
      const res = await this.getUserWatchings(page + 1);
      if (res.watchings) watchings.push(...res.watchings);
    }

    return {watchings};
  }
}
