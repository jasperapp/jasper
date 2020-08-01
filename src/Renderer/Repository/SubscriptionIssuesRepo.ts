import {DBIPC} from '../../IPC/DBIPC';
import {SubscriptionIssueEntity} from '../Type/SubscriptionIssueEntity';

class _SubscriptionIssuesRepo {
  async getAllSubscriptionIssues(): Promise<{error?: Error; subscriptionIssues?: SubscriptionIssueEntity[]}>{
    const {error, rows} = await DBIPC.select<SubscriptionIssueEntity>('select * from subscription_issues order by id');
    if (error) return {error};

    return {subscriptionIssues: rows};
  }
}

export const SubscriptionIssuesRepo = new _SubscriptionIssuesRepo();
