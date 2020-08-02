import {DBIPC} from '../../IPC/DBIPC';
import {StreamEntity} from '../Type/StreamEntity';
import {DateUtil} from '../Util/DateUtil';
import {IssueRepo} from './IssueRepo';

class _StreamRepo {
  private async relations(streams: StreamEntity[]) {
    if (!streams.length) return;
    await this.relationDefaultFilter(streams);
    await this.relationUnreadCount(streams);
  }

  private async relationDefaultFilter(streams: StreamEntity[]) {
    streams.forEach(s => s.defaultFilter = 'is:unarchived');
  }

  private async relationUnreadCount(streams: StreamEntity[]) {
    const promises = streams.map(s => IssueRepo.getUnreadCountInStream(s.id, s.defaultFilter));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return;

    streams.forEach((s, index) => s.unreadCount = results[index].count);
  }

  async getStreams(streamIds: number[]): Promise<{error?: Error; streams?: StreamEntity[]}> {
    const {error, rows: streams} = await DBIPC.select<StreamEntity>(`select * from streams where id in (${streamIds.join(',')})`);
    if (error) return {error};

    await this.relations(streams);
    return {streams};
  }

  async getAllStreams(): Promise<{error?: Error; streams?: StreamEntity[]}> {
    const {error, rows: streams} = await DBIPC.select<StreamEntity>(`select * from streams`);
    if (error) return {error};

    await this.relations(streams);
    return {streams};
  }

  async getStream(streamId: number): Promise<{error?: Error; stream?: StreamEntity}> {
    const {error, streams} = await this.getStreams([streamId]);
    if (error) return {error};

    return {stream: streams[0]};
  }

  async createStream(name: string, queries: string[], notification: number, color: string): Promise<{error?: Error; stream?: StreamEntity}> {
    const createdAt = DateUtil.localToUTCString(new Date());

    const {row: tmp1} = await DBIPC.selectSingle('select max(position) + 1 as pos from streams');
    const {row: tmp2} = await DBIPC.selectSingle('select max(position) + 1 as pos from filtered_streams');
    const pos = Math.max(tmp1.pos, tmp2.pos);

    const {error, insertedId: streamId} = await DBIPC.exec(
      'insert into streams (name, queries, created_at, updated_at, notification, color, position) values(?, ?, ?, ?, ?, ?, ?)',
      [name, JSON.stringify(queries), createdAt, createdAt, notification, color, pos]
    );

    if (error) return {error};

    return this.getStream(streamId);
  }

  async updateStream(streamId: number, name: string, queries: string[], notification: number, color: string): Promise<{error?: Error; stream?: StreamEntity}> {
    const {error: error1, stream} = await this.getStream(streamId);
    if (error1) return {error: error1};
    const updatedAt = DateUtil.localToUTCString(new Date());

    const {error: error2} = await DBIPC.exec(
      'update streams set name = ?, queries = ?, updated_at = ?, notification = ?, color = ? where id = ?',
      [name, JSON.stringify(queries), updatedAt, notification, color, streamId]
    );
    if (error2) return {error: error2};

    if (JSON.stringify(queries) !== stream.queries) {
      const {error: error3} = await DBIPC.exec('delete from streams_issues where stream_id = ?', [streamId]);
      if (error3) return {error: error3};

      const {error: error4} = await DBIPC.exec('update streams set searched_at = null where id = ?', [streamId]);
      if (error4) return {error: error4};
    }

    return this.getStream(streamId);
  }

  async deleteStream(streamId: number): Promise<{error?: Error}> {
    const {error: e1} = await DBIPC.exec('delete from streams where id = ?', [streamId]);
    if (e1) return {error: e1};

    const {error: e2} = await DBIPC.exec('delete from streams_issues where stream_id = ?', [streamId]);
    if (e2) return {error: e2};

    const {error: e3} = await DBIPC.exec('delete from filtered_streams where stream_id = ?', [streamId]);
    if (e3) return {error: e3};

    return {};
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<{error?: Error}> {
    return await DBIPC.exec(`update streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }

  async updatePosition(streams: StreamEntity[]): Promise<{error?: Error}> {
    const promises = [];
    for (const stream of streams) {
      const p = DBIPC.exec('update streams set position = ? where id = ?', [stream.position, stream.id]);
      promises.push(p);
    }

    const results = await Promise.all(promises) as {error?: Error}[];
    const error = results.find(res => res.error)?.error;
    if (error) return {error};

    return {};
  }
}

export const StreamRepo = new _StreamRepo();
