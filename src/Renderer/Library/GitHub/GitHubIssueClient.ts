import {GitHubClient} from './GitHubClient';
import {RemotePREntity} from '../Type/RemotePREntity';
import {RemoteIssueEntity} from '../Type/RemoteIssueEntity';

export class GitHubIssueClient extends GitHubClient {
  // https://docs.github.com/en/rest/reference/issues#get-an-issue
  async getIssue(repoName: string, issueNumber: number): Promise<{error?: Error; issue?: RemoteIssueEntity}> {
    const path = `/repos/${repoName}/issues/${issueNumber}`;
    const {error, body} = await this.request<RemoteIssueEntity>(path);
    if (error) return {error};

    return {issue: body};
  }

  // https://docs.github.com/en/rest/reference/pulls#get-a-pull-request
  async getPR(repoName: string, prNumber: number): Promise<{error?: Error; pr?: RemotePREntity}> {
    const path = `/repos/${repoName}/pulls/${prNumber}`;
    const {error, body} = await this.request<RemotePREntity>(path);
    if (error) return {error};

    return {pr: body};
  }

  // https://docs.github.com/en/rest/reference/pulls#list-pull-requests
  // note: issue.idとpr.idは別物なので、pr.numberでチェックするしか無い
  async getPRsInRepo(repoName: string, prNumbers: number[]): Promise<{error?: Error; prs?: RemotePREntity[]}> {
    const path = `/repos/${repoName}/pulls`;
    const query = {state: 'closed', sort: 'updated', direction: 'desc', per_page: 100};
    const {error, body} = await this.request<RemotePREntity[]>(path, query);
    if (error) return {error};

    const prs = body.filter(remotePR => prNumbers.includes(remotePR.number));
    if (prs.length !== prNumbers.length) {
      console.warn(`can not get all PRs. repoName = ${repoName}, prNumbers: ${prNumbers}`);
    }

    return {prs};
  }
}
