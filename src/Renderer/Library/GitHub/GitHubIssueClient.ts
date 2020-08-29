import {GitHubClient} from './GitHubClient';
import {RemotePREntity} from '../Type/RemotePREntity';
import {RemoteIssueEntity} from '../Type/RemoteIssueEntity';

export class GitHubIssueClient extends GitHubClient {
  // https://docs.github.com/en/rest/reference/issues#get-an-issue
  async getIssue(repoName: string, issueNumber: number): Promise<{error?: Error; issue?: RemoteIssueEntity}> {
    const path = `/repos/${repoName}/issues/${issueNumber}`;
    const {error, body} = await this.request(path);
    if (error) return {error};

    return {issue: body};
  }

  // https://docs.github.com/en/rest/reference/pulls#get-a-pull-request
  async getPR(repoName: string, prNumber: number): Promise<{error?: Error; pr?: RemotePREntity}> {
    const path = `/repos/${repoName}/pulls/${prNumber}`;
    const {error, body} = await this.request(path);
    if (error) return {error};

    return {pr: body};
  }
}
