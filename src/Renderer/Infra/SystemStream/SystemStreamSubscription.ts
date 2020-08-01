import {Stream} from '../Stream';
import {SubscriptionIssuesRepo} from '../../Repository/SubscriptionIssuesRepo';

export class SystemStreamSubscription extends Stream {
  private subscriptionIssueIds: number[];
  private subscriptionRepos: string[];

  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);

    this.subscriptionIssueIds = null;
    this.subscriptionRepos = null;
  }

  protected async buildSearchQueries() {
    await this.init();

    // hack: github api returns server error when queries is long and per_page is 2 or greater.
    const queries = [];
    for (let i = 0; i < this.subscriptionRepos.length; i += 20) {
      const query = this.subscriptionRepos.slice(i, i + 20).map(repo => `repo:${repo}`).join(' ');
      queries.push(query);
    }
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
