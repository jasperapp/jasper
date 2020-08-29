import {StreamClient} from './StreamClient';
import {UserPrefRepo} from '../../UserPrefRepo';
import {GitHubUserClient} from '../../../Library/GitHub/GitHubUserClient';

export class SystemStreamWatchingClient extends StreamClient {
  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  protected async buildSearchQueries() {
    const {error, watchings} = await this.fetchWatchings();
    if (error) {
      console.error(error);
      return [];
    }

    // hack: github api returns server error when queries is long and per_page is 2 or greater.
    const queries = [];
    for (let i = 0; i < watchings.length; i += 20) {
      const query = watchings.slice(i, i + 20).map((watching)=> `repo:${watching}`).join(' ');
      queries.push(query);
    }
    return queries;
  }

  private async fetchWatchings(): Promise<{error?: Error; watchings?: string[]}> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubUserClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error, watchings: remoteTeams} = await client.getUserWatchings();
    if (error) return {error};

    const watchings = remoteTeams.map(remoteWatch => remoteWatch.full_name);
    return {watchings};
  }
}
