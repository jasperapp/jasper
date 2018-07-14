import Config from '../Config';
import Stream from './Stream';

export default class SystemMeStream extends Stream {
  constructor(id, name, searchedAt) {
    super(id, name, [], searchedAt);
  }

  async _buildQueries() {
    const loginName = Config.loginName;
    return [`involves:${loginName}`, `user:${loginName}`];
  }
}
