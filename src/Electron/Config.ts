import {ConfigType} from '../Type/ConfigType';
import {ConfigIPC} from '../IPC/ConfigIPC';

export const defaultConfigs: ConfigType[] = [
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

enum BrowserType {
  builtin = 'builtin',
  external = 'external',
}

class _Config {
  private index: number = 0;
  private configs: ConfigType[];
  private loginName: string;

  init(configs: ConfigType[], index: number) {
    this.configs = configs;
    this.index = index;
  }

  async switchConfig(configIndex: number) {
    this.index = configIndex;
    this.loginName = null;
  }

  async addConfigGitHub(configGitHub: ConfigType['github']) {
    const config = JSON.parse(JSON.stringify(defaultConfigs))[0];
    config.github = configGitHub;
    config.database.path = `./main-${Date.now()}.db`;
    this.configs.push(config);

    await ConfigIPC.writeConfigs(this.configs);
    // fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  async updateConfigGitHub(index: number, configGitHub: ConfigType['github']) {
    this.configs[index].github = configGitHub;
    await ConfigIPC.writeConfigs(this.configs);
    // fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  async updateConfig(index: number, config: ConfigType) {
    this.configs[index] = config;
    await ConfigIPC.writeConfigs(this.configs);
    // fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  async deleteConfig(index: number) {
    if (this.index === index) this.index = 0;
    this.configs.splice(index, 1);
    await ConfigIPC.deleteConfig(index);

    // const dbPath = path.resolve(path.dirname(this.configPath), config.database.path);
    // await FileIPC.removeFile(dbPath);
    // // fs.removeSync(dbPath);
    //
    // await FileIPC.writeJSON<ConfigType[]>(this.configPath, this.configs);
    // // fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  getConfigs(): ConfigType[] {
    return JSON.parse(JSON.stringify(this.configs));
  }

  getIndex(): number {
    return this.index;
  }

  getConfig(): ConfigType {
    return this.getConfigs()[this.index];
  }

  setLoginName(loginName: string) {
    this.loginName = loginName;
  }

  getLoginName(): string {
    return this.loginName;
  }

  // getDBPath() {
  //   return path.resolve(path.dirname(this.configPath), this.config.database.path);
  // }

  async setGeneralBrowser(value: BrowserType) {
    this.configs[this.index].general.browser = value;
    await ConfigIPC.writeConfigs(this.configs);
    // FileIPC.writeJSON<ConfigType[]>(this.configPath, this.configs);
    // fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }
}

export const Config = new _Config();
