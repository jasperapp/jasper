import {UserPrefEntity} from '../Type/UserPrefEntity';
import {GitHubClient} from './GitHub/GitHubClient';
import {AppIPC} from '../../IPC/AppIPC';
import {RemoteUserEntity} from '../Type/RemoteIssueEntity';
import {FS} from '../Infra/FS';
import {AppPathIPC} from '../../IPC/AppPathIPC';

class _UserPref {
  private index: number = 0;
  private prefs: UserPrefEntity[] = [];
  private user: RemoteUserEntity = null;

  async init(): Promise<{error?: Error}> {
    const {prefs, index} = await this.readPrefs();
    if (!prefs) return {error: new Error('not found prefs')};
    if (!prefs.length) return {error: new Error('not found prefs')};

    this.prefs = prefs;
    this.index = index;
    this.migration();
    const {error} = await this.initUser();
    if (error) return {error};

    return {};
  }

  async switchPref(prefIndex: number): Promise<{error?: Error}> {
    this.index = prefIndex;
    this.user = null;
    const {error} = await this.initUser();
    if (error) return {error};

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

    return true;
  }

  async deletePref(index: number) {
    if (this.index === index) this.index = 0;
    const dbPath = await this.getDBPath();
    if (!dbPath) return console.error('DB path is empty.');

    await FS.rm(dbPath);
    const {prefs} = await this.readPrefs();
    prefs.splice(index, 1);
    await this.writePrefs(prefs);
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

  async getDBPath(): Promise<string> {
    const prefPath = await AppPathIPC.getPrefPath();
    return AppPathIPC.getAbsPath(this.getPref().database.path, prefPath);
  }

  async getUsers(): Promise<{error?: Error; users?: RemoteUserEntity[]}> {
    const users: RemoteUserEntity[] = [];

    for (const prefs of this.getPrefs()) {
      const github = prefs.github;
      const client = new GitHubClient(github.accessToken,github.host, github.pathPrefix, github.https);
      const response = await client.request('/user');
      if (response.error) return {error: response.error};

      const body = response.body as RemoteUserEntity;
      users.push(body);
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
    if (!github.accessToken.match(/^[0-9a-z]+$/)) return false;

    if (!github.webHost) return false;
    if (github.host === 'api.github.com' && github.webHost !== 'github.com') return false;

    if (!github.interval) return false;
    if (github.interval < 10) return false;

    return true;
  }

  private async initUser(): Promise<{error?: Error}> {
    for (let i = 0; i < 3; i++) {
      const github = this.getPref().github;
      const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
      const {error, body} = await client.request('/user');

      if (error) {
        alert('Fail connection to GitHub/GHE. Please check network, VPN, ssh-proxy and more.\nOpen GitHub/GHE to check access.');
        console.error(error);
        await AppIPC.openNewWindow(github.webHost, github.https);
        continue;
      }

      this.user = body;
      return {};
    }

    return {error: new Error(`UserPrefRepo: fail init login name.`)};
  }

  private getTemplatePref(): UserPrefEntity {
    return JSON.parse(JSON.stringify(TemplatePref));
  }

  private migration() {
    this.prefs.forEach(pref => {
      // migration: from v0.1.1
      if (!('https' in pref.github)) (pref as UserPrefEntity).github.https = true;

      // migration: from v0.1.1
      if (!('badge' in pref.general)) (pref as UserPrefEntity).general.badge = false;
    });
  }

  private async readPrefs(): Promise<{prefs?: UserPrefEntity[]; index?: number}> {
    const prefPath = await AppPathIPC.getPrefPath();
    const exist = await FS.exist(prefPath);
    if (!exist) return {};

    const prefs = await FS.readJSON<UserPrefEntity[]>(prefPath);
    return {prefs, index: 0};
  }

  private async writePrefs(prefs: UserPrefEntity[]) {
    const prefPath = await AppPathIPC.getPrefPath();
    const exist = await FS.exist(prefPath);
    if (!exist) {
      const dirPath = await AppPathIPC.getPrefDir();
      await FS.mkdir(dirPath);
    }

    await FS.writeJSON<UserPrefEntity[]>(prefPath, prefs);
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
  },
  theme: {
    main: null,
    browser: null
  },
  database: {
    path: './main.db',
    max: 10000,
  }
};

export const UserPrefRepo = new _UserPref();
