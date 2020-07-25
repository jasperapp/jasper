import React from 'react';
import ReactDOM from 'react-dom';
import electron from 'electron';
import {StreamEmitter} from '../StreamEmitter';
import {SystemStreamEmitter} from '../SystemStreamEmitter';
import {StreamCenter} from '../StreamCenter';
import {SystemStreamCenter} from '../SystemStreamCenter';
import {IssueCenter} from '../IssueCenter';
import {IssueEmitter} from '../IssueEmitter';
import {IssueFilter} from '../Issue/IssueFilter';
import {AccountComponent} from './AccountComponent';
import {LibraryStreamsComponent} from './LibraryStreamsComponent';
import {SystemStreamsComponent} from './SystemStreamsComponent';
import {StreamsComponent} from './StreamsComponent';
import {IssuesComponent} from './IssuesComponent';
import {BrowserViewComponent} from './BrowserViewComponent';
import {StreamSettingComponent} from './StreamSettingComponent';
import {FilteredStreamSettingComponent} from './FilteredStreamSettingComponent';
import {FooterComponent} from './FooterComponent';
import {AccountSettingComponent} from './AccountSettingComponent';
import {DateConverter} from '../../Util/DateConverter';
import {Config} from '../Config';
import {GARepo} from '../Repository/GARepo';
import {StreamPolling} from '../Infra/StreamPolling';
import {DBIPC} from '../../IPC/DBIPC';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {StreamSetup} from '../Infra/StreamSetup';
import {DBSetup} from '../Infra/DBSetup';
import {VersionRepo} from '../Repository/VersionRepo';
import {PowerMonitorIPC} from '../../IPC/PowerMonitorIPC';
import {PrefComponent} from './PrefComponent';
import {ConfigSetupComponent} from './ConfigSetupComponent';
import {ConfigType} from '../../Type/ConfigType';
import {KeyboardShortcutIPC} from '../../IPC/KeyboardShortcutIPC';

type State = {
  initStatus: 'noConfig' | 'failLoginName' | 'complete';
  prefShow: boolean;
}

class AppComponent extends React.Component<any, State> {
  private readonly _streamListenerId: number[] = [];
  private readonly _systemStreamListenerId: number[] = [];
  state: State = {
    initStatus: null,
    prefShow: false,
  }

  async componentDidMount() {
    await this.init();
    {
      let id = SystemStreamEmitter.addUpdateStreamListener(this._showNotification.bind(this, 'system'));
      this._systemStreamListenerId.push(id);
    }

    {
      let id = StreamEmitter.addUpdateStreamListener(this._showNotification.bind(this, 'stream'));
      this._streamListenerId.push(id);
    }

    electron.ipcRenderer.on('switch-layout', (_ev, layout)=>{
      this._switchLayout(layout);
    });

    electron.ipcRenderer.on('command-app', (_ev, commandItem)=>{
      this._handleCommand(commandItem);
    });

    // online / offline
    {
      const updateOnlineStatus = () => {
        GARepo.setNetworkAvailable(navigator.onLine);
        if (navigator.onLine) {
          StreamPolling.restart();
        } else {
          StreamPolling.stop();
        }
      };

      window.addEventListener('online',  updateOnlineStatus);
      window.addEventListener('offline',  updateOnlineStatus);
    }

    PowerMonitorIPC.onSuspend(() => {
      console.log('PowerMonitor: suspend')
      StreamPolling.stop();
      VersionRepo.stopChecker();
    });

    PowerMonitorIPC.onResume(() => {
      console.log('PowerMonitor: resume');
      StreamPolling.start();
      VersionRepo.startChecker();
    });
  }

  componentWillUnmount(): void {
    StreamEmitter.removeListeners(this._streamListenerId);
    SystemStreamEmitter.removeListeners(this._systemStreamListenerId);
  }

  private async init() {
    const {error} = await Config.init();
    if (error) {
      this.setState({initStatus: 'noConfig'});
      return console.error(error);
    }

    await DBSetup.exec(Config.getIndex());
    await StreamSetup.exec();
    await VersionRepo.startChecker();

    this.initGA();
    this.initZoom();
    GARepo.eventAppStart();
    StreamPolling.start();
    this.setState({initStatus: 'complete'}, () => {
      this._setupDetectInput();
      this._setupResizeObserver();
    });
  }

  private initZoom() {
    electron.webFrame.setVisualZoomLevelLimits(1, 1);
    electron.webFrame.setZoomFactor(1.0);
  }

  private initGA() {
    GARepo.init({
      userAgent: navigator.userAgent,
      width: screen.width,
      height: screen.height,
      availableWidth: screen.availWidth,
      availableHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
    });
  }

