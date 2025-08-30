import React from 'react';
import ReactDOM from 'react-dom';
import styled, {createGlobalStyle} from 'styled-components';
import {BrowserViewIPCChannels} from '../../IPC/BrowserViewIPC/BrowserViewIPC.channel';
import {MainWindowIPCChannels} from '../../IPC/MainWindowIPC/MainWindowIPC.channel';
import {StreamIPCChannels} from '../../IPC/StreamIPC/StreamIPC.channel';
import {AppEvent} from '../Event/AppEvent';
import {IssueEvent} from '../Event/IssueEvent';
import {StreamEvent} from '../Event/StreamEvent';
import {UserPrefEvent} from '../Event/UserPrefEvent';
import {GitHubV4IssueClient} from '../Library/GitHub/V4/GitHubV4IssueClient';
import {DB} from '../Library/Infra/DB';
import {appTheme} from '../Library/Style/appTheme';
import {border, font} from '../Library/Style/layout';
import {UserPrefEntity} from '../Library/Type/UserPrefEntity';
import {GitHubUtil} from '../Library/Util/GitHubUtil';
import {PlatformUtil} from '../Library/Util/PlatformUtil';
import {TimerUtil} from '../Library/Util/TimerUtil';
import {Loading} from '../Library/View/Loading';
import {View} from '../Library/View/View';
import {GARepo} from '../Repository/GARepo';
import {GitHubNotificationPolling} from '../Repository/GitHubNotificationPolling';
import {IssueRepo} from '../Repository/IssueRepo';
import {DatePolling} from '../Repository/Polling/DatePolling';
import {ForceUpdateIssuePolling} from '../Repository/Polling/ForceUpdateIssuePolling';
import {StreamPolling} from '../Repository/Polling/StreamPolling';
import {VersionPolling} from '../Repository/Polling/VersionPolling';
import {DBSetup} from '../Repository/Setup/DBSetup';
import {StreamSetup} from '../Repository/Setup/StreamSetup';
import {StreamRepo} from '../Repository/StreamRepo';
import {UserPrefRepo} from '../Repository/UserPrefRepo';
import {BrowserFragment} from './Browser/BrowserFragment';
import {IssuesFragment} from './Issues/IssuesFragment';
import {JumpNavigationFragment} from './JumpNavigation/JumpNavigationFragment';
import {LoggerFragment} from './Log/LoggerFragment';
import {AboutFragment} from './Other/AboutFragment';
import {BadgeFragment} from './Other/BadgeFragment';
import {ExportDataFragment} from './Other/ExportDataFragment';
import {KeyboardShortcutFragment} from './Other/KeyboardShortcutFragment';
import {NotificationFragment} from './Other/NotificationFragment';
import {PrefCoverFragment} from './Pref/PrefCoverFragment';
import {PrefNetworkErrorFragment} from './Pref/PrefNetworkErrorFragment';
import {PrefScopeErrorFragment} from './Pref/PrefScopeErrorFragment';
import {PrefSetupFragment} from './Pref/PrefSetupFragment';
import {PrefUnauthorizedFragment} from './Pref/PrefUnauthorizedFragment';
import {SideFragment} from './Side/SideFragment';
import {LibraryStreamsFragment} from './Stream/LibraryStream/LibraryStreamsFragment';
import {SystemStreamsFragment} from './Stream/SystemStream/SystemStreamsFragment';
import {UserStreamsFragment} from './Stream/UserStream/UserStreamsFragment';
import {StreamSetupCardFragment} from './StreamSetup/StreamSetupCardFragment';

type Props = {
}

type State = {
  initStatus: 'loading' | 'error' | 'complete';
  prefSwitchingStatus: 'loading' | 'error' | 'complete';
  prefIndex: number;
  githubUrl: string;
  isPrefNetworkError: boolean;
  isPrefScopeError: boolean;
  isPrefNotFoundError: boolean;
  isUnauthorized: boolean;
  aboutShow: boolean;
  layout: 'one' | 'two' | 'three';
  showJumpNavigation: boolean;
  initialKeywordForJumpNavigation: string;
}

class MainWindowFragment extends React.Component<Props, State> {
  state: State = {
    initStatus: 'loading',
    prefSwitchingStatus: 'complete',
    prefIndex: 0,
    githubUrl: '',
    isPrefNetworkError: false,
    isPrefScopeError: false,
    isUnauthorized: false,
    isPrefNotFoundError: false,
    aboutShow: false,
    layout: 'three',
    showJumpNavigation: false,
    initialKeywordForJumpNavigation: '',
  }

