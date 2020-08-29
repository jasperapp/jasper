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
import {AppIPC} from '../../IPC/AppIPC';
import {AboutFragment} from './Other/AboutFragment';
import {TimerUtil} from '../Library/Util/TimerUtil';
import styled, {createGlobalStyle} from 'styled-components';
import {View} from '../Library/View/View';
import {appTheme} from '../Library/Style/appTheme';
import {border, font} from '../Library/Style/layout';
import {NotificationFragment} from './Other/NotificationFragment';
import {KeyboardShortcutFragment} from './Other/KeyboardShortcutFragment';
import {FooterFragment} from './Other/FooterFragment';
import {UserPrefIPC} from '../../IPC/UserPrefIPC';
import {BadgeFragment} from './Other/BadgeFragment';
import {TrafficLightsSafe} from '../Library/View/TrafficLightsSafe';

type State = {
  initStatus: 'loading' | 'firstPrefSetup' | 'complete';
  aboutShow: boolean;
  prefSwitching: boolean;
  layout: 'one' | 'two' | 'three';
}

class AppFragment extends React.Component<any, State> {
  state: State = {
    initStatus: 'loading',
    aboutShow: false,
    prefSwitching: false,
    layout: 'three',
  }

  async componentDidMount() {
    const eachPaths = await UserPrefIPC.getEachPaths();
    console.table(eachPaths);

    await this.init();

    AppIPC.onToggleLayout(layout => this.handleToggleLayout(layout));
    AppIPC.onShowAbout(() => this.setState({aboutShow: true}));
    AppIPC.onPowerMonitorSuspend(() => this.handleStopPolling());
    AppIPC.onPowerMonitorResume(() => this.handleStartPolling());

    window.addEventListener('online',  () => navigator.onLine === true && this.handleStartPolling());
    window.addEventListener('offline',  () => this.handleStopPolling());
  }

  private async init() {
    const {error} = await UserPrefRepo.init();
    if (error) {
      this.setState({initStatus: 'firstPrefSetup'});
      return console.error(error);
    }

    const dbPath = await UserPrefRepo.getDBPath();
    await DBSetup.exec(dbPath);
    await StreamSetup.exec();
    await VersionPolling.startChecker();

    this.initGA();
    GARepo.eventAppStart();
    StreamPolling.start();

    this.setState({initStatus: 'complete'});
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

  private handleToggleLayout(layout: State['layout']) {
    if (this.state.layout === layout) {
      this.setState({layout: 'three'});
    } else {
      this.setState({layout});
    }
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

  private async handleSwitchPref(prefIndex: number) {
    this.setState({prefSwitching: true});
    await StreamPolling.stop();

    const {error} = await UserPrefRepo.switchPref(prefIndex);
    if (error) return console.error(error);

    const dbPath = await UserPrefRepo.getDBPath();
    await DBSetup.exec(dbPath);
    await StreamSetup.exec();
    StreamPolling.start();

    StreamEvent.emitSelectLibraryFirstStream();
    StreamEvent.emitReloadAllStreams();

    await TimerUtil.sleep(100);
    this.setState({prefSwitching: false});
  }

  render() {
    switch (this.state.initStatus) {
      case 'loading': return this.renderLoading();
      case 'firstPrefSetup': return this.renderFirstPrefSetup();
      case 'complete': return this.renderComplete();
    }
  }

  renderLoading() {
    return null;
  }

  renderFirstPrefSetup() {
    return (
      <React.Fragment>
        <PrefSetupFragment show={true} onClose={(github, browser) => this.handleClosePrefSetup(github, browser)}/>
        <KeyboardShortcutFragment/>
        <GlobalStyle/>
      </React.Fragment>
    );
  }

  renderComplete() {
    const layoutClassName = `app-layout-${this.state.layout}`;
    return (
      <Root className={layoutClassName} style={{opacity: this.state.prefSwitching ? 0.3 : 1}}>
        <Main>
          <StreamsColumn className='app-streams-column'>
            <TrafficLightsSafe/>
            <PrefCoverFragment onSwitchPref={this.handleSwitchPref.bind(this)}/>
            <LibraryStreamsFragment/>
            <SystemStreamsFragment/>
            <UserStreamsFragment/>
            <View style={{flex: 1}}/>
            <FooterFragment/>
          </StreamsColumn>
          <IssuesFragment className='app-issues-column'/>
          <BrowserFragment className='app-browser-column'/>
        </Main>

        <AboutFragment show={this.state.aboutShow} onClose={() => this.setState({aboutShow: false})}/>
        <NotificationFragment/>
        <KeyboardShortcutFragment/>
        <BadgeFragment/>
        <GlobalStyle/>
      </Root>
    );
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

const GlobalStyle = createGlobalStyle`
  * {
    outline: none;
    user-select: none;
  }
  
  body {
    margin: 0;
    font-family: system, -apple-system, ".SFNSDisplay-Regular", "Helvetica Neue", Helvetica, "Segoe UI", sans-serif;
    font-size: ${font.medium}px;
    color: ${() => appTheme().textColor};
    line-height: 1.6;
  } 
`;

export function mountAppFragment() {
  ReactDOM.render(
    <AppFragment/>,
    document.querySelector('#app')
  );
}
