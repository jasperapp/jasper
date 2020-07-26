import {Stream} from '../Stream';
import {Config} from '../../Config';

export class SystemStreamMe extends Stream {
  constructor(id: number, name: string, searchedAt: string) {
    super(id, name, [], searchedAt);
  }

  async buildSearchQueries(): Promise<string[]> {
    const loginName = Config.getLoginName();
    return [`involves:${loginName}`, `user:${loginName}`];
  }
}