  private libraryStreamsFragmentRef: LibraryStreamsFragment;
  private systemStreamsFragmentRef: SystemStreamsFragment;
  private userStreamsFragmentRef: UserStreamsFragment;

  async componentDidMount() {
    const eachPaths = await window.ipc.userPref.getEachPaths();
    console.table(eachPaths);

    await this.init();

    AppEvent.onNextLayout(this, () => this.handleNextLayout());
    AppEvent.onJumpNavigation(this, () => this.handleShowJumpNavigation());
    AppEvent.onChangedTheme(this, () => {
      this.forceUpdate(() => {
        this.selectFirstStream();
        StreamEvent.emitReloadAllStreams();
      });
    });

    window.ipc.on(MainWindowIPCChannels.toggleLayout, (_, layout) => this.handleToggleLayout(layout));
    window.ipc.on(MainWindowIPCChannels.showAbout, () => this.setState({aboutShow: true}));
    window.ipc.on(MainWindowIPCChannels.powerMonitorSuspend, () => this.handleStopPolling());
    window.ipc.on(MainWindowIPCChannels.powerMonitorResume, () => this.handleStartPolling());
    window.ipc.on(MainWindowIPCChannels.showJumpNavigation, () => this.handleShowJumpNavigation());
    window.ipc.on(MainWindowIPCChannels.showRecentlyReads, () => this.handleShowJumpNavigation('sort:read'));

    window.ipc.on(StreamIPCChannels.selectNextStream, () => this.handleNextPrevStream(1));
    window.ipc.on(StreamIPCChannels.selectPrevStream, () => this.handleNextPrevStream(-1));

    window.ipc.on(BrowserViewIPCChannels.eventOpenIssueWindow, (_ev, url) => this.handleOpenIssueWindow(url));

    window.addEventListener('online',  () => navigator.onLine === true && this.handleStartPolling());
    window.addEventListener('offline',  () => this.handleStopPolling());
  }

  componentWillUnmount() {
    AppEvent.offAll(this);
  }

  // ここを変更する場合、this.switchPref()も見直すこと
  // todo: switchPref()と共通化する
  private async init() {
    this.setState({initStatus: 'loading'});
    const {error, githubUrl, isPrefNotFoundError, isPrefScopeError, isPrefNetworkError, isUnauthorized} = await UserPrefRepo.init();
    if (error) {
      this.setState({initStatus: 'error', githubUrl, isPrefNetworkError, isPrefNotFoundError, isPrefScopeError, isUnauthorized});
      return console.error(error);
    }

    const dbPath = await UserPrefRepo.getDBPath();
    const {error: dbError} = await DBSetup.exec(dbPath);
    if (dbError){
      console.error(dbError);
      alert('The database is corrupted. Delete and initialize the database.');
      await DB.deleteDBFile();
      this.init();
      return;
    }

    await StreamSetup.exec();
    ForceUpdateIssuePolling.start();
    VersionPolling.startChecker();
    DatePolling.start();

    // node_idのmigrationが走ったときだけ、直近のissueをv4対応させる
    // node_idのmigrationが走った = v0.9.3からv1.0.0へのアップデート
    if (DBSetup.isMigrationNodeId()) this.updateRecentlyIssues();

    this.initGA();
    GARepo.eventAppStart();
    StreamPolling.start();
    GitHubNotificationPolling.start();

    this.setState({initStatus: 'complete', prefIndex: UserPrefRepo.getIndex()}, () => this.selectFirstStream());
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

  private async selectFirstStream() {
    let streamId;
    while (1) {
      const libRes = this.libraryStreamsFragmentRef.getStreamIds();
      const sysRes = this.systemStreamsFragmentRef.getStreamIds();
      const userRes = this.userStreamsFragmentRef.getStreamIds();

      const streamIds = [...libRes.streamIds, ...sysRes.streamIds, ...userRes.streamIds];
      if (streamIds.length) {
        streamId = streamIds[0];
        break;
      }

      await TimerUtil.sleep(100);
    }
    const {error, stream} = await StreamRepo.getStream(streamId);
    if (error) return console.error(error);
    await StreamEvent.emitSelectStream(stream);
  }

  private async updateRecentlyIssues() {
    const {error, issues} = await IssueRepo.getRecentlyIssues();
    if (error) return console.error(error);

    const github = UserPrefRepo.getPref().github;
    const client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, UserPrefRepo.getGHEVersion());
    const {error: e1, issues: v4Issues} = await client.getIssuesByNodeIds(issues);
    if (e1) return console.error(e1);

    const {error: e2} = await IssueRepo.updateWithV4(v4Issues);
    if (e2) return console.error(e2);
  }

