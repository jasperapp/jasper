import nodePath from 'path'
import {app} from 'electron';
import {AppPath} from '../AppPath';
import {defaultConfigs} from '../Config';
import {ConfigType} from '../../Type/ConfigType';
import {AppWindow} from '../AppWindow';
import {FSUtil} from '../Util/FSUtil';
import {ConfigIPC} from '../../IPC/ConfigIPC';
import {DB} from '../DB/DB';
import path from "path";

class _ConfigSetup {
  async exec() {
    const configDir = AppPath.getConfigDir();
    const configPath = AppPath.getConfigPath();

    if (!FSUtil.exist(configPath)) {
      FSUtil.mkdir(configDir);
      await this.setupConfig(configPath);
    }

    this.migration(configPath);

    // Config.initialize(configPath);

    const configs = FSUtil.readJSON<ConfigType[]>(configPath);
    const dbPath = nodePath.resolve(path.dirname(configPath), configs[0].database.path);
    await DB.init(dbPath);

    ConfigIPC.onReadConfig(async () => {
      const configs = FSUtil.readJSON<ConfigType[]>(configPath);
      return {configs, index: 0};
    });

    ConfigIPC.onWriteConfig(async (_ev, configs) => {
      FSUtil.writeJSON<ConfigType[]>(configPath, configs);
    });

    ConfigIPC.onDeleteConfig(async (_ev, index) => {
      const configs = FSUtil.readJSON<ConfigType[]>(configPath);
      const config = configs[index];
      const dbPath = nodePath.resolve(nodePath.dirname(configPath), config.database.path);
      FSUtil.rm(dbPath);
      configs.splice(index, 1);
      FSUtil.writeJSON<ConfigType[]>(configPath, configs);
    });
  }

  private async setupConfig(configPath) {
    const window = AppWindow.getWindow();
    window.loadURL(`file://${__dirname}/../../Electron/html/setup/setup.html`);
    if (process.env.JASPER === 'DEV') window.webContents.openDevTools()

    const promise = new Promise((resolve, reject)=>{
      ConfigIPC.onSetupConfig((_ev, github) => {
        const configs = JSON.parse(JSON.stringify(defaultConfigs));
        configs[0].github.accessToken = github.accessToken;
        configs[0].github.host = github.host;
        configs[0].github.pathPrefix = github.pathPrefix;
        configs[0].github.webHost = github.webHost;
        configs[0].github.https = github.https;

        if (!configs[0].github.accessToken || !configs[0].github.host) {
          reject(new Error('invalid settings'));
          app.quit();
          return;
        }

        FSUtil.writeJSON<ConfigType[]>(configPath, configs);
        resolve();
      })
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

export const ConfigSetup = new _ConfigSetup();
