import React from 'react';
import ReactDOM from 'react-dom';
import {StreamEvent} from '../Event/StreamEvent';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {AccountsFragment} from './Account/AccountsFragment';
import {LibraryStreamsFragment} from './Stream/LibraryStream/LibraryStreamsFragment';
import {SystemStreamsFragment} from './Stream/SystemStream/SystemStreamsFragment';
import {StreamsFragment} from './Stream/UserStream/StreamsFragment';
import {IssuesFragment} from './Issues/IssuesFragment';
import {BrowserFragment} from './Browser/BrowserFragment';
import {ConfigRepo} from '../Repository/ConfigRepo';
import {GARepo} from '../Repository/GARepo';
import {StreamPolling} from '../Infra/StreamPolling';
import {StreamSetup} from '../Infra/StreamSetup';
import {DBSetup} from '../Infra/DBSetup';
import {VersionRepo} from '../Repository/VersionRepo';
import {PrefEditorFragment} from './Other/PrefEditorFragment';
import {AccountEditorFragment} from './Account/AccountEditorFragment';
import {ConfigType} from '../Type/ConfigType';
import {AppIPC} from '../../IPC/AppIPC';
import {AboutFragment} from './Other/AboutFragment';
import {LibraryStreamEvent} from '../Event/LibraryStreamEvent';
import {TimerUtil} from '../Util/TimerUtil';
import styled, {createGlobalStyle} from 'styled-components';
import {View} from '../Component/Core/View';
import {appTheme} from '../Style/appTheme';
import {border, font} from '../Style/layout';
import {NotificationFragment} from './Other/NotificationFragment';
import {KeyboardShortcutFragment} from './Other/KeyboardShortcutFragment';
import {FooterFragment} from './Other/FooterFragment';

type State = {
  initStatus: 'loading' | 'firstConfigSetup' | 'complete';
  prefShow: boolean;
  aboutShow: boolean;
  configSwitching: boolean;
  layout: 'one' | 'two' | 'three';
}

class AppFragment extends React.Component<any, State> {
  state: State = {
    initStatus: 'loading',
    prefShow: false,
    aboutShow: false,
    configSwitching: false,
    layout: 'three',
  }

  async componentDidMount() {
    await this.init();

    AppIPC.onToggleLayout(layout => this.handleToggleLayout(layout));
    AppIPC.onShowAbout(() => this.setState({aboutShow: true}));
    AppIPC.onShowPref(() => this.setState({prefShow: true}));
    AppIPC.onPowerMonitorSuspend(() => this.handleStopPolling());
    AppIPC.onPowerMonitorResume(() => this.handleStartPolling());

    window.addEventListener('online',  () => navigator.onLine === true && this.handleStartPolling());
    window.addEventListener('offline',  () => this.handleStopPolling());
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
    VersionRepo.stopChecker();
  }

  private handleStartPolling() {
    StreamPolling.start();
    VersionRepo.startChecker();
  }

  private async handleCloseAccountSetup(github: ConfigType['github'], browser: ConfigType['general']['browser']) {
    if (github) {
      const res = await ConfigRepo.addConfigGitHub(github, browser);
      if (!res) return;
      await this.init();
    }
  }

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
      <React.Fragment>
        <AccountEditorFragment show={true} onClose={(github, browser) => this.handleCloseAccountSetup(github, browser)}/>
        <KeyboardShortcutFragment/>
        <GlobalStyle/>
      </React.Fragment>
    );
  }

  renderComplete() {
    const layoutClassName = `app-layout-${this.state.layout}`;
    return (
      <Root className={layoutClassName} style={{opacity: this.state.configSwitching ? 0.3 : 1}}>
        <Main>
          <StreamsColumn className='app-streams-column'>
            <AccountsFragment onSwitchConfig={this.handleSwitchConfig.bind(this)}/>
            <LibraryStreamsFragment/>
            <SystemStreamsFragment/>
            <StreamsFragment/>
            <View style={{flex: 1}}/>
            <FooterFragment onOpenPref={() => this.setState({prefShow: true})}/>
          </StreamsColumn>
          <IssuesFragment className='app-issues-column'/>
          <BrowserFragment className='app-browser-column'/>
        </Main>

        <PrefEditorFragment show={this.state.prefShow} onClose={() => this.setState({prefShow: false})}/>
        <AboutFragment show={this.state.aboutShow} onClose={() => this.setState({aboutShow: false})}/>
        <NotificationFragment/>
        <KeyboardShortcutFragment/>
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

ReactDOM.render(
  <AppFragment/>,
  document.querySelector('#app')
);
