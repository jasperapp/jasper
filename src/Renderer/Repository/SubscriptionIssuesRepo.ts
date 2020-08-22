import {SubscriptionIssueEntity} from '../Type/SubscriptionIssueEntity';
import {UserPrefRepo} from './UserPrefRepo';
import {GitHubClient} from './GitHub/GitHubClient';
import {IssueRepo} from './IssueRepo';
import {SystemStreamId} from './SystemStreamRepo';
import {DateUtil} from '../Util/DateUtil';
import {GitHubUtil} from '../Util/GitHubUtil';
import {DB} from '../Infra/DB';

class _SubscriptionIssuesRepo {
  async getAllSubscriptionIssues(): Promise<{error?: Error; subscriptionIssues?: SubscriptionIssueEntity[]}>{
    const {error, rows} = await DB.select<SubscriptionIssueEntity>('select * from subscription_issues order by id');
    if (error) return {error};

    return {subscriptionIssues: rows};
  }

  private async getSubscriptionIssue(url: string): Promise<{error?: Error; subscriptionIssue?: SubscriptionIssueEntity}> {
    const {error, row} = await DB.selectSingle<SubscriptionIssueEntity>('select * from subscription_issues where url = ?', [url]);
    if (error) return {error};

    return {subscriptionIssue: row};
  }

  async subscribe(url): Promise<{error?: Error}> {
    // check already
    const {error: e1, subscriptionIssue} = await this.getSubscriptionIssue(url);
    if (e1) return {error: e1};
    if (subscriptionIssue) return {};

    // get issue
    const {repo, issueNumber} = GitHubUtil.getInfo(url);
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const res = await client.request(`/repos/${repo}/issues/${issueNumber}`);
    if (res.error) return {error: res.error};
    const issue = res.body;

    // create
    const {error} = await IssueRepo.createBulk(SystemStreamId.subscription, [issue]);
    if (error) return {error};

    const createdAt = DateUtil.localToUTCString(new Date());
    const {error: e2} = await DB.exec(
      `insert into subscription_issues (issue_id, repo, url, created_at) values (?, ?, ?, ?) `,
      [issue.id, repo, url, createdAt]
    );
    if (e2) return {error: e2};

    return {};
    // await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
    // SystemStreamEvent.emitRestartAllStreams();
  }

  async unsubscribe(url: string): Promise<{error?: Error}> {
    // check not already
    const {error: e1, subscriptionIssue} = await this.getSubscriptionIssue(url);
    if (e1) return {error: e1};
    if (!subscriptionIssue) return;

    const {error: e2} = await DB.exec('delete from subscription_issues where url = ?', [url]);
    if (e2) return {error: e2};

    const {error: e3} = await DB.exec(
      'delete from streams_issues where stream_id = ? and issue_id = ?',
      [SystemStreamId.subscription, subscriptionIssue.issue_id]
    );
    if (e3) return {error: e3};

    return {};
  }
}

export const SubscriptionIssuesRepo = new _SubscriptionIssuesRepo();
