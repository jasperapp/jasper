import {JumpNavigationHistoryEntity} from '../Library/Type/JumpNavigationHistoryEntity';
import {DB} from '../Library/Infra/DB';
import {DateUtil} from '../Library/Util/DateUtil';

class _JumpNavigationHistoryRepo {
  async getHistories(maxCount: number): Promise<{error?: Error; histories?: JumpNavigationHistoryEntity[]}> {
    const {error, rows: histories} = await DB.select<JumpNavigationHistoryEntity>(`select * from jump_navigation_histories order by created_at desc limit ${maxCount}`);
    if (error) return {error};
    return {histories};
  }

  async addHistory(keyword: string): Promise<{error?: Error}> {
    // delete same histories
    const {error: e1} = await DB.exec('delete from jump_navigation_histories where keyword = ?', [keyword.trim()]);
    if (e1) return {error: e1};

    // insert history
    const createdAt = DateUtil.localToUTCString(new Date());
    const {error: e2} = await DB.exec('insert into jump_navigation_histories (keyword, created_at) values(?, ?)', [keyword.trim(), createdAt]);
    if (e2) return {error: e2};

    // delete limitation
    const {error: e3} = await DB.exec(`
      delete from
        jump_navigation_histories
      where
        id in (select id from jump_navigation_histories order by created_at desc limit 100, 100)
    `);
    if (e3) return {error: e3};

    return {};
  }

  async deleteHistory(historyId: number): Promise<{error?: Error}> {
    const {error} = await DB.exec('delete from jump_navigation_histories where id = ?', [historyId]);
    if (error) return {error};
    return {};
  }
}

export const JumpNavigationHistoryRepo = new _JumpNavigationHistoryRepo()
