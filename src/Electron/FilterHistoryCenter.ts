import moment from 'moment';
import {RemoteDB as DB} from './Remote';

export class FilterHistoryCenter {
  async find(maxCount) {
    return await DB.select(`select * from filter_histories order by created_at desc limit ${maxCount}`);
  }

  async add(filterQuery) {
    filterQuery = filterQuery.trim();
    if (!filterQuery) return;

    // remove same filter
    const sameRes = await DB.selectSingle('select count(1) as count from filter_histories where filter = ?', [filterQuery]);
    if (sameRes.count) await DB.exec('delete from filter_histories where filter = ?', [filterQuery]);

    // insert
    const createdAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    await DB.exec('insert into filter_histories (filter, created_at) values(?, ?)', [filterQuery, createdAt]);

    // delete limitation over rows
    const limitationRes = await DB.selectSingle('select count(1) as count from filter_histories');
    if (limitationRes.count > 100) {
      const rows = await DB.select('select * from filter_histories order by created_at desc limit 100,100');
      const ids = rows.map((row)=> row.id);
      await DB.exec(`delete from filter_histories where id in (${ids.join(',')})`);
    }
  }
}

export default new FilterHistoryCenter();
