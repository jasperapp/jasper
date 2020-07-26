import React from 'react';
import ReactDOM from 'react-dom';
import electron from 'electron';
import {StreamEvent} from '../Event/StreamEvent';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {StreamRepo} from '../Repository/StreamRepo';
import {SystemStreamRepo} from '../Repository/SystemStreamRepo';
import {IssueRepo} from '../Repository/IssueRepo';
import {IssueEvent} from '../Event/IssueEvent';
import {IssueFilter} from '../Repository/Issue/IssueFilter';
import {AccountFragment} from './Account/AccountFragment';
import {LibraryStreamsFragment} from './Stream/LibraryStreamsFragment';
import {SystemStreamsFragment} from './Stream/SystemStreamsFragment';
import {StreamsFragment} from './Stream/StreamsFragment';
import {IssuesFragment} from './Issues/IssuesFragment';
import {BrowserFragment} from './Browser/BrowserFragment';
import {ModalStreamSettingFragment} from './Stream/ModalStreamSettingFragment';
import {ModalFilteredStreamSettingFragment} from './Stream/ModalFilteredStreamSettingFragment';
import {FooterFragment} from './Footer/FooterFragment';
import {DateConverter} from '../../Util/DateConverter';
import {ConfigRepo} from '../Repository/ConfigRepo';
import {GARepo} from '../Repository/GARepo';
import {StreamPolling} from '../Infra/StreamPolling';
import {DBIPC} from '../../IPC/DBIPC';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {StreamSetup} from '../Infra/StreamSetup';
import {DBSetup} from '../Infra/DBSetup';
import {VersionRepo} from '../Repository/VersionRepo';
import {ModalPrefFragment} from './ModalPrefFragment';
import {ModalConfigSetupFragment} from './ModalConfigSetupFragment';
import {ConfigType} from '../../Type/ConfigType';
import {AppIPC} from '../../IPC/AppIPC';
import {ModalAboutFragment} from './ModalAboutFragment';
import {FragmentEvent} from '../Event/FragmentEvent';
import {AccountEvent} from '../Event/AccountEvent';

type State = {
  initStatus: 'loading' | 'firstConfigSetup' | 'complete';
  prefShow: boolean;
  aboutShow: boolean;
  configSetupShow: boolean;
}

class AppFragment extends React.Component<any, State> {
  private readonly _streamListenerId: number[] = [];
  private readonly _systemStreamListenerId: number[] = [];
  state: State = {
    initStatus: 'loading',
    prefShow: false,
    aboutShow: false,
    configSetupShow: false,
  }

  async componentDidMount() {
    await this.init();
    {
      let id = SystemStreamEvent.addUpdateStreamListener(this._showNotification.bind(this, 'system'));
      this._systemStreamListenerId.push(id);
    }

    {
      let id = StreamEvent.addUpdateStreamListener(this._showNotification.bind(this, 'stream'));
      this._streamListenerId.push(id);
    }

    FragmentEvent.onShowPref(this, () => this.setState({prefShow: true}));
    FragmentEvent.onShowConfigSetup(this, () => this.setState({configSetupShow: true}));

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

    AppIPC.onPowerMonitorSuspend(() => {
      console.log('PowerMonitor: suspend')
      StreamPolling.stop();
      VersionRepo.stopChecker();
    });

    AppIPC.onPowerMonitorResume(() => {
      console.log('PowerMonitor: resume');
      StreamPolling.start();
      VersionRepo.startChecker();
    });
  }

  componentWillUnmount(): void {
    StreamEvent.removeListeners(this._streamListenerId);
    SystemStreamEvent.removeListeners(this._systemStreamListenerId);
  }

