import {GitHubClient} from '../GitHub/GitHubClient';
import {Config} from '../Config';

class _LoginNameSetup {
  async exec() {
    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const response = await client.requestImmediate('/user');
    Config.loginName = response.body.login;
  }
}

export const LoginNameSetup = new _LoginNameSetup();
