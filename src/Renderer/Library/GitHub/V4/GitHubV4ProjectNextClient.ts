import {GitHubV4Client} from './GitHubV4Client';
import {Logger} from '../../Infra/Logger';

// Stub implementation for GitHubV4ProjectNextClient since GitHub Projects has been sunset
export class GitHubV4ProjectNextClient extends GitHubV4Client {
  async getProjectStatusFieldNames(projectUrl: string): Promise<{ error?: Error; iterationName?: string; statusNames?: string[] }> {
    Logger.warning(GitHubV4ProjectNextClient.name, 'GitHub Projects has been sunset. This client will return empty results.');
    return {statusNames: [], iterationName: ''};
  }
}
