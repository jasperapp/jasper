import {DB} from './DB';

class _StreamsTable {
  async all() {
    return await DB.select('select * from streams order by id');
  }

  async updateSearchedAt(streamId, utcString) {
    await DB.exec(`update streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }
}

export const StreamsTable = new _StreamsTable();
