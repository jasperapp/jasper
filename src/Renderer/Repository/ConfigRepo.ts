import {ConfigType} from '../../Type/ConfigType';
import {ConfigIPC} from '../../IPC/ConfigIPC';
import {GitHubClient} from '../Infra/GitHubClient';
import {AppIPC} from '../../IPC/AppIPC';

enum BrowserType {
  builtin = 'builtin',
  external = 'external',
}

class _Config {
  private index: number = 0;
  private configs: ConfigType[] = [];
  private loginName: string = null;

  async init(): Promise<{error?: Error}> {
    const {configs, index} = await ConfigIPC.readConfigs();
    if (!configs) return {error: new Error('not found config')};
    if (!configs.length) return {error: new Error('not found config')};

    this.configs = configs;
    this.index = index;
    this.migration();
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

  async addConfigGitHub(configGitHub: ConfigType['github']): Promise<boolean> {
    if (!this.validateGitHub(configGitHub)) return false;

    const config = this.getTemplateConfig();
    config.github = configGitHub;
    const dbSuffix = this.configs.length === 0 ? '' : `-${Date.now()}`;
    config.database.path = `./main${dbSuffix}.db`;
    this.configs.push(config);

    await ConfigIPC.writeConfigs(this.configs);

    return true;
  }

  async updateConfigGitHub(index: number, configGitHub: ConfigType['github']): Promise<boolean> {
    if (!this.validateGitHub(configGitHub)) return false;

    this.configs[index].github = configGitHub;
    await ConfigIPC.writeConfigs(this.configs);

    return true;
  }

  async updateConfig(config: ConfigType): Promise<boolean> {
    if (!this.validateConfig(config)) return false;

    this.configs[this.getIndex()] = config;
    await ConfigIPC.writeConfigs(this.configs);

    return true;
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

  getLoginName(): string {
    return this.loginName;
  }

  async setGeneralBrowser(value: BrowserType) {
    this.configs[this.index].general.browser = value;
    await ConfigIPC.writeConfigs(this.configs);
  }

  private validateConfig(config: ConfigType): boolean {
    if (!this.validateGitHub(config.github)) return false;
    if (!config.database.path) return false;
    if (!config.database.max) return false;
    if (config.database.max > 100000) return false;
    if (config.database.max < 1000) return false;

    return true;
  }

  private validateGitHub(github: ConfigType['github']): boolean {
    if (!github.host) return false;
    if (github.host !== 'api.github.com' && !github.pathPrefix) return false;
    if (github.host === 'api.github.com' && github.pathPrefix) return false;

    if (!github.accessToken) return false;
    if (!github.accessToken.match(/^[0-9a-z]+$/)) return false;

    if (!github.webHost) return false;
    if (github.host === 'api.github.com' && github.webHost !== 'github.com') return false;

    if (!github.interval) return false;
    if (github.interval < 10) return false;

    return true;
  }

  private async initLoginName(): Promise<{error?: Error}> {
    for (let i = 0; i < 3; i++) {
      const github = this.getConfig().github;
      const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
      const {error, body} = await client.request('/user');

      if (error) {
        alert('Fail connection to GitHub/GHE. Please check network, VPN, ssh-proxy and more.\nOpen GitHub/GHE to check access.');
        console.error(error);
        await AppIPC.openNewWindow(github.webHost, github.https);
        continue;
      }

      this.loginName = body.login;
      return {};
    }

    return {error: new Error(`ConfigRepo: fail init login name.`)};
  }

  private getTemplateConfig(): ConfigType {
    return JSON.parse(JSON.stringify(TemplateConfig));
  }

  private migration() {
    this.configs.forEach(config => {
      // migration: from v0.1.1
      if (!('https' in config.github)) (config as ConfigType).github.https = true;

      // migration: from v0.1.1
      if (!('badge' in config.general)) (config as ConfigType).general.badge = false;
    });
  }
}

const TemplateConfig: ConfigType = {
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
};

export const ConfigRepo = new _Config();
