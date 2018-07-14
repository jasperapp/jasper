import DB from './DB';

export class SubscriptionIssuesTable {
  async findAll() {
    return await DB.select('select * from subscription_issues order by id');
  }
}

export default new SubscriptionIssuesTable();
