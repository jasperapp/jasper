import {GitHubUserClient} from '../../../Library/GitHub/GitHubUserClient';
import {ArrayUtil} from '../../../Library/Util/ArrayUtil';
import {UserPrefRepo} from '../../UserPrefRepo';
import {StreamClient} from './StreamClient';

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

    // note: query max length is 256
    // https://docs.github.com/en/free-pro-team@latest/github/searching-for-information-on-github/troubleshooting-search-queries#limitations-on-query-length
    const updatedLength = ` updated:>=YYYY-MM-DDThh:mm:ssZ`.length;
    const queries = ArrayUtil.joinWithMax(teams.map(t => `team:${t}`), 256 - updatedLength, ' OR ').map(q => `(${q})`);
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
