import {StreamClient} from './StreamClient';
import {UserPrefRepo} from '../../UserPrefRepo';
import {GitHubUserClient} from '../../../Library/GitHub/GitHubUserClient';
import {ArrayUtil} from '../../../Library/Util/ArrayUtil';

const SEARCH_QUERY_EXPIRES_IN = 10 * 60 * 1000; // 10mins as msec

export class SystemStreamWatchingClient extends StreamClient {
  private lastBuildSearchQueriesAt: number = 0;
  private lastBuildSearchQueries: string[] = [];

  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  protected async buildSearchQueries() {
    if (Date.now() - this.lastBuildSearchQueriesAt < SEARCH_QUERY_EXPIRES_IN) {
      return this.lastBuildSearchQueries;
    }

    const {error, watchings} = await this.fetchWatchings();
    if (error) {
      console.error(error);
      return [];
    }

    // note: query max length is 256
    // https://docs.github.com/en/free-pro-team@latest/github/searching-for-information-on-github/troubleshooting-search-queries#limitations-on-query-length
    const updatedLength = ` updated:>=YYYY-MM-DDThh:mm:ssZ`.length;
    const queries = ArrayUtil.joinWithMax(watchings.map(w => `repo:${w}`), 256 - updatedLength);
    this.lastBuildSearchQueriesAt = Date.now();
    this.lastBuildSearchQueries = queries;
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
