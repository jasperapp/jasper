import {DBIPC} from '../../IPC/DBIPC';
import moment from 'moment';
import {StreamEvent} from '../Event/StreamEvent';
import {StreamEntity} from '../Type/StreamEntity';
import {DateUtil} from '../Util/DateUtil';

class _StreamRepo {
  private async relations(streams: StreamEntity[]) {
    if (!streams.length) return;
    await this.relationUnreadCount(streams);
  }

  private async relationUnreadCount(streams: StreamEntity[]) {
    const streamIds = streams.map(s => s.id);
    const {error, rows} = await DBIPC.select<{stream_id: number, count: number}>(`
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
         and stream_id in (${streamIds.join(',')})
      group by
        stream_id
    `);

    if (error) return console.error(error);

    for (const stream of streams) {
      const row = rows.find(row => row.stream_id === stream.id)
      stream.unreadCount = row?.count || 0;
    }
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

  async getCount(): Promise<{error?: Error; count?: number}> {
    const {row, error} = await DBIPC.selectSingle('select count(1) as count from streams');
    if (error) return {error};
    return {count: row.count};
  }

  // // todo `this.createStream()`と処理がかぶってるのでなんとかする
  // async createStreamWithoutRestart(name: string, queries: string[], notification: number, color: string): Promise<{error?: Error; streamId?: number}> {
  //   const createdAt = DateUtil.localToUTCString(new Date());
  //
  //   const {row: tmp1} = await DBIPC.selectSingle('select max(position) + 1 as pos from streams');
  //   const {row: tmp2} = await DBIPC.selectSingle('select max(position) + 1 as pos from filtered_streams');
  //   const pos = Math.max(tmp1.pos, tmp2.pos);
  //
  //   const {error, insertedId: streamId} = await DBIPC.exec(
  //     'insert into streams (name, queries, created_at, updated_at, notification, color, position) values(?, ?, ?, ?, ?, ?, ?)',
  //     [name, JSON.stringify(queries), createdAt, createdAt, notification, color, pos]
  //   );
  //
  //   if (error) return {error};
  //
  //   return {streamId};
  // }

  async createStream(name, queries, notification, color): Promise<{error?: Error; stream?: StreamEntity}> {
    const createdAt = DateUtil.localToUTCString(new Date());

    const {row: tmp1} = await DBIPC.selectSingle('select max(position) + 1 as pos from streams');
    const {row: tmp2} = await DBIPC.selectSingle('select max(position) + 1 as pos from filtered_streams');
    const pos = Math.max(tmp1.pos, tmp2.pos);

    const {error, insertedId: streamId} = await DBIPC.exec(
      'insert into streams (name, queries, created_at, updated_at, notification, color, position) values(?, ?, ?, ?, ?, ?, ?)',
      [name, JSON.stringify(queries), createdAt, createdAt, notification, color, pos]
    );

    if (error) return {error};

    // await StreamPolling.refreshStream(streamId);
    // StreamEvent.emitRestartAllStreams();

    return this.getStream(streamId);
  }

  // async all(): Promise<{error?: Error; rows?: StreamEntity[]}> {
  //   return await DBIPC.select('select * from streams order by id');
  // }

  async getStream(streamId): Promise<{error?: Error; stream?: StreamEntity}> {
    const {error, streams} = await this.getStreams([streamId]);
    if (error) return {error};

    return {stream: streams[0]};

    // return await DBIPC.selectSingle('select * from streams where id = ?', [streamId]);
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<{error?: Error}> {
    return await DBIPC.exec(`update streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }

  // async findStream(streamId) {
  //   const res = await DBIPC.selectSingle(`
  //     select
  //       *
  //     from
  //       streams
  //     where
  //       id = ?
  //   `, [streamId]);
  //   return res.row;
  // }

  // async findAllStreams() {
  //   const {rows: streams} = await DBIPC.select(`
  //     select
  //       t1.*
  //       , t2.count as unreadCount
  //     from
  //       streams as t1
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
  //   `);
  //
  //   for (const stream of streams) {
  //     if (!stream.unreadCount) stream.unreadCount = 0;
  //   }
  //
  //   return streams;
  // }

  // async findAllFilteredStreams() {
  //   const {rows: filteredStreams} = await DBIPC.select('select * from filtered_streams order by position');
  //   const promises = [];
  //   for (const filteredStream of filteredStreams) {
  //     const streamId = filteredStream.stream_id;
  //     const filter = `is:unread ${filteredStream.filter}`; // hack
  //     promises.push(IssueRepo.findIssues(streamId, filter, -1));
  //   }
  //   const tmps = await Promise.all(promises);
  //
  //   for (let i = 0; i < filteredStreams.length; i++) {
  //     const filteredStream = filteredStreams[i];
  //     filteredStream.unreadCount = tmps[i].totalCount;
  //   }
  //
  //   return filteredStreams;
  // }

  async updateStream(streamId, name, queries, notification, color): Promise<{error?: Error; stream?: StreamEntity}> {
    const {error: error1, stream} = await this.getStream(streamId);
    if (error1) return {error: error1};
    // const {row: stream} = await DBIPC.selectSingle('select * from streams where id = ?', [streamId]);
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
    // await StreamPolling.refreshStream(streamId);
    // StreamEvent.emitRestartAllStreams();
  }

  async deleteStream(streamId: number): Promise<{error?: Error}> {
    const {error: e1} = await DBIPC.exec('delete from streams where id = ?', [streamId]);
    if (e1) return {error: e1};

    const {error: e2} = await DBIPC.exec('delete from streams_issues where stream_id = ?', [streamId]);
    if (e2) return {error: e2};

    const {error: e3} = await DBIPC.exec('delete from filtered_streams where stream_id = ?', [streamId]);
    if (e3) return {error: e3};

    // await StreamPolling.deleteStream(streamId);
    // StreamEvent.emitRestartAllStreams();

    return {};
  }

  // async deleteFilteredStream(filteredStreamId) {
  //   await DBIPC.exec('delete from filtered_streams where id = ?', [filteredStreamId]);
  //   StreamEvent.emitRestartAllStreams();
  // }

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

  // async updatePositionForFilteredStream(filteredStreams) {
  //   const promises = [];
  //   for (const stream of filteredStreams) {
  //     const p = DBIPC.exec('update filtered_streams set position = ? where id = ?', [stream.position, stream.id]);
  //     promises.push(p);
  //   }
  //
  //   await Promise.all(promises);
  // }

  async createFilteredStream(stream, name, filter, notification, color) {
    const streamId = stream.id;
    const createdAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    const position = stream.position;

    await DBIPC.exec(
      'insert into filtered_streams (stream_id, name, filter, notification, color, created_at, updated_at, position) values(?, ?, ?, ?, ?, ?, ?, ?)',
      [streamId, name, filter, notification, color, createdAt, createdAt, position]
    );
    StreamEvent.emitRestartAllStreams();
  }

  async rewriteFilteredStream(filteredStreamId, name, filter, notification, color) {
    const updatedAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

    await DBIPC.exec(
      'update filtered_streams set name = ?, filter = ?, notification = ?, color = ?, updated_at = ? where id = ?',
      [name, filter, notification, color, updatedAt, filteredStreamId]
    );

    StreamEvent.emitRestartAllStreams();
  }
}

export const StreamRepo = new _StreamRepo();
