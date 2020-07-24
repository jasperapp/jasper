import moment from 'moment';
import {SystemStreamEmitter} from './SystemStreamEmitter';
import {
  // RemoteDB as DB,
  RemoteConfig as Config,
  RemoteGitHubClient as GitHubClient,
  // RemoteSystemStreamLauncher as SystemStreamLauncher,
} from './Remote';
import {IssuesRepo} from './Repository/IssuesRepo';
import {StreamsIssuesRepo} from './Repository/StreamsIssuesRepo';
import {StreamPolling} from './Infra/StreamPolling';
import {DBIPC} from '../IPC/DBIPC';

class _SystemStreamCenter {
  // get STREAM_ID_ME() { return -1; }
  // get STREAM_ID_TEAM() { return -2; }
  // get STREAM_ID_WATCHING() { return -3; }
  get STREAM_ID_SUBSCRIPTION() { return -4; }

  async findStream(streamId) {
    const {row} = await DBIPC.selectSingle(`
      select
        *
      from
        system_streams
      where
        id = ?
    `, [streamId]);

    return row;
  }

  async findAllStreams() {
    const {rows: streams} = await DBIPC.select(`
      select
        t1.*
        , t2.count as unreadCount
      from
        system_streams as t1
      left join (
        select
          stream_id
          , count(1) as count
        from
          streams_issues as t1
        inner join
          issues as t2 on t1.issue_id = t2.id
        where
          ((read_at is null) or (updated_at > read_at))
           and archived_at is null
        group by
          stream_id
      ) as t2 on t1.id = t2.stream_id
      order by
        position
    `);

    for (const stream of streams) {
      if (!stream.unreadCount) stream.unreadCount = 0;
    }

    return streams;
  }

  async rewriteStream(streamId, enabled, notification) {
    await DBIPC.exec(`
      update
        system_streams
      set
        enabled = ?, notification = ?
      where
        id = ?
    `, [enabled, notification, streamId]);
    // SystemStreamLauncher.restartAll();
    await StreamPolling.refreshSystemStream(streamId, enabled);
    SystemStreamEmitter.emitRestartAllStreams();
  }

  getStreamQueries(streamId) {
    // return SystemStreamLauncher.getStreamQueries(streamId);
    return StreamPolling.getSystemStreamQueries(streamId);
  }

  async isSubscription(url) {
    const res = await DBIPC.selectSingle('select * from subscription_issues where url = ?', [url]);
    return !!res.row;
  }

  async subscribe(url) {
    const already = await this.isSubscription(url);
    if (already) return;

    const urlPaths = url.split('/').reverse();
    const repo = `${urlPaths[3]}/${urlPaths[2]}`;
    const number = urlPaths[0];

    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const res = await client.requestImmediate(`/repos/${repo}/issues/${number}`);
    const issue = res.body;

    await IssuesRepo.import([issue]);
    await StreamsIssuesRepo.import(this.STREAM_ID_SUBSCRIPTION, [issue]);

    const createdAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    await DBIPC.exec(`
      insert into
        subscription_issues
        (issue_id, repo, url, created_at)
      values
        (?, ?, ?, ?)
    `, [issue.id, repo, url, createdAt]);

    // SystemStreamLauncher.restartAll();
    await StreamPolling.refreshSystemStream(this.STREAM_ID_SUBSCRIPTION, true);
    SystemStreamEmitter.emitRestartAllStreams();
  }

  async unsubscribe(url) {
    const already = await this.isSubscription(url);
    if (!already) return;

    const {row: subscriptionIssue} = await DBIPC.selectSingle('select * from subscription_issues where url = ?', [url]);
    await DBIPC.exec('delete from subscription_issues where url = ?', [url]);

    await DBIPC.exec('delete from streams_issues where stream_id = ? and issue_id = ?', [this.STREAM_ID_SUBSCRIPTION, subscriptionIssue.issue_id]);

    // SystemStreamLauncher.restartAll();
    await StreamPolling.refreshSystemStream(this.STREAM_ID_SUBSCRIPTION, true);
    SystemStreamEmitter.emitRestartAllStreams();
  }
}

export const SystemStreamCenter = new _SystemStreamCenter();
