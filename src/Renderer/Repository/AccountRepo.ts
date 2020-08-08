import {ConfigRepo} from './ConfigRepo';
import {GitHubClient} from '../Infra/GitHubClient';
import {RemoteUserEntity} from '../Type/RemoteIssueEntity';
import {AccountType} from '../Type/AccountType';

class _AccountRepo {
  async getAccounts(): Promise<{error?: Error; accounts?: AccountType[]}> {
    const accounts: AccountType[] = [];

    for (const config of ConfigRepo.getConfigs()) {
      const github = config.github;
      const client = new GitHubClient(github.accessToken,github.host, github.pathPrefix, github.https);
      const response = await client.request('/user');
      if (response.error) return {error: response.error};

      const body = response.body as RemoteUserEntity;
      accounts.push({loginName: body.login, avatarURL: body.avatar_url});
    }

    return {accounts};
  }
}

export const AccountRepo = new _AccountRepo();
