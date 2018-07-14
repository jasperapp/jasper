import Logger from 'color-logger';
import Timer from '../Util/Timer';
import Config from '../Config';
import GitHubClient from '../GitHub/GitHubClient';
import Stream from './Stream';

export default class SystemTeamStream extends Stream {
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

  async _fetchWatchings() {
    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const response = await client.requestImmediate('/user/subscriptions');
    return response.body.map((item)=> item.full_name);
  }
}
