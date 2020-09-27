import {StreamClient} from './StreamClient';
import {SubscriptionIssuesRepo} from '../../SubscriptionIssuesRepo';
import {ArrayUtil} from '../../../Library/Util/ArrayUtil';

export class SystemStreamSubscriptionClient extends StreamClient {
  private subscriptionIssueIds: number[];
  private subscriptionRepos: string[];

  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);

    this.subscriptionIssueIds = null;
    this.subscriptionRepos = null;
  }

  protected async buildSearchQueries() {
    await this.init();

    // note: query max length is 256
    // https://docs.github.com/en/free-pro-team@latest/github/searching-for-information-on-github/troubleshooting-search-queries#limitations-on-query-length
    const queries = ArrayUtil.joinWithMax(this.subscriptionRepos.map(repo => `repo:${repo}`), 256);
    return queries;
  }

  protected async filter(issues) {
    return issues.filter(issue => this.subscriptionIssueIds.includes(issue.id));
  }

  private async init() {
    const {error, subscriptionIssues} = await SubscriptionIssuesRepo.getAllSubscriptionIssues();
    if (error) return console.error(error);
    const ids = [];
    const repos = {};
    for (const subscriptionIssue of subscriptionIssues) {
      ids.push(subscriptionIssue.issue_id);
      const urlPaths = subscriptionIssue.url.split('/').reverse();
      const repo = `${urlPaths[3]}/${urlPaths[2]}`;
      repos[repo] = true;
    }

    this.subscriptionIssueIds = ids;
    this.subscriptionRepos = Object.keys(repos);
  }
}
