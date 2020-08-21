import {StreamClient} from './StreamClient';
import {UserPrefRepo} from '../../UserPrefRepo';

export class SystemStreamMeClient extends StreamClient {
  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  async buildSearchQueries(): Promise<string[]> {
    const loginName = UserPrefRepo.getLoginName();
    return [`involves:${loginName}`, `user:${loginName}`];
  }
}
