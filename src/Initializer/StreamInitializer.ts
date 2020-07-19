import {Config} from '../Config';
import DB from '../DB/DB';
import GitHubClient from '../GitHub/GitHubClient';
import GitHubSearchClient from '../GitHub/GitHubSearchClient';
import {DateConverter} from '../Util/DateConverter';

export class StreamInitializer {
  private _loginName: string;
  private _createdAt: string;

  async init() {
    {
      let tmp;
      tmp = await DB.selectSingle('select count(1) as count from streams');
      if (tmp.count > 0) return;

      tmp = await DB.selectSingle('select count(1) as count from issues');
      if (tmp.count > 0) return;
    }

    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const response = await client.requestImmediate('/user');
    this._loginName = response.body.login;
    this._createdAt = DateConverter.localToUTCString(new Date());

    await this._createMyIssueStream();
    await this._createMyPRStream();
    await this._createAssignStream();
    await this._createRepoStream();
  }

  async _createMyIssueStream() {
    const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const query = `is:issue author:${this._loginName}`;
    const response = await client.requestImmediate(query, 1, 10);
    if (!response.body.items.length) return;

    await this._createStream(`[Issue] Me`, [query], '#e3807f');
  }

  async _createMyPRStream() {
    const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const query = `is:pr author:${this._loginName}`;
    const response = await client.requestImmediate(query, 1, 10);
    if (!response.body.items.length) return;

    await this._createStream(`[PR] Me`, [query], '#e3807f');
  }

  async _createAssignStream() {
    const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const query = `assignee:${this._loginName}`;
    const response = await client.requestImmediate(query, 1, 10);
    if (!response.body.items.length) return;

    await this._createStream(`[Assign] Me`, [query], '#e3807f');
  }

  async _createRepoStream() {
    const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const updatedAt = DateConverter.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
    const query = `involves:${this._loginName} updated:>=${updatedAt}`;
    const response = await client.requestImmediate(query, 1, 100);
    if (!response.body.items.length) return;

    const repoCounts = {};
    for (const issue of response.body.items) {
      const paths = issue.url.split('/').reverse();
      const repo = `${paths[3]}/${paths[2]}`;
      if (repoCounts[repo] === undefined) repoCounts[repo] = 0;
      repoCounts[repo]++;
    }

    const items = Object.keys(repoCounts).map((repo)=> [repo, repoCounts[repo]]);
    items.sort((a, b)=> b[1] - a[1]);
    for (let i = 0; i < items.length && i < 3; i++) {
      const [repo, count] = items[i];
      if (count >= 3) {
        const shortName = repo.split('/')[1];
        await this._createStream(`[Repo] ${shortName}`, [`repo:${repo}`], '#7cd688');
      }
    }
  }

  async _createStream(name, queries, color) {
    await DB.exec(
      'insert into streams (name, queries, created_at, updated_at, notification, color) values(?, ?, ?, ?, ?, ?)',
      [name, JSON.stringify(queries), this._createdAt, this._createdAt, 1, color]
    );
  }
}

export default new StreamInitializer();
