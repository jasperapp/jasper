import {UserPrefEntity} from '../Library/Type/UserPrefEntity';
import {MainWindowIPC} from '../../IPC/MainWindowIPC';
import {RemoteUserEntity} from '../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {UserPrefIPC} from '../../IPC/UserPrefIPC';
import {GitHubUserClient} from '../Library/GitHub/GitHubUserClient';
import {RemoteGitHubHeaderEntity} from '../Library/Type/RemoteGitHubV3/RemoteGitHubHeaderEntity';
import {setAppThemeName} from '../Library/Style/appTheme';
import {ThemeNameEntity} from '../Library/Type/ThemeNameEntity';

export function isValidScopes(scopes: RemoteGitHubHeaderEntity['scopes']): boolean {
  if (!scopes.includes('repo')) return false;
  if (!scopes.includes('user')) return false;
  if (!scopes.includes('notifications')) return false;
  if (!scopes.includes('read:org') && !scopes.includes('admin:org')) return false;
  return true;
}

class _UserPref {
  private index: number = 0;
  private prefs: UserPrefEntity[] = [];
  private user: RemoteUserEntity = null;
  private gheVersion: string;
  private isSystemDarkMode: boolean;

  async init(): Promise<{error?: Error; githubUrl?: string; isPrefNetworkError?: boolean; isPrefNotFoundError?: boolean; isPrefScopeError?: boolean; isUnauthorized?: boolean}> {
    const {prefs, index} = await this.readPrefs();
    if (!prefs) return {error: new Error('not found prefs'), isPrefNotFoundError: true};
    if (!prefs.length) return {error: new Error('not found prefs'), isPrefNotFoundError: true};

    this.prefs = prefs;
    this.index = index;
    await this.migration();
    const {error, isPrefScopeError, isPrefNetworkError, isUnauthorized} = await this.initUser();
    if (error) {
      const github = this.getPref().github;
      const githubUrl = `http${github.https ? 's' : ''}://${github.webHost}`;
      return {error, githubUrl, isPrefScopeError, isPrefNetworkError, isUnauthorized};
    }

    this.initTheme();

    return {};
  }

  async switchPref(prefIndex: number): Promise<{error?: Error; githubUrl?: string; isPrefNetworkError?: boolean; isPrefScopeError?: boolean; isUnauthorized?: boolean}> {
    this.index = prefIndex;
    this.user = null;
    const {error, isPrefNetworkError, isPrefScopeError, isUnauthorized} = await this.initUser();
    if (error) {
      const github = this.getPref().github;
      const githubUrl = `http${github.https ? 's' : ''}://${github.webHost}`;
      return {error, isPrefScopeError, isPrefNetworkError, isUnauthorized, githubUrl};
    }

    this.initTheme();

    return {};
  }

  async addPrefGitHub(prefGitHub: UserPrefEntity['github'], browser: UserPrefEntity['general']['browser']): Promise<boolean> {
    if (!this.validateGitHub(prefGitHub)) return false;

    const pref = this.getTemplatePref();
    pref.github = prefGitHub;
    pref.general.browser = browser;
    const dbSuffix = this.prefs.length === 0 ? '' : `-${Date.now()}`;
    pref.database.path = `./main${dbSuffix}.db`;
    this.prefs.push(pref);

    await this.writePrefs(this.prefs);

    return true;
  }

  async updatePref(pref: UserPrefEntity): Promise<boolean> {
    if (!this.validatePref(pref)) return false;

    this.prefs[this.getIndex()] = pref;
    await this.writePrefs(this.prefs);

    this.initTheme();

    return true;
  }

  async deletePref() {
    const dbPath = this.getPref().database.path;
    if (!dbPath) return console.error('DB path is empty.');

    await UserPrefIPC.deleteRelativeFile(dbPath);
    const {prefs} = await this.readPrefs();
    prefs.splice(this.index, 1);
    await this.writePrefs(prefs);

    await MainWindowIPC.reload();
  }

  getPrefs(): UserPrefEntity[] {
    return JSON.parse(JSON.stringify(this.prefs));
  }

  getIndex(): number {
    return this.index;
  }

  getPref(): UserPrefEntity {
    return this.getPrefs()[this.index];
  }

  getUser(): RemoteUserEntity {
    return {...this.user};
  }

  getGHEVersion(): string {
    return this.gheVersion;
  }

  async getDBPath(): Promise<string> {
    return await UserPrefIPC.getAbsoluteFilePath(this.getPref().database.path);
  }

