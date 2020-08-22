import {TimerUtil} from '../../../Infra/Util/TimerUtil';
import {StreamClient} from './StreamClient';
import {GitHubClient} from '../../GitHub/GitHubClient';
import {UserPrefRepo} from '../../UserPrefRepo';

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

  private async fetchWatchings(page = 1): Promise<{error?: Error; watchings?: string[]}> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error, headers, body} = await client.request('/user/subscriptions', {per_page: 100, page});
    if (error) return {error};

    const link = headers.get('link');

    let rest = [];
    if (/page=\d+>; rel="next"/.test(link)) {
      await TimerUtil.sleep(10 * 1000);
      const res = await this.fetchWatchings(page + 1);
      if (res.watchings) rest = res.watchings;
    }

    const watchings = body.map(item => item.full_name).concat(rest);
    return {watchings};
  }
}
