import {IssueRepo} from '../IssueRepo';
import {UserPrefRepo} from '../UserPrefRepo';
import {GitHubSearchClient} from '../../Library/GitHub/GitHubSearchClient';
import {DateUtil} from '../../Library/Util/DateUtil';
import {StreamId, StreamRepo} from '../StreamRepo';
import {DB} from '../../Library/Infra/DB';

class _StreamSetup {
  async exec() {
    await this.convertSystemMeToUserMe();

    const already = await this.isAlready();
    if (already) return;

    await this.createMeStream();
    await this.createRepoStreams();
  }

  // SystemMeが存在する場合、UserStreamに変換する
  private async convertSystemMeToUserMe() {
    const {error, stream} = await StreamRepo.getStream(StreamId.me);
    if (error) return console.error(error);
    if (!stream) return;

    console.log('migration start: SystemStream(Me) to UserStream(Me)');
    const {error: e0, row} = await DB.selectSingle<{maxId: number}>('select max(id) as maxId from streams');
    if (e0) return console.error(e0);

    const newId = row.maxId + 1;
    const queries = [`involves:${UserPrefRepo.getUser().login}`, `user:${UserPrefRepo.getUser().login}`];
    const params = [
      newId,
      newId,
      'UserStream',
      'github',
      JSON.stringify(queries),
      StreamId.me,
    ];
    const {error: e1} = await DB.exec(`update streams set id = ?, query_stream_id = ?, type = ?, icon = ?, queries = ? where id = ?`, params);
    if (e1) return console.error(e1);

    const {error: e2} = await DB.exec(`update streams_issues set stream_id = ? where stream_id = ?`, [newId, StreamId.me]);
    if (e2) return console.error(e2);
    console.log('migration end: SystemMeStream to UserStream');
  }

  private async isAlready(): Promise<boolean> {
    // stream
    {
      const {error, streams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream', 'ProjectStream']);
      if (error) return true;
      if (streams.length !== 0) return true;
    }

    // issue
    {
      const {error, count} = await IssueRepo.getTotalCount();
      if (error) return true;
      if (count !== 0) return true;
    }

    return false;
  }

  private async createMeStream() {
    // create stream
    const color = '#d93f0b';
    const queries = [`involves:${UserPrefRepo.getUser().login}`, `user:${UserPrefRepo.getUser().login}`];
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Me', queries, '', 1, color);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    const login = UserPrefRepo.getUser().login;
    await StreamRepo.createStream('FilterStream', stream.id, 'My Issues', [], `is:issue author:${login}`, 1, color);
    await StreamRepo.createStream('FilterStream', stream.id, 'My PRs', [], `is:pr author:${login}`, 1, color);
    await StreamRepo.createStream('FilterStream', stream.id, 'Assign', [], `assignee:${login}`, 1, color);
  }

  private async createRepoStreams() {
    // create stream
    const color = '#0e8a16';
    const repos = await this.getUsingRepos();
    const query = repos.map(repo => `repo:${repo}`).join(' ');
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Repo', [query], '', 1, color);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    for (const repo of repos) {
      const shortName = repo.split('/')[1];
      await StreamRepo.createStream('FilterStream', stream.id, `${shortName}`, [], `repo:${repo}`, 1, color);
    }
  }

  private async getUsingRepos(): Promise<string[]> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const updatedAt = DateUtil.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
    const query = `involves:${UserPrefRepo.getUser().login} updated:>=${updatedAt}`;
    const {error, issues} = await client.search(query, 1, 100, false);
    if (error) {
      console.error(error);
      return [];
    }

    if (!issues.length) return [];

    const repoCounts = {};
    for (const issue of issues) {
      const paths = issue.url.split('/').reverse();
      const repo = `${paths[3]}/${paths[2]}`;
      if (!repoCounts[repo]) repoCounts[repo] = 0;
      repoCounts[repo]++;
    }

    const items = Object.keys(repoCounts).map(repo => ({repo: repo, count: repoCounts[repo]}));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 3).map(item => item.repo);
  }
}

export const StreamSetup = new _StreamSetup();
