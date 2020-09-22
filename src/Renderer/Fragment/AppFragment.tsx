import React from 'react';
import ReactDOM from 'react-dom';
import {StreamEvent} from '../Event/StreamEvent';
import {PrefCoverFragment} from './Pref/PrefCoverFragment';
import {LibraryStreamsFragment} from './Stream/LibraryStream/LibraryStreamsFragment';
import {SystemStreamsFragment} from './Stream/SystemStream/SystemStreamsFragment';
import {UserStreamsFragment} from './Stream/UserStream/UserStreamsFragment';
import {IssuesFragment} from './Issues/IssuesFragment';
import {BrowserFragment} from './Browser/BrowserFragment';
import {UserPrefRepo} from '../Repository/UserPrefRepo';
import {GARepo} from '../Repository/GARepo';
import {StreamPolling} from '../Repository/Polling/StreamPolling';
import {StreamSetup} from '../Repository/Setup/StreamSetup';
import {DBSetup} from '../Repository/Setup/DBSetup';
import {VersionPolling} from '../Repository/Polling/VersionPolling';
import {PrefSetupFragment} from './Pref/PrefSetupFragment';
import {UserPrefEntity} from '../Library/Type/UserPrefEntity';
import {MainWindowIPC} from '../../IPC/MainWindowIPC';
import {AboutFragment} from './Other/AboutFragment';
import {TimerUtil} from '../Library/Util/TimerUtil';
import styled, {createGlobalStyle} from 'styled-components';
import {View} from '../Library/View/View';
import {appTheme} from '../Library/Style/appTheme';
import {font} from '../Library/Style/layout';
import {NotificationFragment} from './Other/NotificationFragment';
import {KeyboardShortcutFragment} from './Other/KeyboardShortcutFragment';
import {UserPrefIPC} from '../../IPC/UserPrefIPC';
import {BadgeFragment} from './Other/BadgeFragment';
import {UserPrefEvent} from '../Event/UserPrefEvent';
import {StreamRepo} from '../Repository/StreamRepo';
import {AppEvent} from '../Event/AppEvent';
import {StreamIPC} from '../../IPC/StreamIPC';
import {JumpNavigationFragment} from './JumpNavigation/JumpNavigationFragment';
import {IssueRepo} from '../Repository/IssueRepo';
import {GitHubV4IssueClient} from '../Library/GitHub/V4/GitHubV4IssueClient';
import {PrefScopeErrorFragment} from './Pref/PrefScopeErrorFragment';
import {PrefNetworkErrorFragment} from './Pref/PrefNetworkErrorFragment';
import {IntroFragment} from './Other/IntroFragment';
import {GitHubNotificationPolling} from '../Repository/GitHubNotificationPolling';
import {SideFragment} from './Side/SideFragment';
import {PrefUnauthorizedFragment} from './Pref/PrefUnauthorizedFragment';
import {DB} from '../Library/Infra/DB';

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

class AppFragment extends React.Component<Props, State> {
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
    const eachPaths = await UserPrefIPC.getEachPaths();
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

    MainWindowIPC.onToggleLayout(layout => this.handleToggleLayout(layout));
    MainWindowIPC.onShowAbout(() => this.setState({aboutShow: true}));
    MainWindowIPC.onPowerMonitorSuspend(() => this.handleStopPolling());
    MainWindowIPC.onPowerMonitorResume(() => this.handleStartPolling());
    MainWindowIPC.onShowJumpNavigation(() => this.handleShowJumpNavigation());
    MainWindowIPC.onShowRecentlyReads(() => this.handleShowJumpNavigation('sort:read'));

    StreamIPC.onSelectNextStream(() => this.handleNextPrevStream(1));
    StreamIPC.onSelectPrevStream(() => this.handleNextPrevStream(-1));

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
      alert('The database is corrupted. Initialize the database.');
      await DB.deleteDBFile();
      this.init();
      return;
    }

    await StreamSetup.exec();
    VersionPolling.startChecker();

    this.updateRecentlyIssues();
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

    const nodeIds = issues.map(issue => issue.node_id);
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, UserPrefRepo.getGHEVersion());
    const {error: e1, issues: v4Issues} = await client.getIssuesByNodeIds(nodeIds);
    if (e1) return console.error(e1);

    const {error: e2} = await IssueRepo.updateWithV4(v4Issues);
    if (e2) return console.error(e2);
  }

  private async handleSwitchPref(prefIndex: number) {
    this.setState({prefSwitchingStatus: 'loading', prefIndex});
    await StreamPolling.stop();
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
      alert('The database is corrupted. Initialize the database.');
      await DB.deleteDBFile();
      this.handleSwitchPref(prefIndex);
      return;
    }

    await StreamSetup.exec();
    StreamPolling.start();
    GitHubNotificationPolling.start();
    StreamEvent.emitReloadAllStreams();

    await TimerUtil.sleep(100);
    this.setState({prefSwitchingStatus: 'complete'}, () => this.selectFirstStream());
    UserPrefEvent.emitSwitchPref();
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
  }

  private handleStartPolling() {
    StreamPolling.start();
    VersionPolling.startChecker();
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
    return null;
  }

  renderError() {
    if (this.state.initStatus !== 'error') return null;

    if (this.state.isPrefNotFoundError) {
      return (
        <React.Fragment>
          <PrefSetupFragment show={true} showImportData={true} onClose={(github, browser) => this.handleClosePrefSetup(github, browser)}/>
          <KeyboardShortcutFragment/>
          <GlobalStyle/>
        </React.Fragment>
      );
    }

    if (this.state.isPrefNetworkError) {
      return (
        <React.Fragment>
          <PrefNetworkErrorFragment githubUrl={this.state.githubUrl} onRetry={() => this.init()}/>
          <KeyboardShortcutFragment/>
          <GlobalStyle/>
        </React.Fragment>
      );
    }

    if (this.state.isPrefScopeError) {
      return (
        <React.Fragment>
          <PrefScopeErrorFragment githubUrl={this.state.githubUrl} onRetry={() => this.init()}/>
          <GlobalStyle/>
        </React.Fragment>
      );
    }

    if (this.state.isUnauthorized) {
      return (
        <React.Fragment>
          <PrefUnauthorizedFragment githubUrl={this.state.githubUrl} onRetry={() => this.init()}/>
          <GlobalStyle/>
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

        <IntroFragment/>
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
        <PrefScopeErrorFragment githubUrl={this.state.githubUrl} onRetry={() => this.handleSwitchPref(this.state.prefIndex)}/>
      );
    }

    if (this.state.isUnauthorized) {
      return (
        <PrefUnauthorizedFragment githubUrl={this.state.githubUrl} onRetry={() => this.handleSwitchPref(this.state.prefIndex)}/>
      );
    }
  }
}

const Root = styled(View)`
  width: 100vw;
  height: 100vh;
  
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

const GlobalStyle = createGlobalStyle`
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

export function mountAppFragment() {
  ReactDOM.render(
    <AppFragment/>,
    document.querySelector('#app')
  );
}
