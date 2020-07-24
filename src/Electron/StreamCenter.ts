import moment from 'moment';
import {StreamEmitter} from './StreamEmitter';
import {IssueCenter} from './IssueCenter';
// import {RemoteDB as DB} from './Remote';
import {StreamPolling} from './Infra/StreamPolling';
import {DBIPC} from '../IPC/DBIPC';

class _StreamCenter {
  async findStream(streamId) {
    const res = await DBIPC.selectSingle(`
      select
        *
      from
        streams
      where
        id = ?
    `, [streamId]);
    res.row;
  }

  async findAllStreams() {
    const {rows: streams} = await DBIPC.select(`
      select
        t1.*
        , t2.count as unreadCount
      from
        streams as t1
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
    `);

    for (const stream of streams) {
      if (!stream.unreadCount) stream.unreadCount = 0;
    }

    return streams;
  }

  async findAllFilteredStreams() {
    const {rows: filteredStreams} = await DBIPC.select('select * from filtered_streams order by position');
    const promises = [];
    for (const filteredStream of filteredStreams) {
      const streamId = filteredStream.stream_id;
      const filter = `is:unread ${filteredStream.filter}`; // hack
      promises.push(IssueCenter.findIssues(streamId, filter, -1));
    }
    const tmps = await Promise.all(promises);

    for (let i = 0; i < filteredStreams.length; i++) {
      const filteredStream = filteredStreams[i];
      filteredStream.unreadCount = tmps[i].totalCount;
    }

    return filteredStreams;
  }

  async rewriteStream(streamId, name, queries, notification, color) {
    const {row: stream} = await DBIPC.selectSingle('select * from streams where id = ?', [streamId]);
    const updatedAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

    await DBIPC.exec(
      'update streams set name = ?, queries = ?, updated_at = ?, notification = ?, color = ? where id = ?',
      [name, JSON.stringify(queries), updatedAt, notification, color, streamId]
    );

    if (JSON.stringify(queries) !== stream.queries) {
      await DBIPC.exec('delete from streams_issues where stream_id = ?', [streamId]);
      await DBIPC.exec('update streams set searched_at = null where id = ?', [streamId]);
    }

    await StreamPolling.refreshStream(streamId);
    StreamEmitter.emitRestartAllStreams();
  }

  async createStream(name, queries, notification, color) {
    const createdAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

    const {row: tmp1} = await DBIPC.selectSingle('select max(position) + 1 as pos from streams');
    const {row: tmp2} = await DBIPC.selectSingle('select max(position) + 1 as pos from filtered_streams');
    const pos = Math.max(tmp1.pos, tmp2.pos);

    const {insertedId: streamId} = await DBIPC.exec(
      'insert into streams (name, queries, created_at, updated_at, notification, color, position) values(?, ?, ?, ?, ?, ?, ?)',
      [name, JSON.stringify(queries), createdAt, createdAt, notification, color, pos]
    );

    await StreamPolling.refreshStream(streamId);
    StreamEmitter.emitRestartAllStreams();
  }

  async deleteStream(streamId) {
    await DBIPC.exec('delete from streams where id = ?', [streamId]);
    await DBIPC.exec('delete from streams_issues where stream_id = ?', [streamId]);
    await DBIPC.exec('delete from filtered_streams where stream_id = ?', [streamId]);

    await StreamPolling.deleteStream(streamId);
    StreamEmitter.emitRestartAllStreams();
  }

  async deleteFilteredStream(filteredStreamId) {
    await DBIPC.exec('delete from filtered_streams where id = ?', [filteredStreamId]);
    StreamEmitter.emitRestartAllStreams();
  }

  async updatePosition(streams) {
    const promises = [];
    for (const stream of streams) {
      const p = DBIPC.exec('update streams set position = ? where id = ?', [stream.position, stream.id]);
      promises.push(p);
    }

    await Promise.all(promises);
  }

  async updatePositionForFilteredStream(filteredStreams) {
    const promises = [];
    for (const stream of filteredStreams) {
      const p = DBIPC.exec('update filtered_streams set position = ? where id = ?', [stream.position, stream.id]);
      promises.push(p);
    }

    await Promise.all(promises);
  }

  async createFilteredStream(stream, name, filter, notification, color) {
    const streamId = stream.id;
    const createdAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    const position = stream.position;

    await DBIPC.exec(
      'insert into filtered_streams (stream_id, name, filter, notification, color, created_at, updated_at, position) values(?, ?, ?, ?, ?, ?, ?, ?)',
      [streamId, name, filter, notification, color, createdAt, createdAt, position]
    );
    StreamEmitter.emitRestartAllStreams();
  }

  async rewriteFilteredStream(filteredStreamId, name, filter, notification, color) {
    const updatedAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

    await DBIPC.exec(
      'update filtered_streams set name = ?, filter = ?, notification = ?, color = ?, updated_at = ? where id = ?',
      [name, filter, notification, color, updatedAt, filteredStreamId]
    );

    StreamEmitter.emitRestartAllStreams();
  }
}

export const StreamCenter = new _StreamCenter();