  private async handleSwitchPref(prefIndex: number) {
    this.setState({prefSwitchingStatus: 'loading', prefIndex});
    await StreamPolling.stop();
    ForceUpdateIssuePolling.stop();
    GitHubNotificationPolling.stop();

    const {error, isPrefNetworkError, isPrefScopeError, isUnauthorized, githubUrl} = await UserPrefRepo.switchPref(prefIndex);
    if (error) {
      this.setState({prefSwitchingStatus: 'error', githubUrl, isPrefNetworkError, isPrefScopeError, isUnauthorized});
      return console.error(error);
    }

    const dbPath = await UserPrefRepo.getDBPath();
    const {error: dbError} = await DBSetup.exec(dbPath);
    if (dbError){
      console.error(dbError);
      alert('The database is corrupted. Delete and initialize the database.');
      await DB.deleteDBFile();
      this.handleSwitchPref(prefIndex);
      return;
    }

    await StreamSetup.exec();

    if (DBSetup.isMigrationNodeId()) this.updateRecentlyIssues();

    ForceUpdateIssuePolling.start();
    StreamPolling.start();
    GitHubNotificationPolling.start();
    StreamEvent.emitReloadAllStreams();

    await TimerUtil.sleep(100);
    this.setState({prefSwitchingStatus: 'complete'}, () => this.selectFirstStream());
    UserPrefEvent.emitSwitchPref();
  }

