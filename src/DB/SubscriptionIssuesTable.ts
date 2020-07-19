import {DB} from './DB';

class _SubscriptionIssuesTable {
  async findAll() {
    return await DB.select('select * from subscription_issues order by id');
  }
}

export const SubscriptionIssuesTable = new _SubscriptionIssuesTable();
