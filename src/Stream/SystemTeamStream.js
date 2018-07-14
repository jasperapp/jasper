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
    let teams;
    while(1) {
      try {
        teams = await this._fetchTeams();
        Logger.n(`[teams] ${teams.join(', ')}`);
        break;
      } catch (e) {
        Logger.e(e.toString());
        await Timer.sleep(10 * 1000);
      }
    }

    //return [teams.map((team)=> `team:${team}`).join(' ')];
    // hack: github api returns server error when queries is long and per_page is 2 or greater.
    const queries = [];
    for (let i = 0; i < teams.length; i += 20) {
      const query = teams.slice(i, i + 20).map((team)=> `team:${team}`).join(' ');
      queries.push(query);
    }
    return queries;
  }

  async _fetchTeams() {
    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const response = await client.requestImmediate('/user/teams');
    return response.body.map((item)=> {
      const org = item.organization.login;
      const name = item.name.replace(/[/ ]/g, '-'); // if name includes '/', must replace to '-' in github
      return `${org}/${name}`;
    });
  }
}
