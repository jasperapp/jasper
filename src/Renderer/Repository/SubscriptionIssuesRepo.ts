import {DBIPC} from '../../IPC/DBIPC';

class _SubscriptionIssuesRepo {
  async findAll(): Promise<{error?: Error; rows?: any[]}> {
    return await DBIPC.select('select * from subscription_issues order by id');
  }
}

export const SubscriptionIssuesRepo = new _SubscriptionIssuesRepo();
