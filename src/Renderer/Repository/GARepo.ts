import {VersionPolling} from './Polling/VersionPolling';

type GAInfo = {
  clientId: string;
}

const localStorageKey = 'GARepo:GAInfo';
const TID = 'UA-77734098-2';

class _GARepo {
  private readonly gaObj: any;
  private version: string;
  private initDone: boolean;
  private userAgent: string;
  private screen: string;
  private viewPort: string;
  private colorDepth: string;

  constructor() {
    this.gaObj = this.getGAInfo();
  }

  private getGAInfo(): GAInfo {
    const gaInfoText = localStorage.getItem(localStorageKey);
    if (gaInfoText) {
      return JSON.parse(gaInfoText);
    } else {
      const gaInfo: GAInfo = {
        clientId: btoa(`${Date.now()}${Math.random()}`),
      }
      localStorage.setItem(localStorageKey, JSON.stringify(gaInfo));
      return gaInfo;
    }
  }

  init({userAgent, width, height, availableWidth, availableHeight, colorDepth}) {
    this.initDone = true;
    this.userAgent = userAgent;
    this.screen = `${width}x${height}`;
    this.viewPort = `${availableWidth}x${availableHeight}`;
    this.colorDepth = `${colorDepth}-bits`;
    this.version = VersionPolling.getVersion();
  }

  /* app */
  async eventAppStart() {
    await this.event('app', 'start', null, null, 'start');

    // note: 過去に取得していたeventがわかるようにとりあえず残しておく
    // const {streams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream']);
    // this.event('app', 'start/stream', 'stream-count', streams.length);
    //
    // const {count} = await IssueRepo.getTotalCount();
    // this.event('app', 'start/issue', 'issue-count', count);
    //
    // this.event('app', 'start/account', 'account-count', UserPrefRepo.getPrefs().length);
  }

  /* issue */
  eventIssueRead(flag) {
    const action = flag ? 'read' : 'un-read';
    this.event('issue', action);
  }

