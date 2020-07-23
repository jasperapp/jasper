import {app, ipcMain} from 'electron';
import {AppPath} from './AppPath';
import {Config} from './Config';
import {GitHubClient} from '../GitHub/GitHubClient';
import {ConfigType} from '../Type/ConfigType';
import {AppWindow} from './AppWindow';
import {FSUtil} from './Util/FSUtil';
import {GitHubWindow} from './GitHubWindow';

class _InitConfig {
  private readonly defaultConfig: ConfigType[] = [
    {
      github: {
        accessToken: null,
        host: null,
        pathPrefix: '',
        webHost: null,
        interval: 10,
        https: true,
      },
      general: {
        browser: null,
        notification: true,
        notificationSilent: false,
        onlyUnreadIssue: false,
        badge: true,
        alwaysOpenExternalUrlInExternalBrowser: true,
      },
      theme: {
        main: null,
        browser: null
      },
      database: {
        path: "./main.db",
        max: 10000,
      }
    }
  ];

  async init() {
    const configDir = AppPath.getConfigDir();
    const configPath = AppPath.getConfigPath();

    if (!FSUtil.exist(configPath)) {
      FSUtil.mkdir(configDir);
      await this.setupConfig(configPath);
    }

    this.migration(configPath);

    Config.initialize(configPath);
  }

  private async setupConfig(configPath) {
    const window = AppWindow.getWindow();
    window.loadURL(`file://${__dirname}/../Electron/html/setup/setup.html`);

    // connection test
    ipcMain.on('connection-test', async (_ev, settings: any) => {
      const client = new GitHubClient(settings.accessToken, settings.host, settings.pathPrefix, settings.https);
      try {
        const res = await client.requestImmediate('/user');
        window.webContents.send('connection-test-result', {res});
      } catch (e) {
        window.webContents.send('connection-test-result', {error: e});
      }
    });

    // open github
    ipcMain.on('open-github-for-setup', (_ev, settings) => {
      const githubWindow = GitHubWindow.create(settings.webHost, settings.https);
      githubWindow.on('close', () => window.webContents.send('close-github-for-setup'))
    });

    const promise = new Promise((resolve, reject)=>{
      ipcMain.on('apply-settings', (_ev, settings) =>{
        const configs = JSON.parse(JSON.stringify(this.defaultConfig));
        configs[0].github.accessToken = settings.accessToken;
        configs[0].github.host = settings.host;
        configs[0].github.pathPrefix = settings.pathPrefix;
        configs[0].github.webHost = settings.webHost;
        configs[0].github.https = settings.https;

        if (!configs[0].github.accessToken || !configs[0].github.host) {
          reject(new Error('invalid settings'));
          app.quit();
          return;
        }

        FSUtil.writeJSON<ConfigType[]>(configPath, configs);
        resolve();
      });
    });

    await promise;
  }

  private migration(configPath: string) {
    const configs = FSUtil.readJSON<ConfigType[]>(configPath);

    configs.forEach(config => {
      // migration: from v0.1.1
      if (!('https' in config.github)) (config as ConfigType).github.https = true;

      // migration: from v0.1.1
      if (!('badge' in config.general)) (config as ConfigType).general.badge = false;

      // migration: from v0.4.0
      if (!('theme' in configs[0])) config.theme = {main: null, browser: null};
    });

    FSUtil.writeJSON<ConfigType[]>(configPath, configs);
  }
}

export const InitConfig = new _InitConfig();
