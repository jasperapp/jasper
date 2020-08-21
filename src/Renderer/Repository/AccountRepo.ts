import {ConfigRepo} from './ConfigRepo';
import {GitHubClient} from './GitHub/GitHubClient';
import {RemoteUserEntity} from '../Type/RemoteIssueEntity';

class _AccountRepo {
  async getAccounts(): Promise<{error?: Error; accounts?: RemoteUserEntity[]}> {
    const accounts: RemoteUserEntity[] = [];

    for (const config of ConfigRepo.getConfigs()) {
      const github = config.github;
      const client = new GitHubClient(github.accessToken,github.host, github.pathPrefix, github.https);
      const response = await client.request('/user');
      if (response.error) return {error: response.error};

      const body = response.body as RemoteUserEntity;
      accounts.push(body);
    }

    return {accounts};
  }
}

export const AccountRepo = new _AccountRepo();