  // note: 過去に取得していたeventがわかるようにとりあえず残しておく
  // /* stream */
  // async eventStreamCreate(queryCount) {
  //   const {row} = await DB.selectSingle<{streamCount: number}>('select count(1) as streamCount from streams');
  //   await this.event('stream', 'create', 'stream-count', row.streamCount);
  //   await this.event('stream', 'create/query', 'query-count', queryCount);
  // }
  //
  // async eventStreamDelete() {
  //   const {row} = await DB.selectSingle<{streamCount: number}>('select count(1) as streamCount from streams');
  //   await this.event('stream', 'delete', 'stream-count', row.streamCount);
  // }
  //
  // eventStreamRead() {
  //   this.event('stream', 'read');
  // }
  //
  // eventStreamReadAll() {
  //   this.event('stream', 'read-all');
  // }
  //
  // /* filter stream */
  // async eventFilterStreamCreate() {
  //   const {row} = await DB.selectSingle<{streamCount: number}>('select count(1) as streamCount from streams where type = "filterStream"');
  //   await this.event('filter-stream', 'create', 'filter-stream-count', row.streamCount);
  // }
  //
  // async eventFilterStreamDelete() {
  //   const {row} = await DB.selectSingle<{streamCount: number}>('select count(1) as streamCount from streams where type = "filterStream"');
  //   await this.event('filter-stream', 'delete', 'filter-stream-count', row.streamCount);
  // }
  //
  // async eventFilterStreamRead() {
  //   await this.event('filter-stream', 'read');
  // }
  //
  // eventFilterStreamReadAll() {
  //   this.event('filter-stream', 'read-all');
  // }
  //
  // /* library stream */
  // eventLibraryStreamRead(name) {
  //   this.event('library-stream', 'read', name);
  // }
  //
  // eventLibraryStreamReadAll(name) {
  //   this.event('library-stream', 'read-all', name);
  // }
  //
  // /* system stream */
  // eventSystemStreamRead(name) {
  //   this.event('system-stream', 'read', name);
  // }
  //
  // eventSystemStreamReadAll(name) {
  //   this.event('system-stream', 'read-all', name);
  // }
  //
  //
  // eventIssueReadAll() {
  //   this.event('issue', 'read-all');
  // }
  //
  // eventIssueReadCurrent() {
  //   this.event('issue', 'read-current');
  // }
  //
  // eventIssueMark(flag) {
  //   const action = flag ? 'mark' : 'un-mark';
  //   this.event('issue', action);
  // }
  //
  // eventIssueArchive(flag) {
  //   const action = flag ? 'archive' : 'un-archive';
  //   this.event('issue', action);
  // }
  //
  // eventIssueFilter() {
  //   this.event('issue', 'filter');
  // }
  //
  // /* account */
  // eventAccountCreate() {
  //   this.event('account', 'create', 'account-count', UserPrefRepo.getPrefs().length);
  // }
  //
  // eventAccountDelete() {
  //   this.event('account', 'delete', 'account-count', UserPrefRepo.getPrefs().length);
  // }
  //
  // eventPrefSwitch() {
  //   this.event('account', 'switch', 'active-index', UserPrefRepo.getIndex());
  // }
  //
  // /* pref */
  // eventPrefOpen() {
  //   this.event('pref', 'open');
  // }
  //
  // eventPrefClose() {
  //   this.event('pref', 'close');
  // }
  //
  // eventPrefStreamsSave() {
  //   this.event('pref', 'streams-save');
  // }
  //
  // eventPrefStreamsLoad() {
  //   this.event('pref', 'streams-load');
  // }
  //
  // eventPrefThemeMainLoad() {
  //   this.event('pref', 'theme-main-load');
  // }
  //
  // eventPrefThemeBrowserLoad() {
  //   this.event('pref', 'theme-browser-load');
  // }
  //
  // eventPrefThemeDefaultLoad() {
  //   this.event('pref', 'theme-default-load');
  // }
  //
  // /* menu */
  // eventMenu(name) {
  //   this.event('menu', 'use', name);
  // }
  //
  // /* browser */
  // eventBrowserOpenDiffBody() {
  //   this.event('browser', 'open-diff-body');
  // }

  // https://developers.google.com/analytics/devguides/collection/protocol/v1/
  private async event(category, action, label = null, value = null, session = null) {
    if (!this.initDone) return;

    const params: {[key: string]: any} = {
      v: 1,
      tid: TID,
      ds: 'electron', // data source
      ua: this.userAgent,
      sr: this.screen,
      vp: this.viewPort,
      de: 'UTF-8',
      sd: this.colorDepth,
      an: 'Jasper',
      aid: 'io.jasperapp',
      av: this.version,
      cid: this.gaObj.clientId,
      t: 'event',
      ec: category,
      ea: action,
    };

    if (session) params.sc = session; // start or end
    if (label) params.el = label;
    if (value !== null && value !== undefined) params.ev = value;

    // Logger.n(`GA: ${category}, ${action}, ${label}, ${value}, ${session}`);

    try {
      await this.request(params);
    } catch(e) {
      console.error(`fail sending GA event: category = ${category}, action = ${action}, label = ${label}, value = ${value}, session = ${session}`);
      console.error(e);
      console.error(JSON.stringify(params))
    }
  }

  private async request(params: {[key: string]: any}): Promise<{error?: Error}> {
    const formData = new FormData();
    for (const key of Object.keys(params)) {
      formData.append(key, params[key]);
    }
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    };

    try {
      const res = await fetch('https://www.google-analytics.com/collect', options);
      if (res.status !== 200) {
        const text = await res.text();
        return {error: new Error(text)}
      }
      return {};
    } catch(e) {
      return {error: e};
    }
  }
}

export const GARepo = new _GARepo();
