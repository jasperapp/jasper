import {DBIPC} from '../../IPC/DBIPC';
import {SystemStreamEntity} from '../Type/StreamEntity';
import {IssueRepo} from './IssueRepo';

export enum SystemStreamId {
  me = -1,
  team = -2,
  watching = -3,
  subscription = -4,
}

class _SystemStreamRepo {
  private async relations(systemStreams: SystemStreamEntity[]) {
    if (!systemStreams.length) return;
    await this.relationDefaultFilter(systemStreams);
    await this.relationUnreadCount(systemStreams);
  }

  private async relationDefaultFilter(systemStreams: SystemStreamEntity[]) {
    systemStreams.forEach(s => s.defaultFilter = 'is:unarchived');
  }

  private async relationUnreadCount(systemStreams: SystemStreamEntity[]) {
    const promises = systemStreams.map(s => IssueRepo.getUnreadCountInStream(s.id, s.defaultFilter));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return;

    systemStreams.forEach((s, index) => s.unreadCount = results[index].count);
  }

  async getAllSystemStreams(): Promise<{error?: Error; systemStreams?: SystemStreamEntity[]}> {
    const {error, rows} = await DBIPC.select<SystemStreamEntity>('select * from system_streams order by position');
    if (error) return {error};

    await this.relations(rows);

    return {systemStreams: rows};
  }

  async getSystemStream(streamId: number): Promise<{error?: Error; systemStream?: SystemStreamEntity}> {
    const {error, row} = await DBIPC.selectSingle<SystemStreamEntity>('select * from system_streams where id = ?', [streamId]);
    if (error) return {error};

    await this.relations([row]);

    return {systemStream: row};
  }

  // async all(): Promise<{error?: Error; rows?: SystemStreamEntity[]}> {
  //   return await DBIPC.select('select * from system_streams order by position');
  // }

  // async find(id: number): Promise<{error?: Error; row?: SystemStreamEntity}> {
  //   return await DBIPC.selectSingle('select * from system_streams where id = ?', [id]);
  // }

  async updateSearchedAt(streamId: number, utcString: string): Promise<{error?: Error}> {
    const {error} = await DBIPC.exec(`update system_streams set searched_at = ? where id = ?`, [utcString, streamId]);
    if (error) return {error};

    return {}
  }

  // async findStream(streamId) {
  //   const {row} = await DBIPC.selectSingle(`
  //     select
  //       *
  //     from
  //       system_streams
  //     where
  //       id = ?
  //   `, [streamId]);
  //
  //   return row;
  // }

  // async findAllStreams() {
  //   const {rows: streams} = await DBIPC.select(`
  //     select
  //       t1.*
  //       , t2.count as unreadCount
  //     from
  //       system_streams as t1
  //     left join (
  //       select
  //         stream_id
  //         , count(1) as count
  //       from
  //         streams_issues as t1
  //       inner join
  //         issues as t2 on t1.issue_id = t2.id
  //       where
  //         ((read_at is null) or (updated_at > read_at))
  //          and archived_at is null
  //       group by
  //         stream_id
  //     ) as t2 on t1.id = t2.stream_id
  //     order by
  //       position
  //   `);
  //
  //   for (const stream of streams) {
  //     if (!stream.unreadCount) stream.unreadCount = 0;
  //   }
  //
  //   return streams;
  // }

  async updateSystemStream(streamId: number, enabled: number, notification: number): Promise<{error?: Error}> {
    const {error} = await DBIPC.exec(`update system_streams set enabled = ?, notification = ? where id = ?`, [enabled, notification, streamId]);
    if (error) return {error};

    return {}
  }

  // getStreamQueries(streamId) {
  //   return StreamPolling.getSystemStreamQueries(streamId);
  // }

  // async isSubscription(url) {
  //   const res = await DBIPC.selectSingle('select * from subscription_issues where url = ?', [url]);
  //   return !!res.row;
  // }

  // async subscribe(url) {
  //   const already = await this.isSubscription(url);
  //   if (already) return;
  //
  //   const urlPaths = url.split('/').reverse();
  //   const repo = `${urlPaths[3]}/${urlPaths[2]}`;
  //   const number = urlPaths[0];
  //
  //   const github = ConfigRepo.getConfig().github;
  //   const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
  //   const res = await client.request(`/repos/${repo}/issues/${number}`);
  //   const issue = res.body;
  //
  //   await IssueRepo.import([issue]);
  //   const {error} = await StreamIssueRepo.createBulk(SystemStreamId.subscription, [issue]);
  //   if (error) return console.error(error);
  //
  //   const createdAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
  //   await DBIPC.exec(`
  //     insert into
  //       subscription_issues
  //       (issue_id, repo, url, created_at)
  //     values
  //       (?, ?, ?, ?)
  //   `, [issue.id, repo, url, createdAt]);
  //
  //   await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
  //   SystemStreamEvent.emitRestartAllStreams();
  // }

  // async unsubscribe(url) {
  //   const already = await this.isSubscription(url);
  //   if (!already) return;
  //
  //   const {row: subscriptionIssue} = await DBIPC.selectSingle('select * from subscription_issues where url = ?', [url]);
  //   await DBIPC.exec('delete from subscription_issues where url = ?', [url]);
  //
  //   await DBIPC.exec('delete from streams_issues where stream_id = ? and issue_id = ?', [SystemStreamId.subscription, subscriptionIssue.issue_id]);
  //
  //   // SystemStreamLauncher.restartAll();
  //   await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
  //   SystemStreamEvent.emitRestartAllStreams();
  // }
}

export const SystemStreamRepo = new _SystemStreamRepo();