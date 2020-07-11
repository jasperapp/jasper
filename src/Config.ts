import fs from 'fs-extra';
import path from 'path';

export class Config {
  get BROWSER_BUILTIN() { return 'builtin'; }
  get BROWSER_EXTERNAL() { return 'external'; }

  private _activeIndex = 0;
  private _configPath: string;
  private _configs: {[key: string]: any}[];
  private _config: {[key: string]: any};
  private _loginName: string;

  initialize(path) {
    this._configPath = path;
    this._configs = fs.readJsonSync(path, {throws: false});
    this._config = this._configs[this._activeIndex];
  }

  get activeIndex() {
    return this._activeIndex;
  }

  switchConfig(configIndex) {
    this._activeIndex = configIndex;
    this._config = this._configs[configIndex];
    this._loginName = null;
  }

  addConfigGitHub(configGitHub) {
    const config = fs.readJsonSync(`${__dirname}/asset/config.json`)[0];
    config.github = configGitHub;
    config.database.path = `./main-${Date.now()}.db`;

    this._configs.push(config);
    fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  updateConfigGitHub(index, configGitHub) {
    this._configs[index].github = configGitHub;
    fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  updateConfig(index, config) {
    this._configs[index] = config;
    fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  deleteConfig(index) {
    const config = this._configs[index];
    const dbPath = path.resolve(path.dirname(this._configPath), config.database.path);
    fs.removeSync(dbPath);

    this._configs.splice(index, 1);
    fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
  }

  get configs() {
    return this._configs;
  }

  get activeConfig() {
    return this._config;
  }

  set loginName(loginName) {
    this._loginName = loginName;
  }

  get loginName() {
    return this._loginName;
  }

  get accessToken() {
    return this._config.github.accessToken;
  }

  get host() {
    return this._config.github.host;
  }

  get webHost() {
    return this._config.github.webHost;
  }

  get pathPrefix() {
    return this._config.github.pathPrefix;
  }

  get apiInterval() {
    // hack: response when config have not been initialized yet
    if (this._config) {
      return this._config.github.interval;
    } else {
      return 10;
    }
  }

  get https() {
    return this._config.github.https;
  }

  get databasePath() {
    return path.resolve(path.dirname(this._configPath), this._config.database.path);
  }

  get databaseMax() {
    return this._config.database.max;
  }

  get generalBrowser() {
    return this._config.general.browser;
  }

  set generalBrowser(value) {
    if ([this.BROWSER_BUILTIN, this.BROWSER_EXTERNAL].includes(value)) {
      this._config.general.browser = value;
      fs.writeJsonSync(this._configPath, this._configs, {spaces: 2});
    } else {
      throw new Error(`unknown browser: ${value}`);
    }
  }

  get generalNotification() {
    return this._config.general.notification;
  }

  get generalNotificationSilent() {
    return this._config.general.notificationSilent;
  }

  get generalOnlyUnreadIssue() {
    return this._config.general.onlyUnreadIssue;
  }

  get generalBadge() {
    return this._config.general.badge;
  }

  get generalAlwaysOpenExternalUrlInExternalBrowser() {
    return this._config.general.alwaysOpenExternalUrlInExternalBrowser;
  }

  get themeMainPath() {
    if (!this._config.theme.main) return null;
    return path.resolve(path.dirname(this._configPath), this._config.theme.main);
  }

  get themeBrowserPath() {
    if (!this._config.theme.browser) return null;
    return path.resolve(path.dirname(this._configPath), this._config.theme.browser);
  }
}

export default new Config();