  private async handleOpenIssueWindow(url: string) {
    const host = UserPrefRepo.getPref().github.webHost;
    if (GitHubUtil.isIssueUrl(host, url)) {
      // get issue
      const {repo, issueNumber} = GitHubUtil.getInfo(url);
      const {error: e1, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
      if (e1 != null) return console.error(e1);

      // update issue
      const {error: e2, issue: updatedIssue} = await IssueRepo.updateRead(issue.id, new Date());
      if (e2 != null) return console.error(e2);

      IssueEvent.emitUpdateIssues([updatedIssue], [issue], 'read');
    }
  }

  private handleNextPrevStream(direction: 1 | -1) {
    const libRes = this.libraryStreamsFragmentRef.getStreamIds();
    const sysRes = this.systemStreamsFragmentRef.getStreamIds();
    const userRes = this.userStreamsFragmentRef.getStreamIds();

    const streamIds = [...libRes.streamIds, ...sysRes.streamIds, ...userRes.streamIds];
    const selectedStreamId = libRes.selectedStreamId ?? sysRes.selectedStreamId ?? userRes.selectedStreamId;

    const currentIndex = streamIds.findIndex(streamId => streamId === selectedStreamId);
    const index = currentIndex + direction;
    const streamId = streamIds[index];

    this.libraryStreamsFragmentRef.selectStream(streamId);
    this.systemStreamsFragmentRef.selectStream(streamId);
    this.userStreamsFragmentRef.selectStream(streamId);
  }

  private handleShowJumpNavigation(initialKeyword: string = '') {
    this.setState({showJumpNavigation: true, initialKeywordForJumpNavigation: initialKeyword});
  }

  private handleNextLayout() {
    switch (this.state.layout) {
      case 'one':
        this.setState({layout: 'three'});
        break;
      case 'two':
        this.setState({layout: 'one'});
        break;
      case 'three':
        this.setState({layout: 'two'});
        break;
    }
    AppEvent.emitChangedLayout();
  }

  private handleToggleLayout(layout: State['layout']) {
    if (this.state.layout === layout) {
      this.setState({layout: 'three'});
    } else {
      this.setState({layout});
    }
    AppEvent.emitChangedLayout();
  }

  private handleStopPolling() {
    StreamPolling.stop();
    VersionPolling.stopChecker();
    ForceUpdateIssuePolling.stop();
    DatePolling.stop();
  }

  private handleStartPolling() {
    StreamPolling.start();
    VersionPolling.startChecker();
    ForceUpdateIssuePolling.start();
    DatePolling.start();
  }

  private async handleClosePrefSetup(github: UserPrefEntity['github'], browser: UserPrefEntity['general']['browser']) {
    if (github) {
      const res = await UserPrefRepo.addPrefGitHub(github, browser);
      if (!res) return;
      await this.init();
    }
  }

  render() {
    switch (this.state.initStatus) {
      case 'loading': return this.renderLoading();
      case 'error': return this.renderError();
      case 'complete': return this.renderComplete();
    }
  }

  renderLoading() {
    return (
      <Root style={{justifyContent: 'center'}}>
        <Loading show={true}/>
        <LoggerFragment/>
        <GlobalStyle/>
      </Root>
    );
  }

  renderError() {
    if (this.state.initStatus !== 'error') return null;

    if (this.state.isPrefNotFoundError) {
      return (
        <React.Fragment>
          <PrefSetupFragment show={true} showImportData={true} onClose={(github, browser) => this.handleClosePrefSetup(github, browser)}/>
          <KeyboardShortcutFragment/>
          <GlobalStyle/>
          <LoggerFragment/>
        </React.Fragment>
      );
    }

    if (this.state.isPrefNetworkError) {
      return (
        <React.Fragment>
          <PrefNetworkErrorFragment githubUrl={this.state.githubUrl} onRetry={() => this.init()}/>
          <KeyboardShortcutFragment/>
          <GlobalStyle/>
          <LoggerFragment/>
        </React.Fragment>
      );
    }

    if (this.state.isPrefScopeError) {
      return (
        <React.Fragment>
          <PrefScopeErrorFragment onRetry={() => this.init()}/>
          <GlobalStyle/>
          <LoggerFragment/>
        </React.Fragment>
      );
    }

    if (this.state.isUnauthorized) {
      return (
        <React.Fragment>
          <PrefUnauthorizedFragment onRetry={() => this.init()}/>
          <GlobalStyle/>
          <LoggerFragment/>
        </React.Fragment>
      );
    }
  }

  renderComplete() {
    const layoutClassName = `app-layout-${this.state.layout}`;
    const prefSwitchingClassName = this.state.prefSwitchingStatus  === 'loading' ? 'app-pref-switching-loading' : '';

    return (
      <Root className={`${layoutClassName} ${prefSwitchingClassName}`}>
        <Main>
          <SideFragment className='app-streams-column'>
            <PrefCoverFragment onSwitchPref={this.handleSwitchPref.bind(this)}/>
            <LibraryStreamsFragment ref={ref => this.libraryStreamsFragmentRef = ref}/>
            <SystemStreamsFragment ref={ref => this.systemStreamsFragmentRef = ref}/>
            <UserStreamsFragment ref={ref => this.userStreamsFragmentRef = ref}/>
          </SideFragment>
          <IssuesFragment className='app-issues-column'/>
          <BrowserFragment className='app-browser-column'/>
        </Main>

        <StreamSetupCardFragment/>
        <AboutFragment show={this.state.aboutShow} onClose={() => this.setState({aboutShow: false})}/>
        <NotificationFragment/>
        <KeyboardShortcutFragment/>
        <BadgeFragment/>
        <JumpNavigationFragment
          show={this.state.showJumpNavigation}
          onClose={() => this.setState({showJumpNavigation: false})}
          initialKeyword={this.state.initialKeywordForJumpNavigation}
        />
        {this.renderPrefSwitchingError()}
        <ExportDataFragment/>
        <LoggerFragment/>
        <GlobalStyle/>
      </Root>
    );
  }

  private renderPrefSwitchingError() {
    if (this.state.prefSwitchingStatus !== 'error') return;

    if (this.state.isPrefNetworkError) {
      return (
        <PrefNetworkErrorFragment githubUrl={this.state.githubUrl} onRetry={() => this.handleSwitchPref(this.state.prefIndex)}/>
      );
    }

    if (this.state.isPrefScopeError) {
      return (
        <PrefScopeErrorFragment onRetry={() => this.handleSwitchPref(this.state.prefIndex)}/>
      );
    }

    if (this.state.isUnauthorized) {
      return (
        <PrefUnauthorizedFragment onRetry={() => this.handleSwitchPref(this.state.prefIndex)}/>
      );
    }
  }
}

const Root = styled(View)`
  width: 100vw;
  height: 100vh;
  border-top: solid ${PlatformUtil.isMac() ? 0 : border.medium}px ${() => appTheme().border.normal};
  
  &.app-layout-one .app-streams-column, &.app-layout-one .app-issues-column {
    display: none;
  }
  
  &.app-layout-two .app-streams-column {
    display: none;
  }
  
  &.app-pref-switching-loading {
    opacity: 0.3;
  }
`;

const Main = styled(View)`
  flex-direction: row;
  flex: 1;
`;

export const GlobalStyle = createGlobalStyle`
  * {
    outline: none;
    user-select: none;
  }
  
  body {
    margin: 0;
    font-family: -apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji;
    font-size: ${font.medium}px;
    color: ${() => appTheme().text.normal};
    line-height: 1.6;
  } 
`;

// export function mountFragment() {
//   ReactDOM.render(
//     <MainWindowFragment/>,
//     document.querySelector('#root')
//   );
// }

window.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<MainWindowFragment/>, document.querySelector('#root'));
});
