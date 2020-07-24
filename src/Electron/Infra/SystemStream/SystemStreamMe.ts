import {Stream} from '../Stream';
import {RemoteConfig} from '../../Remote';

export class SystemStreamMe extends Stream {
  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  async buildSearchQueries(): Promise<string[]> {
    const loginName = RemoteConfig.loginName;
    return [`involves:${loginName}`, `user:${loginName}`];
  }
}
