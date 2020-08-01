import {DBIPC} from '../../IPC/DBIPC';
import {SubscriptionIssueEntity} from '../Type/SubscriptionIssueEntity';
import {ConfigRepo} from './ConfigRepo';
import {GitHubClient} from '../Infra/GitHubClient';
import {IssueRepo} from './IssueRepo';
import {StreamIssueRepo} from './StreamIssueRepo';
import {StreamPolling} from '../Infra/StreamPolling';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {SystemStreamId} from './SystemStreamRepo';
import {DateUtil} from '../Util/DateUtil';

class _SubscriptionIssuesRepo {
  async getAllSubscriptionIssues(): Promise<{error?: Error; subscriptionIssues?: SubscriptionIssueEntity[]}>{
    const {error, rows} = await DBIPC.select<SubscriptionIssueEntity>('select * from subscription_issues order by id');
    if (error) return {error};

    return {subscriptionIssues: rows};
  }

  private async getSubscriptionIssue(url: string): Promise<{error?: Error; subscriptionIssue?: SubscriptionIssueEntity}> {
    const {error, row} = await DBIPC.selectSingle<SubscriptionIssueEntity>('select * from subscription_issues where url = ?', [url]);
    if (error) return {error};

    return {subscriptionIssue: row};
  }

  async subscribe(url): Promise<{error?: Error}> {
    // check already
    const {error: e1, subscriptionIssue} = await this.getSubscriptionIssue(url);
    if (e1) return {error: e1};
    if (subscriptionIssue) return;

    // get issue
    const {repo, issueNumber} = this.getRepoAndIssueNumber(url);
    const github = ConfigRepo.getConfig().github;
    const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const res = await client.request(`/repos/${repo}/issues/${issueNumber}`);
    if (res.error) return {error: res.error};
    const issue = res.body;

    // create
    await IssueRepo.import([issue]);
    const {error} = await StreamIssueRepo.createBulk(SystemStreamId.subscription, [issue]);
    if (error) return {error};

    const createdAt = DateUtil.localToUTCString(new Date());
    const {error: e2} = await DBIPC.exec(
      `insert into subscription_issues (issue_id, repo, url, created_at) values (?, ?, ?, ?) `,
      [issue.id, repo, url, createdAt]
    );
    if (e2) return {error: e2};

    await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
    SystemStreamEvent.emitRestartAllStreams();
  }

  async unsubscribe(url: string): Promise<{error?: Error}> {
    // check not already
    const {error: e1, subscriptionIssue} = await this.getSubscriptionIssue(url);
    if (e1) return {error: e1};
    if (!subscriptionIssue) return;

    const {error: e2} = await DBIPC.exec('delete from subscription_issues where url = ?', [url]);
    if (e2) return {error: e2};

    const {error: e3} = await DBIPC.exec(
      'delete from streams_issues where stream_id = ? and issue_id = ?',
      [SystemStreamId.subscription, subscriptionIssue.issue_id]
    );
    if (e3) return {error: e3};

    return {};
  }

  private getRepoAndIssueNumber(url: string): {repo: string; issueNumber: number} {
    const urlPaths = url.split('/').reverse();
    const repo = `${urlPaths[3]}/${urlPaths[2]}`;
    const issueNumber = parseInt(urlPaths[0], 10);
    return {repo, issueNumber};
  }
}

export const SubscriptionIssuesRepo = new _SubscriptionIssuesRepo();
