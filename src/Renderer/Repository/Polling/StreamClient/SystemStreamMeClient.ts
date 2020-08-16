import {StreamClient} from './StreamClient';
import {ConfigRepo} from '../../ConfigRepo';

export class SystemStreamMeClient extends StreamClient {
  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  async buildSearchQueries(): Promise<string[]> {
    const loginName = ConfigRepo.getLoginName();
    return [`involves:${loginName}`, `user:${loginName}`];
  }
}
