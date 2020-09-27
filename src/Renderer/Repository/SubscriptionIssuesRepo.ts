import {SubscriptionIssueEntity} from '../Library/Type/SubscriptionIssueEntity';
import {UserPrefRepo} from './UserPrefRepo';
import {IssueRepo} from './IssueRepo';
import {DateUtil} from '../Library/Util/DateUtil';
import {GitHubUtil} from '../Library/Util/GitHubUtil';
import {DB} from '../Library/Infra/DB';
import {StreamId} from './StreamRepo';
import {GitHubIssueClient} from '../Library/GitHub/GitHubIssueClient';
import {GitHubV4IssueClient} from '../Library/GitHub/V4/GitHubV4IssueClient';

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
    const client = new GitHubIssueClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const res = await client.getIssue(repo, issueNumber);
    if (res.error) return {error: res.error};
    const issue = res.issue;

    // inject v4
    {
      const v4Client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, UserPrefRepo.getGHEVersion());
      const {error, issues: v4Issues} = await v4Client.getIssuesByNodeIds([issue.node_id]);
      if (error) return {error};
      GitHubV4IssueClient.injectV4ToV3(v4Issues, [issue]);
    }

    // create
    const {error} = await IssueRepo.createBulk(StreamId.subscription, [issue]);
    if (error) return {error};

    const createdAt = DateUtil.localToUTCString(new Date());
    const {error: e2} = await DB.exec(
      `insert into subscription_issues (issue_id, repo, url, created_at) values (?, ?, ?, ?) `,
      [issue.id, repo, url, createdAt]
    );
    if (e2) return {error: e2};

    return {};
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
      [StreamId.subscription, subscriptionIssue.issue_id]
    );
    if (e3) return {error: e3};

    return {};
  }
}

export const SubscriptionIssuesRepo = new _SubscriptionIssuesRepo();
