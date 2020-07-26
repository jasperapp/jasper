import {Stream} from '../Stream';
import {ConfigRepo} from '../../Repository/ConfigRepo';

export class SystemStreamMe extends Stream {
  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  async buildSearchQueries(): Promise<string[]> {
    const loginName = ConfigRepo.getLoginName();
    return [`involves:${loginName}`, `user:${loginName}`];
  }
}
