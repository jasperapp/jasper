import {StreamEntity, StreamRow} from '../Library/Type/StreamEntity';
import {IconNameType} from '../Library/Type/IconNameType';
import {IssueRepo} from './IssueRepo';
import {DB} from '../Library/Infra/DB';
import {DateUtil} from '../Library/Util/DateUtil';

export enum StreamId {
         inbox = -100000,
        unread = -100001,
          open = -100002,
          mark = -100003,
      archived = -100004,
            me = -1,
          team = -2,
      watching = -3,
  subscription = -4,
}

class _StreamRepo {
  private async convert(streamRows: StreamRow[]): Promise<StreamEntity[]> {
    if (!streamRows.length) return [];

    const streams: StreamEntity[] = streamRows.map(row => {
      return {
        ...row,
        queries: JSON.parse(row.queries || '[]'),
        iconName: row.icon as IconNameType,
        queryStreamId: row.query_stream_id,
        defaultFilter: row.default_filter,
        userFilter: row.user_filter,
        unreadCount: 0,
      };
    });

    await this.relationUnreadCount(streams);
    return streams;
  }

  private async relationUnreadCount(streams: StreamEntity[]) {
    const promises = streams.map(s => IssueRepo.getUnreadCountInStream(s.queryStreamId, s.defaultFilter, s.userFilter));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return;

    streams.forEach((s, index) => s.unreadCount = results[index].count);
  }

  async getStreams(streamIds: number[]): Promise<{error?: Error; streams?: StreamEntity[]}> {
    const {error, rows} = await DB.select<StreamRow>(`select * from streams where id in (${streamIds.join(',')}) order by position`);
    if (error) return {error};

    const streams = await this.convert(rows);
    return {streams};
  }

  async getAllStreams(types: StreamRow['type'][]): Promise<{error?: Error; streams?: StreamEntity[]}> {
    const type = types.map(t => `"${t}"`).join(',');
    const {error, rows} = await DB.select<StreamRow>(`select * from streams where type in (${type}) order by position`);
    if (error) return {error};

    const streams = await this.convert(rows);
    return {streams};
  }

  async getStream(streamId: number): Promise<{error?: Error; stream?: StreamEntity}> {
    const {error, streams} = await this.getStreams([streamId]);
    if (error) return {error};

    return {stream: streams[0]};
  }

  async createStream(queryStreamId: number | null, name: string, queries: string[], userFilter: string, notification: number, color: string): Promise<{error?: Error; stream?: StreamEntity}> {
    const type: StreamRow['type'] = queryStreamId === null ? 'userStream' : 'filterStream';
    const icon: IconNameType = type === 'userStream' ? 'github' : 'file-tree';
    const createdAt = DateUtil.localToUTCString(new Date());

    // position
    let pos: number;
    if (type === 'userStream') {
      const {error, row} = await DB.selectSingle<{pos: number}>('select max(position) + 1 as pos from streams where type in ("custom", "child")');
      if (error) return {error};
      pos = row.pos;
    } else if (type === 'filterStream') {
      const {error, row} = await DB.selectSingle<{pos: number}>('select max(position) as pos from streams where id = ?', [queryStreamId]);
      if (error) return {error};
      pos = row.pos;
    }

    // insert
    const {error, insertedId: streamId} = await DB.exec( `
    insert into
      streams (type, name, query_stream_id, queries, created_at, updated_at, notification, color, position, default_filter, user_filter, icon, enabled)
      values (?, ?, ?, ?, ?, ?, ?, ?, ?, "is:unarchived", ?, ?, 1)
    `, [type, name, queryStreamId, JSON.stringify(queries), createdAt, createdAt, notification, color, pos, userFilter, icon]
    );
    if (error) return {error};

    // query_stream_id
    if (queryStreamId === null) {
      const {error} = await DB.exec(`update streams set query_stream_id = ? where id = ?`, [streamId, streamId]);
      if (error) return {error};
    }

    return this.getStream(streamId);
  }

  async updateStream(streamId: number, name: string, queries: string[], userFilter: string, notification: number, color: string, enabled: number): Promise<{error?: Error; stream?: StreamEntity}> {
    const {error: error1, stream} = await this.getStream(streamId);
    if (error1) return {error: error1};

    const updatedAt = DateUtil.localToUTCString(new Date());
    const {error: error2} = await DB.exec( `
    update streams set
      name = ?,
      queries = ?,
      updated_at = ?,
      notification = ?,
      color = ?,
      user_filter = ?,
      enabled = ?
    where
      id = ?
      `,
      [name, JSON.stringify(queries), updatedAt, notification, color, userFilter, enabled, streamId]
    );
    if (error2) return {error: error2};

    // queryが変わっていたらrelationを削除する
    if (JSON.stringify(queries) !== JSON.stringify(stream.queries)) {
      const {error: error3} = await DB.exec('delete from streams_issues where stream_id = ?', [streamId]);
      if (error3) return {error: error3};

      const {error: error4} = await DB.exec('update streams set searched_at = null where id = ?', [streamId]);
      if (error4) return {error: error4};
    }

    return this.getStream(streamId);
  }

  async deleteStream(streamId: number): Promise<{error?: Error}> {
    const {error, row} = await DB.selectSingle<StreamRow>('select * from streams where id = ?', [streamId]);
    if (error) return {error};
    if (row.type !== 'userStream' && row.type !== 'filterStream') return {error: new Error(`stream is not custom and child. streamId = ${streamId}`)};

    const {error: e1} = await DB.exec('delete from streams where id = ?', [streamId]);
    if (e1) return {error: e1};

    if (row.type === 'userStream') {
      const {error} = await DB.exec('delete from streams where query_stream_id = ?', [streamId]);
      if (error) return {error};
    }

    const {error: e2} = await DB.exec('delete from streams_issues where stream_id = ?', [streamId]);
    if (e2) return {error: e2};

    const {error: e3} = await DB.exec('delete from issues where id not in (select issue_id from streams_issues)');
    if (e3) return {error: e3};

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

  async export(): Promise<StreamEntity[]> {
    const {error, streams} = await this.getAllStreams(['userStream', 'filterStream']);
    if (error) return [];
    return streams;
  }

  async import(streams: StreamEntity[]) {
    const customStreams = streams.filter(s => s.type === 'userStream');
    for (const s of customStreams) {
      // create custom stream
      const {error, stream} = await this.createStream(null, s.name, s.queries, s.userFilter, s.notification, s.color);
      if (error) return {error};

      // create child stream
      const childStreams = streams.filter(c => c.type === 'filterStream' && c.queryStreamId === s.id);
      for (const c of childStreams) {
        const {error} = await this.createStream(stream.id, c.name, [], c.userFilter, c.notification, c.color);
        if (error) return {error};
      }
    }
  }
}

export const StreamRepo = new _StreamRepo();
