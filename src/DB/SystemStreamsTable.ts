import DB from './DB';

export class SystemStreamsTable {
  async all() {
    return await DB.select('select * from system_streams order by position');
  }

  async find(id) {
    return await DB.select('select * from system_streams where id = ?', [id]);
  }

  async updateSearchedAt(streamId, utcString) {
    await DB.exec(`update system_streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }
}

export default new SystemStreamsTable();
