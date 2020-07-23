import {Config} from '../Main/Config';
import {Stream} from './Stream';

export class SystemMeStream extends Stream {
  constructor(id, name, searchedAt) {
    super(id, name, [], searchedAt);
  }

  async _buildQueries() {
    const loginName = Config.loginName;
    return [`involves:${loginName}`, `user:${loginName}`];
  }
}
