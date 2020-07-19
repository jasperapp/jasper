import Logger from 'color-logger';
import Timer from '../Util/Timer';
import {Config} from '../Config';
import GitHubClient from '../GitHub/GitHubClient';
import Stream from './Stream';

export default class SystemWatchingStream extends Stream {
  constructor(id, name, searchedAt) {
    super(id, name, [], searchedAt);
  }

  async _buildQueries() {
    let watchings;
    while(1) {
      try {
        watchings = await this._fetchWatchings();
        Logger.n(`[watchings] ${watchings.join(', ')}`);
        break;
      } catch (e) {
        Logger.e(e.toString());
        await Timer.sleep(10 * 1000);
      }
    }

    // hack: github api returns server error when queries is long and per_page is 2 or greater.
    //return [watchings.map((watching)=> `repo:${watching}`).join(' ')];
    const queries = [];
    for (let i = 0; i < watchings.length; i += 20) {
      const query = watchings.slice(i, i + 20).map((watching)=> `repo:${watching}`).join(' ');
      queries.push(query);
    }
    return queries;
  }

  async _fetchWatchings(page = 1) {
    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);

    const { headers, body } = await client.requestImmediate('/user/subscriptions', { per_page: 100, page });
    const link = headers.link;

    let rest = [];
    if (/page=\d+>; rel="next"/.test(link)) {
      rest = await this._fetchWatchings(page + 1);
    }

    return body.map((item)=> item.full_name).concat(rest);
  }
}
