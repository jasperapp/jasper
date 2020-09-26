import {StreamClient} from './StreamClient';
import {UserPrefRepo} from '../../UserPrefRepo';
import {GitHubUserClient} from '../../../Library/GitHub/GitHubUserClient';

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

  private async fetchTeams(): Promise<{error?: Error; teams?: string[]}> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubUserClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {teams: remoteTeams, error} = await client.getUserTeams();
    if (error) return {error};

    const teams = remoteTeams.map(remoteTeam => {
      const org = remoteTeam.organization.login;
      const name = remoteTeam.slug;
      return `${org}/${name}`;
    });

    return {teams};
  }
}
