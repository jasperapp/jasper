import React from 'react';
import ReactDOM from 'react-dom';
import electron from 'electron';
import {StreamEvent} from '../Event/StreamEvent';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {StreamRepo} from '../Repository/StreamRepo';
import {SystemStreamRepo} from '../Repository/SystemStreamRepo';
import {IssueRepo} from '../Repository/IssueRepo';
import {IssueEvent} from '../Event/IssueEvent';
import {AccountsFragment} from './Account/AccountsFragment';
import {LibraryStreamsFragment} from './Stream/LibraryStream/LibraryStreamsFragment';
import {SystemStreamsFragment} from './Stream/SystemStream/SystemStreamsFragment';
import {StreamsFragment} from './Stream/UserStream/StreamsFragment';
import {IssuesFragment} from './Issues/IssuesFragment';
import {BrowserFragment} from './Browser/BrowserFragment';
import {FooterFragment} from './Footer/FooterFragment';
import {DateUtil} from '../Util/DateUtil';
import {ConfigRepo} from '../Repository/ConfigRepo';
import {GARepo} from '../Repository/GARepo';
import {StreamPolling} from '../Infra/StreamPolling';
import {StreamSetup} from '../Infra/StreamSetup';
import {DBSetup} from '../Infra/DBSetup';
import {VersionRepo} from '../Repository/VersionRepo';
import {PrefEditorFragment} from './PrefEditorFragment';
import {AccountEditorFragment} from './Account/AccountEditorFragment';
import {ConfigType} from '../../Type/ConfigType';
import {AppIPC} from '../../IPC/AppIPC';
import {AboutFragment} from './AboutFragment';
import {FilteredStreamEntity, StreamEntity} from '../Type/StreamEntity';
import {SystemStreamEntity} from '../Type/StreamEntity';
import {FilteredStreamRepo} from '../Repository/FilteredStreamRepo';
import {LibraryStreamEvent} from '../Event/LibraryStreamEvent';
import {TimerUtil} from '../Util/TimerUtil';
import styled from 'styled-components';
import {View} from '../Component/Core/View';
import {appTheme} from '../Style/appTheme';
import {border} from '../Style/layout';

type State = {
  initStatus: 'loading' | 'firstConfigSetup' | 'complete';
  prefShow: boolean;
  aboutShow: boolean;
  configSwitching: boolean;
}

class AppFragment extends React.Component<any, State> {
  state: State = {
    initStatus: 'loading',
    prefShow: false,
    aboutShow: false,
    configSwitching: false,
  }