  private async init() {
    const {error} = await ConfigRepo.init();
    if (error) {
      this.setState({initStatus: 'firstConfigSetup'});
      return console.error(error);
    }

    await DBSetup.exec(ConfigRepo.getIndex());
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

  private async handleCloseConfigSetup(github: ConfigType['github']) {
    this.setState({configSetupShow: false});
    if (github) {
      const res = await ConfigRepo.addConfigGitHub(github);
      if (!res) return;
      if (this.state.initStatus === 'firstConfigSetup') {
        await this.init();
      } else {
        AccountEvent.emitCreateAccount();
      }
    }
  }

  async _showNotification(type, streamId, updatedIssueIds) {
    if (!ConfigRepo.getConfig().general.notification) return;

    if (!updatedIssueIds.length) return;

    let stream;
    switch (type) {
      case 'stream':
        stream = await StreamRepo.findStream(streamId);
        break;
      case 'system':
        stream = await SystemStreamRepo.findStream(streamId);
        break;
    }

    let filteredStream = null;
    if (!stream.notification) {
      const tmp = await this._notificationWithFilteredStream(streamId, updatedIssueIds);
      ({filteredStream, updatedIssueIds} = tmp);
      if (!filteredStream || !updatedIssueIds.length) return;
    }

    const allIssues = await IssueRepo.findIssuesByIds(updatedIssueIds, true);
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
    const silent = ConfigRepo.getConfig().general.notificationSilent;
    const notification = new Notification(title, {body, silent});
    notification.addEventListener('click', ()=>{
      switch (type) {
        case 'stream':
          StreamEvent.emitSelectStream(stream, filteredStream);
          break;
        case 'system':
          SystemStreamEvent.emitSelectStream(stream);
          break;
      }

      IssueEvent.emitFocusIssue(issues[0]);
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
      case 'open_about':
        this.setState({aboutShow: true});
        break;
    }
  }

  _setupDetectInput() {

    function detect(ev) {
      const el = ev.srcElement;
      if (!el || !el.tagName) return;

      if (el.tagName.toLowerCase() === 'input' && !['checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'].includes(el.type)) {
        AppIPC.keyboardShortcut(false);
      } else if (el.tagName.toLowerCase() === 'textarea') {
        AppIPC.keyboardShortcut(false);
      } else {
        AppIPC.keyboardShortcut(true);
      }
    }

    window.addEventListener('click', detect, true);
    window.addEventListener('focus', detect, true);

    window.addEventListener('keyup', (ev)=>{
      if (ev.keyCode === 27 && document.activeElement) {
        (document.activeElement as HTMLElement).blur();
        AppIPC.keyboardShortcut(true);
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
      'attributes': true,
      'attributeFilter': ['style'],
    };
    observer.observe(streamsPane, options);
    observer.observe(issuesPane, options);
  }

  render() {
    switch (this.state.initStatus) {
      case 'loading': return this.renderLoading();
      case 'firstConfigSetup': return this.renderFirstConfigSetup();
      case 'complete': return this.renderComplete();
    }
  }

  renderLoading() {
    return null;
  }

  renderFirstConfigSetup() {
    return (
      <ModalConfigSetupFragment show={true} onClose={github => this.handleCloseConfigSetup(github)}/>
    );
  }

  renderComplete() {
    return (
      <div className="window app-window">
        <div className="window-content">
          <div className="pane-group">
            <div className="pane-sm sidebar streams-pane streams">
              <AccountFragment/>
              <LibraryStreamsFragment/>
              <SystemStreamsFragment/>
              <StreamsFragment/>
            </div>
            <div className="pane issues-pane"><IssuesFragment /></div>
            <div className="pane webview-pane"><BrowserFragment/></div>
          </div>
        </div>

        <ModalStreamSettingFragment/>
        <ModalFilteredStreamSettingFragment/>
        <ModalPrefFragment show={this.state.prefShow} onClose={() => this.setState({prefShow: false})}/>
        <ModalAboutFragment show={this.state.aboutShow} onClose={() => this.setState({aboutShow: false})}/>
        <ModalConfigSetupFragment show={this.state.configSetupShow} onClose={this.handleCloseConfigSetup.bind(this)} closable={true}/>

        <FooterFragment/>
      </div>
    );
  }
}

ReactDOM.render(
  <AppFragment/>,
  document.querySelector('#app')
);
