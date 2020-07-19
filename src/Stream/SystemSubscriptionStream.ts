import {Stream} from './Stream';
import {SubscriptionIssuesTable} from '../DB/SubscriptionIssuesTable';

export class SystemSubscriptionStream extends Stream {
  private _subscriptionIssueIds: number[];
  private _subscriptionRepos: string[];

  constructor(id, name, searchedAt) {
    super(id, name, [], searchedAt);

    this._subscriptionIssueIds = null;
    this._subscriptionRepos = null;
  }

  async _buildQueries() {
    if (!this._subscriptionIssueIds || !this._subscriptionRepos) {
      await this._init();
    }

    // hack: github api returns server error when queries is long and per_page is 2 or greater.
    const queries = [];
    for (let i = 0; i < this._subscriptionRepos.length; i += 20) {
      const query = this._subscriptionRepos.slice(i, i + 20).map((repo)=> `repo:${repo}`).join(' ');
      queries.push(query);
    }
    return queries;
  }

  async _filter(issues) {
    return issues.filter((issue)=> this._subscriptionIssueIds.includes(issue.id));
  }

  async _init() {
    const subscriptionIssues = await SubscriptionIssuesTable.findAll();
    const ids = [];
    const repos = {};
    for (const subscriptionIssue of subscriptionIssues) {
      ids.push(subscriptionIssue.issue_id);
      const urlPaths = subscriptionIssue.url.split('/').reverse();
      const repo = `${urlPaths[3]}/${urlPaths[2]}`;
      repos[repo] = true;
    }

    this._subscriptionIssueIds = ids;
    this._subscriptionRepos = Object.keys(repos);
  }
}
