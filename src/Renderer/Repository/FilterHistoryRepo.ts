import {FilterHistoryEntity} from '../Type/FilterHistoryEntity';
import {DateUtil} from '../Infra/Util/DateUtil';
import {DB} from '../Infra/DB';

class _FilterHistoryRepo {
  async getFilterHistories(maxCount: number): Promise<{error?: Error; filterHistories?: FilterHistoryEntity[]}> {
    const {error, rows} = await DB.select<FilterHistoryEntity>(`select * from filter_histories order by created_at desc limit ${maxCount}`);
    if (error) return {error};

    return {filterHistories: rows};
  }

  async createFilterHistory(filterQuery: string): Promise<{error?: Error}> {
    filterQuery = filterQuery.trim();
    if (!filterQuery) return;

    // remove same filter
    const {error: e1, row: sameRes} = await DB.selectSingle<{count: number}>('select count(1) as count from filter_histories where filter = ?', [filterQuery]);
    if (e1) return {error: e1};

    if (sameRes.count) {
      const {error} = await DB.exec('delete from filter_histories where filter = ?', [filterQuery]);
      if (error) return {error};
    }

    // insert
    const createdAt = DateUtil.localToUTCString(new Date());
    const {error: e2} = await DB.exec('insert into filter_histories (filter, created_at) values(?, ?)', [filterQuery, createdAt]);
    if (e2) return {error: e2};

    // delete limitation over rows
    const {error: e3, row: limitationRes} = await DB.selectSingle<{count: number}>('select count(1) as count from filter_histories');
    if (e3) return {error: e3};

    if (limitationRes.count > 100) {
      const {error: e4, rows} = await DB.select<FilterHistoryEntity>('select * from filter_histories order by created_at desc limit 100,100');
      if (e4) return {error: e4};

      const ids = rows.map(row => row.id);
      const {error: e5} = await DB.exec(`delete from filter_histories where id in (${ids.join(',')})`);
      if (e5) return {error: e5};
    }

    return {};
  }
}

export const FilterHistoryRepo = new _FilterHistoryRepo();