  private async handleSuccessSetupConfig(github: ConfigType['github']) {
    await Config.addConfigGitHub(github);
    if (this.state.initStatus === 'noConfig') await this.init();
  }

  async _showNotification(type, streamId, updatedIssueIds) {
    if (!Config.getConfig().general.notification) return;

    if (!updatedIssueIds.length) return;

    let stream;
    switch (type) {
      case 'stream':
        stream = await StreamCenter.findStream(streamId);
        break;
      case 'system':
        stream = await SystemStreamCenter.findStream(streamId);
        break;
    }

    let filteredStream = null;
    if (!stream.notification) {
      const tmp = await this._notificationWithFilteredStream(streamId, updatedIssueIds);
      ({filteredStream, updatedIssueIds} = tmp);
      if (!filteredStream || !updatedIssueIds.length) return;
    }

    const allIssues = await IssueCenter.findIssuesByIds(updatedIssueIds, true);
    const issues = allIssues.filter((issue)=> !issue.archived_at);

    // check recently issues
    const targetDate = DateConverter.localToUTCString(new Date(Date.now() - 24 * 60 * 60 * 1000)); // 1day ago
    const recentlyIssues = issues.filter((issue)=> issue.updated_at > targetDate);
    if (recentlyIssues.length === 0) return;

    // build body
    const title = `"${filteredStream ? filteredStream.name : stream.name}" was updated (${issues.length})`;
    let body;
    if (issues.length === 1) {
      body = `"${issues[0].title}"`;
    } else {
      body = `"${issues[0].title}" and more`;
    }

    // notify
    const silent = Config.getConfig().general.notificationSilent;
    const notification = new Notification(title, {body, silent});
    notification.addEventListener('click', ()=>{
      switch (type) {
        case 'stream':
          StreamEmitter.emitSelectStream(stream, filteredStream);
          break;
        case 'system':
          SystemStreamEmitter.emitSelectStream(stream);
          break;
      }

      IssueEmitter.emitFocusIssue(issues[0]);
    });
  }

  async _notificationWithFilteredStream(streamId, updatedIssueIds) {
    const {rows: filteredStreams} = await DBIPC.select(`
        select
          *
        from
          filtered_streams
        where
          stream_id = ?
          and notification = 1
      `, [streamId]);

    for (const filteredStream of filteredStreams) {
      const tmp = IssueFilter.buildCondition(filteredStream.filter);
      const {rows: updatedIssues} = await DBIPC.select(`
        select
          *
        from
          issues
        where
          archived_at is null
          and id in (select issue_id from streams_issues where stream_id = ${streamId})
          and ${tmp.filter}
          and id in (${updatedIssueIds.join(',')})
      `);
      if (!updatedIssues.length) continue;

      updatedIssueIds = updatedIssues.map((v) => v.id);

      return {filteredStream, updatedIssueIds};
    }

    return {};
  }

  _updateBrowserViewOffset() {
    const webviewPane = document.querySelector('.webview-pane');
    const webviewEl = ReactDOM.findDOMNode(webviewPane);
    const offsetLeft = webviewEl.offsetLeft
    // BrowserViewProxy.setOffsetLeft(offsetLeft);
    BrowserViewIPC.setOffsetLeft(offsetLeft);
  }

  _switchLayout(layout) {
    const appWindow = ReactDOM.findDOMNode(this);
    switch (layout) {
      case 'single':
        if (appWindow.dataset.layout === 'single') {
          appWindow.dataset.layout = null;
        } else {
          appWindow.dataset.layout = 'single';
        }
        break;
      case 'two':
        if (appWindow.dataset.layout === 'two') {
          appWindow.dataset.layout = null;
        } else {
          appWindow.dataset.layout = 'two';
        }
        break;
      case 'three':
        appWindow.dataset.layout = null;
        break;
    }

    this._updateBrowserViewOffset()
  }

  _handleMovingStream(direction) {
    let targetStreamEl;

    const activeStreamEl = document.querySelector('.streams-pane.streams .nav-group-item.active');
    if (activeStreamEl) {
      const prefix = direction > 0 ? 'next' : 'previous';
      targetStreamEl = activeStreamEl[`${prefix}ElementSibling`];
      if (targetStreamEl && !targetStreamEl.classList.contains('nav-group-item')) targetStreamEl = null;

      if (!targetStreamEl) {
        const parentEl = activeStreamEl.parentElement[`${prefix}ElementSibling`];
        const querySuffix = direction > 0 ? 'first-of-type': 'last-of-type';
        if (parentEl) targetStreamEl = parentEl.querySelector(`.nav-group-item:${querySuffix}`);
      }
    } else {
      targetStreamEl = document.querySelector('.streams-pane.streams .nav-group-item');
    }

    if (targetStreamEl) {
      const event = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      targetStreamEl.dispatchEvent(event);
    }
  }

