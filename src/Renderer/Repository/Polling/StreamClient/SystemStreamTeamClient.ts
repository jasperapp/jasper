import {GitHubClient} from '../../../Library/GitHub/GitHubClient';
import {StreamClient} from './StreamClient';
import {UserPrefRepo} from '../../UserPrefRepo';

export class SystemStreamTeamClient extends StreamClient {
  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  protected async buildSearchQueries() {
    const {error, teams} = await this.fetchTeams();
    if (error) {
      console.error(error);
      return [];
    }

    // hack: github api returns server error when queries is long and per_page is 2 or greater.
    const queries = [];
    for (let i = 0; i < teams.length; i += 20) {
      const query = teams.slice(i, i + 20).map((team)=> `team:"${team}"`).join(' ');
      queries.push(query);
    }
    return queries;
  }

  // todo: paging
  private async fetchTeams(): Promise<{error?: Error; teams?: string[]}> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {body, error} = await client.request('/user/teams');
    if (error) return {error};

    const teams = body.map((item)=> {
      const org = item.organization.login;
      const name = item.slug;
      return `${org}/${name}`;
    });

    return {teams};
  }
}