  async componentDidMount() {
    await this.init();

    SystemStreamEvent.onUpdateStream(this, this._showNotification.bind(this, 'system'));
    StreamEvent.onUpdateStream(this, this._showNotification.bind(this, 'stream'));

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
    StreamEvent.offAll(this);
    SystemStreamEvent.offAll(this);
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
      // this.setupResizeObserver();
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

  private async handleCloseAccountSetup(github: ConfigType['github']) {
    if (github) {
      const res = await ConfigRepo.addConfigGitHub(github);
      if (!res) return;
      await this.init();
    }
  }

  async _showNotification(type, streamId, updatedIssueIds) {
    if (!ConfigRepo.getConfig().general.notification) return;

    if (!updatedIssueIds.length) return;

    let stream: StreamEntity | SystemStreamEntity;
    switch (type) {
      case 'stream':
        const res1 = await StreamRepo.getStream(streamId);
        stream = res1.stream;
        break;
      case 'system':
        const res2 = await SystemStreamRepo.getSystemStream(streamId);
        stream = res2.systemStream;
        break;
    }

    let filteredStream = null;
    if (!stream.notification) {
      const tmp = await this._notificationWithFilteredStream(streamId, updatedIssueIds);
      ({filteredStream, updatedIssueIds} = tmp);
      if (!filteredStream || !updatedIssueIds.length) return;
    }

    const {error, issues: allIssues} = await IssueRepo.getIssues(updatedIssueIds);
    if (error) return console.error(error);
    const issues = allIssues.filter((issue)=> !issue.archived_at);

    // check recently issues
    const targetDate = DateUtil.localToUTCString(new Date(Date.now() - 24 * 60 * 60 * 1000)); // 1day ago
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

  async _notificationWithFilteredStream(streamId: number, updatedIssueIds: number[]): Promise<{filteredStream?: FilteredStreamEntity; updatedIssueIds: number[]}> {
    const {error, filteredStreams} = await FilteredStreamRepo.getAllFilteredStreams();
    if (error) {
      console.error(error);
      return {updatedIssueIds: []}
    }

    const targetFilteredStreams = filteredStreams.filter(s => s.stream_id === streamId && s.notification);
    for (const filteredStream of targetFilteredStreams) {
      const {error, issueIds} = await IssueRepo.getIncludeIds(updatedIssueIds, filteredStream.stream_id, filteredStream.defaultFilter, filteredStream.filter);
      if (error) {
        console.error(error);
        return {updatedIssueIds: []}
      }
      if (issueIds.length) return {filteredStream, updatedIssueIds: issueIds};
    }

    return {updatedIssueIds: []}
  }

  // private updateBrowserViewOffset() {
  //   const webviewPane = document.querySelector('.webview-pane');
  //   const webviewEl = ReactDOM.findDOMNode(webviewPane) as HTMLElement;
  //   const offsetLeft = webviewEl.offsetLeft
  //   // BrowserViewProxy.setOffsetLeft(offsetLeft);
  //   BrowserViewIPC.setOffsetLeft(offsetLeft);
  // }

  _switchLayout(layout) {
    const appWindow = ReactDOM.findDOMNode(this) as HTMLElement;
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

    // this.updateBrowserViewOffset()
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

  // private setupResizeObserver() {
    // const streamsPane = document.querySelector('.streams-pane');
    // const issuesPane = document.querySelector('.issues-pane');
    //
    // const observer = new MutationObserver(()=>{
    //   this._updateBrowserViewOffset()
    // });
    // const options = {
    //   'attributes': true,
    //   'attributeFilter': ['style'],
    // };
    // observer.observe(streamsPane, options);
    // observer.observe(issuesPane, options);
  // }

  private async handleSwitchConfig(configIndex: number) {
    this.setState({configSwitching: true});
    await StreamPolling.stop();

    const {error} = await ConfigRepo.switchConfig(configIndex);
    if (error) return console.error(error);

    await DBSetup.exec(configIndex);
    await StreamSetup.exec();
    StreamPolling.start();

    LibraryStreamEvent.emitSelectFirstStream();
    StreamEvent.emitRestartAllStreams();
    SystemStreamEvent.emitRestartAllStreams();

    await TimerUtil.sleep(100);
    this.setState({configSwitching: false});

    GARepo.eventAccountSwitch();
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
      <AccountEditorFragment show={true} onClose={github => this.handleCloseAccountSetup(github)}/>
    );
  }

  renderComplete() {
    return (
      <Root style={{opacity: this.state.configSwitching ? 0.3 : 1}}>
        <Main>
          <StreamsColumn>
            <AccountsFragment onSwitchConfig={this.handleSwitchConfig.bind(this)}/>
            <LibraryStreamsFragment/>
            <SystemStreamsFragment/>
            <StreamsFragment/>
          </StreamsColumn>
          <IssuesFragment/>
          {/*<div className="pane webview-pane">*/}
            <BrowserFragment/>
          {/*</div>*/}
        </Main>
        <FooterFragment/>

        <PrefEditorFragment show={this.state.prefShow} onClose={() => this.setState({prefShow: false})}/>
        <AboutFragment show={this.state.aboutShow} onClose={() => this.setState({aboutShow: false})}/>
      </Root>
    );
  }
}

const Root = styled(View)`
  width: 100vw;
  height: 100vh;
`;

const Main = styled(View)`
  flex-direction: row;
  flex: 1;
`;

const StreamsColumn = styled(View)`
  width: 220px;
  min-width: 150px;
  resize: horizontal;
  height: 100%;
  background: ${() => appTheme().bgSide};
  border: solid ${border.medium}px ${() => appTheme().borderColor};
  overflow-y: scroll;
`;

ReactDOM.render(
  <AppFragment/>,
  document.querySelector('#app')
);
