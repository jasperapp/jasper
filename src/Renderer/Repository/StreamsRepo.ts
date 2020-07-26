import {DBIPC} from '../../IPC/DBIPC';
import {DateConverter} from '../../Util/DateConverter';

export type StreamRow = {
  id: number;
  name: number;
  queries: string;
  searched_at: string;
  position: number;
}

class _StreamsRepo {
  async getCount(): Promise<{error?: Error; count?: number}> {
    const {row, error} = await DBIPC.selectSingle('select count(1) as count from streams');
    if (error) return {error};
    return {count: row.count};
  }

  async createStream(name: string, queries: string[], notification: number, color: string): Promise<{error?: Error; streamId?: number}> {
    const createdAt = DateConverter.localToUTCString(new Date());

    const {row: tmp1} = await DBIPC.selectSingle('select max(position) + 1 as pos from streams');
    const {row: tmp2} = await DBIPC.selectSingle('select max(position) + 1 as pos from filtered_streams');
    const pos = Math.max(tmp1.pos, tmp2.pos);

    const {error, insertedId: streamId} = await DBIPC.exec(
      'insert into streams (name, queries, created_at, updated_at, notification, color, position) values(?, ?, ?, ?, ?, ?, ?)',
      [name, JSON.stringify(queries), createdAt, createdAt, notification, color, pos]
    );

    if (error) return {error};

    return {streamId};
  }

  async all(): Promise<{error?: Error; rows?: StreamRow[]}> {
    return await DBIPC.select('select * from streams order by id');
  }

  async find(streamId): Promise<{error?: Error; row?: StreamRow}> {
    return await DBIPC.selectSingle('select * from streams where id = ?', [streamId]);
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<void> {
    await DBIPC.exec(`update streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }
}

export const StreamsRepo = new _StreamsRepo();
