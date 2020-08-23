import {StreamEntity} from '../Library/Type/StreamEntity';
import {DateUtil} from '../Library/Util/DateUtil';
import {IssueRepo} from './IssueRepo';
import {DB} from '../Library/Infra/DB';

type StreamRow = {
  id: number;
  name: string;
  queries: string;
  position: number;
  notification: number;
  color: string;
  searched_at: string;
}

class _StreamRepo {
  private async relations(streamRows: StreamRow[]): Promise<StreamEntity[]> {
    if (!streamRows.length) return [];

    const streams: StreamEntity[] = streamRows.map(row => {
      return {
        ...row,
        type: 'stream',
        iconName: 'github',
        enabled: 1,
        queryStreamId: row.id,
        defaultFilter: 'is:unarchived',
        filter: '',
        unreadCount: 0,
      };
    });

    await this.relationUnreadCount(streams);
    return streams;
  }

  private async relationUnreadCount(streams: StreamEntity[]) {
    const promises = streams.map(s => IssueRepo.getUnreadCountInStream(s.id, s.defaultFilter));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return;

    streams.forEach((s, index) => s.unreadCount = results[index].count);
  }

  async getStreams(streamIds: number[]): Promise<{error?: Error; streams?: StreamEntity[]}> {
    const {error, rows} = await DB.select<StreamRow>(`select * from streams where id in (${streamIds.join(',')}) order by position`);
    if (error) return {error};

    const streams = await this.relations(rows);
    return {streams};
  }

  async getAllStreams(): Promise<{error?: Error; streams?: StreamEntity[]}> {
    const {error, rows} = await DB.select<StreamRow>(`select * from streams`);
    if (error) return {error};

    const streams = await this.relations(rows);
    return {streams};
  }

  async getStream(streamId: number): Promise<{error?: Error; stream?: StreamEntity}> {
    const {error, streams} = await this.getStreams([streamId]);
    if (error) return {error};

    return {stream: streams[0]};
  }

  async createStream(name: string, queries: string[], notification: number, color: string): Promise<{error?: Error; stream?: StreamEntity}> {
    const createdAt = DateUtil.localToUTCString(new Date());

    const {row: tmp1} = await DB.selectSingle<{pos: number}>('select max(position) + 1 as pos from streams');
    const {row: tmp2} = await DB.selectSingle<{pos: number}>('select max(position) + 1 as pos from filtered_streams');
    const pos = Math.max(tmp1.pos, tmp2.pos);

    const {error, insertedId: streamId} = await DB.exec(
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

    const {error: error2} = await DB.exec(
      'update streams set name = ?, queries = ?, updated_at = ?, notification = ?, color = ? where id = ?',
      [name, JSON.stringify(queries), updatedAt, notification, color, streamId]
    );
    if (error2) return {error: error2};

    // queryが変わっていたらrelationを削除する
    if (JSON.stringify(queries) !== stream.queries) {
      const {error: error3} = await DB.exec('delete from streams_issues where stream_id = ?', [streamId]);
      if (error3) return {error: error3};

      const {error: error4} = await DB.exec('update streams set searched_at = null where id = ?', [streamId]);
      if (error4) return {error: error4};
    }

    return this.getStream(streamId);
  }

  async deleteStream(streamId: number): Promise<{error?: Error}> {
    const {error: e1} = await DB.exec('delete from streams where id = ?', [streamId]);
    if (e1) return {error: e1};

    const {error: e2} = await DB.exec('delete from streams_issues where stream_id = ?', [streamId]);
    if (e2) return {error: e2};

    const {error: e3} = await DB.exec('delete from filtered_streams where stream_id = ?', [streamId]);
    if (e3) return {error: e3};

    const {error: e4} = await DB.exec('delete from issues where id not in (select issue_id from streams_issues)');
    if (e4) return {error: e4};

    return {};
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<{error?: Error}> {
    return await DB.exec(`update streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }

  async updatePositions(streams: StreamEntity[]): Promise<{error?: Error}> {
    const promises = [];
    for (const stream of streams) {
      const p = DB.exec('update streams set position = ? where id = ?', [stream.position, stream.id]);
      promises.push(p);
    }

    const results = await Promise.all(promises) as {error?: Error}[];
    const error = results.find(res => res.error)?.error;
    if (error) return {error};

    return {};
  }
}

export const StreamRepo = new _StreamRepo();
