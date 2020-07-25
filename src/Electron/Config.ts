import {ConfigType} from '../Type/ConfigType';
import {ConfigIPC} from '../IPC/ConfigIPC';
import {GitHubClient} from './Infra/GitHubClient';
import {ConnectionCheckIPC} from '../IPC/ConnectionCheckIPC';

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
  private configs: ConfigType[] = [];
  private loginName: string = null;

  async init(configs: ConfigType[], index: number): Promise<{error?: Error}> {
    this.configs = configs;
    this.index = index;
    const {error} = await this.initLoginName();
    if (error) return {error};

    return {};
  }

  async switchConfig(configIndex: number): Promise<{error?: Error}> {
    this.index = configIndex;
    this.loginName = null;
    const {error} = await this.initLoginName();
    if (error) return {error};

    return {};
  }

  async addConfigGitHub(configGitHub: ConfigType['github']) {
    const config = JSON.parse(JSON.stringify(defaultConfigs))[0];
    config.github = configGitHub;
    config.database.path = `./main-${Date.now()}.db`;
    this.configs.push(config);

    await ConfigIPC.writeConfigs(this.configs);
  }

  async updateConfigGitHub(index: number, configGitHub: ConfigType['github']) {
    this.configs[index].github = configGitHub;
    await ConfigIPC.writeConfigs(this.configs);
    // fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  async updateConfig(index: number, config: ConfigType) {
    this.configs[index] = config;
    await ConfigIPC.writeConfigs(this.configs);
  }

  async deleteConfig(index: number) {
    if (this.index === index) this.index = 0;
    this.configs.splice(index, 1);
    await ConfigIPC.deleteConfig(index);
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

  private async initLoginName(): Promise<{error?: Error}> {
    for (let i = 0; i < 3; i++) {
      const github = this.getConfig().github;
      const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
      const {error, body} = await client.request('/user');

      if (error) {
        console.error(error);
        await ConnectionCheckIPC.exec(github.webHost, github.https);
        continue;
      }

      this.loginName = body.login;
      return {};
    }

    return {error: new Error(`ConfigRepo: fail init login name.`)};
  }
}

export const Config = new _Config();
