import {GitHubClient} from './GitHubClient';
import {RemotePREntity} from '../Type/RemotePREntity';

export class GitHubPRClient extends GitHubClient {
  // ref https://docs.github.com/en/rest/reference/pulls#get-a-pull-request
  async getPR(repoName: string, prNumber: number): Promise<{error?: Error; pr?: RemotePREntity}> {
    const path = `/repos/${repoName}/pulls/${prNumber}`;
    const {error, body} = await this.request(path);
    if (error) return {error};

    return {pr: body};
  }
}
