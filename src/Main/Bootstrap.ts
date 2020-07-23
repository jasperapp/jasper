import fs from 'fs-extra';
import {Config} from './Config';
import {GitHubClientDeliver} from './GitHub/GitHubClientDeliver';
import {GitHubClient} from './GitHub/GitHubClient';
import {SystemStreamLauncher} from './Stream/SystemStreamLauncher';
import {StreamLauncher} from './Stream/StreamLauncher';
import {StreamInitializer} from './Initializer/StreamInitializer';
import {AppWindow} from './AppWindow';
import {DBSetup} from './Setup/DBSetup';

class _Bootstrap {
  async start() {
    await this._startSelfName();
    await DBSetup.exec();
    await StreamInitializer.init();
    await this._startStream();
    this._loadTheme();
  }

  async restart() {
    this._startClientDeliver();
    await this._startSelfName();
    await this._startStream();
    this._loadTheme();
  }

  async restartOnlyPolling() {
    this._startClientDeliver();
    await this._startStream();
  }

  stop() {
    SystemStreamLauncher.stopAll();
    StreamLauncher.stopAll();
  }

  _startClientDeliver() {
    GitHubClientDeliver.stop(); // auto restart
    GitHubClientDeliver.stopImmediate(); // auto restart
  }

  async _startSelfName() {
    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const response = await client.requestImmediate('/user');
    Config.loginName = response.body.login;
  }

  async _startStream() {
    await SystemStreamLauncher.restartAll();
    await StreamLauncher.restartAll();
  }

  _loadTheme() {
    if (Config.themeMainPath)  {
      const css = fs.readFileSync(Config.themeMainPath).toString();
      AppWindow.getWindow().webContents.send('load-theme-main', css);
    } else {
      AppWindow.getWindow().webContents.send('load-theme-main', '');
    }
  }
}

export const Bootstrap = new _Bootstrap();
