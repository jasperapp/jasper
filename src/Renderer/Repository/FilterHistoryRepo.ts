import moment from 'moment';
import {DBIPC} from '../../IPC/DBIPC';
import {FilterHistoryEntity} from '../Type/FilterHistoryEntity';

class _FilterHistoryRepo {
  async getFilterHistories(maxCount: number): Promise<{error?: Error; filterHistories?: FilterHistoryEntity[]}> {
    const {error, rows} = await DBIPC.select<FilterHistoryEntity>(`select * from filter_histories order by created_at desc limit ${maxCount}`);
    if (error) return {error};

    return {filterHistories: rows};
  }

  async add(filterQuery) {
    filterQuery = filterQuery.trim();
    if (!filterQuery) return;

    // remove same filter
    const {row: sameRes} = await DBIPC.selectSingle('select count(1) as count from filter_histories where filter = ?', [filterQuery]);
    if (sameRes.count) await DBIPC.exec('delete from filter_histories where filter = ?', [filterQuery]);

    // insert
    const createdAt = moment(new Date()).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    await DBIPC.exec('insert into filter_histories (filter, created_at) values(?, ?)', [filterQuery, createdAt]);

    // delete limitation over rows
    const {row: limitationRes} = await DBIPC.selectSingle('select count(1) as count from filter_histories');
    if (limitationRes.count > 100) {
      const {rows} = await DBIPC.select('select * from filter_histories order by created_at desc limit 100,100');
      const ids = rows.map((row)=> row.id);
      await DBIPC.exec(`delete from filter_histories where id in (${ids.join(',')})`);
    }
  }
}

export const FilterHistoryRepo = new _FilterHistoryRepo();