  _handleLoadStream(query) {
    const el = document.querySelector(query);
    if (el) {
      const event = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': true
      });
      el.dispatchEvent(event);
    }
  }

  _handleCommand(commandItem) {
    switch (commandItem.command) {
      case 'next_stream':
        this._handleMovingStream(1);
        break;
      case 'prev_stream':
        this._handleMovingStream(-1);
        break;

      // load library streams
      case 'load_inbox':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(2) .nav-group-item:nth-of-type(1)');
        break;
      case 'load_unread':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(2) .nav-group-item:nth-of-type(2)');
        break;
      case 'load_open':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(2) .nav-group-item:nth-of-type(3)');
        break;
      case 'load_mark':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(2) .nav-group-item:nth-of-type(4)');
        break;
      case 'load_archive':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(2) .nav-group-item:nth-of-type(5)');
        break;

      // load system streams
      case 'load_me':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(3) .nav-group-item:nth-of-type(1)');
        break;
      case 'load_team':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(3) .nav-group-item:nth-of-type(2)');
        break;
      case 'load_watching':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(3) .nav-group-item:nth-of-type(3)');
        break;
      case 'load_subscription':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(3) .nav-group-item:nth-of-type(4)');
        break;

      // load streams
      case 'load_1st':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(4) .nav-group-item:nth-of-type(1)');
        break;
      case 'load_2nd':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(4) .nav-group-item:nth-of-type(2)');
        break;
      case 'load_3rd':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(4) .nav-group-item:nth-of-type(3)');
        break;
      case 'load_4th':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(4) .nav-group-item:nth-of-type(4)');
        break;
      case 'load_5th':
        this._handleLoadStream('.streams-pane.streams .nav-group:nth-of-type(4) .nav-group-item:nth-of-type(5)');
        break;

      // pref
      case 'open_pref':
        this.setState({prefShow: true});
        break;
    }
  }

  _setupDetectInput() {

    function detect(ev) {
      const el = ev.srcElement;
      if (!el || !el.tagName) return;

      if (el.tagName.toLowerCase() === 'input' && !['checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'].includes(el.type)) {
        KeyboardShortcutIPC.enable(false);
      } else if (el.tagName.toLowerCase() === 'textarea') {
        KeyboardShortcutIPC.enable(false);
      } else {
        KeyboardShortcutIPC.enable(true);
      }
    }

    window.addEventListener('click', detect, true);
    window.addEventListener('focus', detect, true);

    window.addEventListener('keyup', (ev)=>{
      if (ev.keyCode === 27 && document.activeElement) {
        (document.activeElement as HTMLElement).blur();
        KeyboardShortcutIPC.enable(true);
      } else if (ev.keyCode === 13 && document.activeElement) {
        detect(ev);
      }
    });
  }

  _setupResizeObserver() {
    const streamsPane = document.querySelector('.streams-pane');
    const issuesPane = document.querySelector('.issues-pane');

    const observer = new MutationObserver(()=>{
      this._updateBrowserViewOffset()
    });
    const options = {
      'attriblutes': true,
      'attributeFilter': ['style'],
    };
    observer.observe(streamsPane, options);
    observer.observe(issuesPane, options);
  }

  render() {
    if (!this.state.initStatus) return null;

    if (this.state.initStatus === 'failLoginName') {
      return (
        <div id="failContent">
          <div id="failMessage">Fail requesting to GitHub/GHE. Please check network, VPN, ssh-proxy and more.</div>
          <div id="openGitHub">Open GitHub/GHE to check access</div>
        </div>
      );
    }

    if (this.state.initStatus === 'noConfig') {
      return (
        <ConfigSetupComponent onSuccess={github => this.handleSuccessSetupConfig(github)}/>
      );
    }

    return (
      <div className="window app-window">
        <div className="window-content">
          <div className="pane-group">
            <div className="pane-sm sidebar streams-pane streams">
              <AccountComponent/>
              <LibraryStreamsComponent/>
              <SystemStreamsComponent/>
              <StreamsComponent/>
            </div>
            <div className="pane issues-pane"><IssuesComponent /></div>
            <div className="pane webview-pane"><BrowserViewComponent/></div>
          </div>
        </div>

        <StreamSettingComponent/>
        <FilteredStreamSettingComponent/>
        <AccountSettingComponent/>
        <PrefComponent show={this.state.prefShow} onClose={() => this.setState({prefShow: false})}/>

        <FooterComponent/>
      </div>
    );
  }
}

ReactDOM.render(
  <AppComponent/>,
  document.querySelector('#app')
);