  getThemeName(): ThemeNameEntity {
    if (this.getPref().general.style.themeMode === 'system') {
      return this.isSystemDarkMode ? 'dark' : 'light';
    } else {
      return this.getPref().general.style.themeMode === 'light' ? 'light' : 'dark';
    }
  }

  async getUsers(): Promise<{users: RemoteUserEntity[]}> {
    const users: RemoteUserEntity[] = [];

    for (const prefs of this.getPrefs()) {
      const github = prefs.github;
      const client = new GitHubUserClient(github.accessToken,github.host, github.pathPrefix, github.https);
      const response = await client.getUser();
      if (response.error) {
        users.push({login: 'unknown', name: 'unknown', avatar_url: ''});
      } else {
        users.push(response.user);
      }
    }

    return {users};
  }

  private validatePref(pref: UserPrefEntity): boolean {
    if (!this.validateGitHub(pref.github)) return false;
    if (!pref.database.path) return false;
    if (!pref.database.max) return false;
    if (pref.database.max > 100000) return false;
    if (pref.database.max < 1000) return false;

    return true;
  }

  private validateGitHub(github: UserPrefEntity['github']): boolean {
    if (!github.host) return false;
    if (github.host !== 'api.github.com' && !github.pathPrefix) return false;
    if (github.host === 'api.github.com' && github.pathPrefix) return false;

    if (!github.accessToken) return false;
    if (!github.accessToken.match(/^(?:[a-f0-9]{40}|ghp_\w{36,251})$/)) return false;

    if (!github.webHost) return false;
    if (github.host === 'api.github.com' && github.webHost !== 'github.com') return false;

    if (!github.interval) return false;
    if (github.interval < 10) return false;

    return true;
  }

  private async initUser(): Promise<{error?: Error; isPrefNetworkError?: boolean; isPrefScopeError?: boolean; isUnauthorized?: boolean}> {
    const github = this.getPref().github;
    const client = new GitHubUserClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error, user, githubHeader, statusCode} = await client.getUser();

    if (error) {
      if (statusCode === 401) {
        return {error, isUnauthorized: true};
      } else {
        return {error, isPrefNetworkError: true};
      }
    }

    if (!isValidScopes(githubHeader.scopes)) {
      return {error: new Error('scopes not enough'), isPrefScopeError: true};
    }

    this.user = user;
    this.gheVersion = githubHeader.gheVersion;
    return {};
  }

  private initTheme() {
    this.isSystemDarkMode = MainWindowIPC.isSystemDarkTheme();
    setAppThemeName(this.getThemeName());
  }

  private getTemplatePref(): UserPrefEntity {
    return JSON.parse(JSON.stringify(TemplatePref));
  }

  private async migration() {
    this.prefs.forEach(pref => {
      // migration: from v0.1.1
      if (!('https' in pref.github)) (pref as UserPrefEntity).github.https = true;

      // migration: from v0.1.1
      if (!('badge' in pref.general)) (pref as UserPrefEntity).general.badge = false;

      // migration: to v0.10.0
      if (!('githubNotificationSync' in pref.general)) (pref as UserPrefEntity).general.githubNotificationSync = true;
      if (!('style' in pref.general)) (pref as UserPrefEntity).general.style = {themeMode: 'system', enableThemeModeOnGitHub: true, issuesWidth: 320, streamsWidth: 220};
      if (!('enableThemeModeOnGitHub' in pref.general.style)) (pref as UserPrefEntity).general.style.enableThemeModeOnGitHub = true;
    });

    await this.writePrefs(this.prefs);
  }

  private async readPrefs(): Promise<{prefs?: UserPrefEntity[]; index?: number}> {
    const text = await UserPrefIPC.read();
    if (!text) return {};
    const prefs = JSON.parse(text) as UserPrefEntity[];
    return {prefs, index: 0};
  }

  private async writePrefs(prefs: UserPrefEntity[]) {
    const text = JSON.stringify(prefs, null, 2);
    await UserPrefIPC.write(text);
  }
}

const TemplatePref: UserPrefEntity = {
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
    githubNotificationSync: true,
    style: {
      themeMode: 'system',
      enableThemeModeOnGitHub: true,
      streamsWidth: 220,
      issuesWidth: 320,
    }
  },
  database: {
    path: './main.db',
    max: 10000,
  }
};

export const UserPrefRepo = new _UserPref();
