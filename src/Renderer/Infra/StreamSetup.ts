import {StreamRepo} from '../Repository/StreamRepo';
import {IssueRepo} from '../Repository/IssueRepo';
import {ConfigRepo} from '../Repository/ConfigRepo';
import {FilteredStreamRepo} from '../Repository/FilteredStreamRepo';
import {GitHubSearchClient} from './GitHubSearchClient';
import {DateUtil} from '../Util/DateUtil';

class _StreamSetup {
  async exec() {
    const already = await this.isAlready();
    if (already) return;

    await this.createMeStream();
    await this.createRepoStreams();
  }

  private async isAlready(): Promise<boolean> {
    // stream
    {
      const {error, count} = await StreamRepo.getCount();
      if (error) return true;
      if (count !== 0) return true;
    }

    // issue
    {
      const {error, count} = await IssueRepo.getCount();
      if (error) return true;
      if (count !== 0) return true;
    }

    return false;
  }

  private async createMeStream() {
    // create stream
    const color = '#e3807f';
    const queries = [`involves:${ConfigRepo.getLoginName()}`, `user:${ConfigRepo.getLoginName()}`];
    const {error, streamId} = await StreamRepo.createStreamWithoutRestart('Me', queries, 1, color);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    {
      const {error, stream} = await StreamRepo.getStream(streamId);
      if (error) {
        console.error(error);
        return;
      }

      const login = ConfigRepo.getLoginName();
      await FilteredStreamRepo.createFilteredStream(stream, 'My Issues', `is:issue author:${login}`, 1, color);
      await FilteredStreamRepo.createFilteredStream(stream, 'My PRs', `is:pr author:${login}`, 1, color);
      await FilteredStreamRepo.createFilteredStream(stream, 'Assign', `assignee:${login}`, 1, color);
    }
  }

  private async createRepoStreams() {
    // create stream
    const color = '#7cd688';
    const repos = await this.getUsingRepos();
    const query = repos.map(repo => `repo:${repo}`).join(' ');
    const {error, streamId} = await StreamRepo.createStreamWithoutRestart('Repo', [query], 1, color);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    {
      const {error, stream} = await StreamRepo.getStream(streamId);
      if (error) {
        console.error(error);
        return;
      }

      for (const repo of repos) {
        const shortName = repo.split('/')[1];
        await FilteredStreamRepo.createFilteredStream(stream, `${shortName}`, `repo:${repo}`, 1, color);
      }
    }
  }

  private async getUsingRepos(): Promise<string[]> {
    const github = ConfigRepo.getConfig().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const updatedAt = DateUtil.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
    const query = `involves:${ConfigRepo.getLoginName()} updated:>=${updatedAt}`;
    const {error, body} = await client.search(query, 1, 100, false);
    if (error) {
      console.error(error);
      return [];
    }

    if (!body.items.length) return [];

    const repoCounts = {};
    for (const issue of body.items) {
      const paths = issue.url.split('/').reverse();
      const repo = `${paths[3]}/${paths[2]}`;
      if (!repoCounts[repo]) repoCounts[repo] = 0;
      repoCounts[repo]++;
    }

    const items = Object.keys(repoCounts).map(repo => ({repo: repo, count: repoCounts[repo]}));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 3).map(item => item.repo);
  }

  // private async _createMyIssueStream() {
  //   const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
  //   const query = `is:issue author:${this._loginName}`;
  //   const response = await client.requestImmediate(query, 1, 10);
  //   if (!response.body.items.length) return;
  //
  //   await this._createStream(`[Issue] Me`, [query], '#e3807f');
  // }

  // async _createMyPRStream() {
  //   const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
  //   const query = `is:pr author:${this._loginName}`;
  //   const response = await client.requestImmediate(query, 1, 10);
  //   if (!response.body.items.length) return;
  //
  //   await this._createStream(`[PR] Me`, [query], '#e3807f');
  // }

  // async _createAssignStream() {
  //   const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
  //   const query = `assignee:${this._loginName}`;
  //   const response = await client.requestImmediate(query, 1, 10);
  //   if (!response.body.items.length) return;
  //
  //   await this._createStream(`[Assign] Me`, [query], '#e3807f');
  // }

  // async _createRepoStream() {
  //   const client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
  //   const updatedAt = DateConverter.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
  //   const query = `involves:${this._loginName} updated:>=${updatedAt}`;
  //   const response = await client.requestImmediate(query, 1, 100);
  //   if (!response.body.items.length) return;
  //
  //   const repoCounts = {};
  //   for (const issue of response.body.items) {
  //     const paths = issue.url.split('/').reverse();
  //     const repo = `${paths[3]}/${paths[2]}`;
  //     if (repoCounts[repo] === undefined) repoCounts[repo] = 0;
  //     repoCounts[repo]++;
  //   }
  //
  //   const items = Object.keys(repoCounts).map((repo)=> [repo, repoCounts[repo]]);
  //   items.sort((a, b)=> b[1] - a[1]);
  //   for (let i = 0; i < items.length && i < 3; i++) {
  //     const [repo, count] = items[i];
  //     if (count >= 3) {
  //       const shortName = repo.split('/')[1];
  //       await this._createStream(`[Repo] ${shortName}`, [`repo:${repo}`], '#7cd688');
  //     }
  //   }
  // }
  //
  // async _createStream(name, queries, color) {
  //   await DB.exec(
  //     'insert into streams (name, queries, created_at, updated_at, notification, color) values(?, ?, ?, ?, ?, ?)',
  //     [name, JSON.stringify(queries), this._createdAt, this._createdAt, 1, color]
  //   );
  // }
}

export const StreamSetup = new _StreamSetup();
