// import fs from 'fs-extra';
// import uuid from 'uuid/v4';
import Logger from 'color-logger';
// import {DB} from '../Main/DB/DB';
import {DBIPC} from '../../IPC/DBIPC';
import {RemoteConfig as Config} from '../Remote';
import {GAIPC} from '../../IPC/GAIPC';
// import {AppPath} from '../Main/AppPath';

const TID = 'UA-77734098-2';

class _GARepo {
  private readonly _gaObj: any;
  private _version: string;
  private _networkAvailable: boolean;
  private _init: boolean;
  private _userAgent: string;
  private _screen: string;
  private _viewPort: string;
  private _colorDepth: string;

  constructor() {
    // const userDataPath = AppPath.getUserData();
    // const gaFilePath = `${userDataPath}/io.jasperapp/ga.json`;
    //
    // this._gaObj = fs.readJsonSync(gaFilePath, {throws: false});
    // if (!this._gaObj) {
    //   this._gaObj = {clientId: uuid()};
    //   fs.writeJsonSync(gaFilePath, this._gaObj, {spaces: 2});
    // }

    this._gaObj = {clientId: 123};
    this._networkAvailable = true;

    GAIPC.onEventAppActive(this.eventAppActive.bind(this));
    GAIPC.onEventAppEnd(this.eventAppEnd.bind(this));
    GAIPC.onEventDeAppActive(this.eventAppDeActive.bind(this));
    GAIPC.onEventMenu((_ev, name) => this.eventMenu(name));
  }

  init({userAgent, width, height, availableWidth, availableHeight, colorDepth}) {
    this._init = true;
    this._userAgent = userAgent;
    this._screen = `${width}x${height}`;
    this._viewPort = `${availableWidth}x${availableHeight}`;
    this._colorDepth = `${colorDepth}-bits`;
    this._version = userAgent.split(' ')[0]?.split('/')[1];
  }

  setNetworkAvailable(available) {
    this._networkAvailable = available;
  }

  // https://developers.google.com/analytics/devguides/collection/protocol/v1/
  private async event(category, action, label = null, value = null, session = null) {
    if (!this._init) return;
    if (!this._networkAvailable) return;

    const params: {[key: string]: any} = {
      v: 1,
      tid: TID,
      ds: 'electron', // data source
      ua: this._userAgent,
      sr: this._screen,
      vp: this._viewPort,
      de: 'UTF-8',
      sd: this._colorDepth,
      an: 'Jasper',
      aid: 'io.jasperapp',
      av: this._version,
      cid: this._gaObj.clientId,
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
      Logger.e(`fail sending GA event: category = ${category}, action = ${action}, label = ${label}, value = ${value}, session = ${session}`);
      Logger.e(e);
      Logger.e(JSON.stringify(params))
    }
  }

  /* app */
  async eventAppStart() {
    this.event('app', 'start', null, null, 'start');

    const {row: row1} = await DBIPC.selectSingle('select count(1) as streamCount from streams');
    this.event('app', 'start/stream', 'stream-count', row1.streamCount);

    const {row: row2} = await DBIPC.selectSingle('select count(1) as filteredStreamCount from filtered_streams');
    this.event('app', 'start/filter', 'filtered-stream-count', row2.filteredStreamCount);

    const {row: row3} = await DBIPC.selectSingle('select count(1) as issueCount from issues');
    this.event('app', 'start/issue', 'issue-count', row3.issueCount);

    this.event('app', 'start/account', 'account-count', Config.configs.length);
  }

  async eventAppEnd() {
    await this.event('app', 'end', null, null, 'end');
  }

  eventAppActive() {
    this.event('app', 'active', null, null, 'start');
  }

  eventAppDeActive() {
    this.event('app', 'de-active', null, null, 'end');
  }

  /* stream */
  async eventStreamCreate(queryCount) {
    const {row} = await DBIPC.selectSingle('select count(1) as streamCount from streams');
    this.event('stream', 'create', 'stream-count', row.streamCount);
    this.event('stream', 'create/query', 'query-count', queryCount);
  }

  async eventStreamDelete() {
    const {row} = await DBIPC.selectSingle('select count(1) as streamCount from streams');
    this.event('stream', 'delete', 'stream-count', row.streamCount);
  }

  eventStreamRead() {
    this.event('stream', 'read');
  }

  eventStreamReadAll() {
    this.event('stream', 'read-all');
  }

  /* filtered stream */
  async eventFilteredStreamCreate() {
    const {row} = await DBIPC.selectSingle('select count(1) as streamCount from filtered_streams');
    this.event('filtered-stream', 'create', 'filtered-stream-count', row.streamCount);
  }

  async eventFilteredStreamDelete() {
    const {row} = await DBIPC.selectSingle('select count(1) as streamCount from filtered_streams');
    this.event('filtered-stream', 'delete', 'filtered-stream-count', row.streamCount);
  }

  eventFilteredStreamRead() {
    this.event('filtered-stream', 'read');
  }

  eventFilteredStreamReadAll() {
    this.event('filtered-stream', 'read-all');
  }

  /* library stream */
  eventLibraryStreamRead(name) {
    this.event('library-stream', 'read', name);
  }

  eventLibraryStreamReadAll(name) {
    this.event('library-stream', 'read-all', name);
  }

  /* system stream */
  eventSystemStreamRead(name) {
    this.event('system-stream', 'read', name);
  }

  eventSystemStreamReadAll(name) {
    this.event('system-stream', 'read-all', name);
  }

  /* issue */
  eventIssueRead(flag) {
    const action = flag ? 'read' : 'un-read';
    this.event('issue', action);
  }

  eventIssueReadAll() {
    this.event('issue', 'read-all');
  }

  eventIssueReadCurrent() {
    this.event('issue', 'read-current');
  }

  eventIssueMark(flag) {
    const action = flag ? 'mark' : 'un-mark';
    this.event('issue', action);
  }

  eventIssueArchive(flag) {
    const action = flag ? 'archive' : 'un-archive';
    this.event('issue', action);
  }

  eventIssueFilter() {
    this.event('issue', 'filter');
  }

  /* account */
  eventAccountCreate() {
    this.event('account', 'create', 'account-count', Config.configs.length);
  }

  eventAccountDelete() {
    this.event('account', 'delete', 'account-count', Config.configs.length);
  }

  eventAccountSwitch() {
    this.event('account', 'switch', 'active-index', Config.activeIndex);
  }

  /* pref */
  eventPrefOpen() {
    this.event('pref', 'open');
  }

  eventPrefClose() {
    this.event('pref', 'close');
  }

  eventPrefStreamsSave() {
    this.event('pref', 'streams-save');
  }

  eventPrefStreamsLoad() {
    this.event('pref', 'streams-load');
  }

  eventPrefThemeMainLoad() {
    this.event('pref', 'theme-main-load');
  }

  eventPrefThemeBrowserLoad() {
    this.event('pref', 'theme-browser-load');
  }

  eventPrefThemeDefaultLoad() {
    this.event('pref', 'theme-default-load');
  }

  /* menu */
  eventMenu(name) {
    this.event('menu', 'use', name);
  }

  /* browser */
  eventBrowserOpenDiffBody() {
    this.event('browser', 'open-diff-body');
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
