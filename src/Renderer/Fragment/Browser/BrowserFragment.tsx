import React from 'react';
import styled from 'styled-components';
import {BrowserViewIPCChannels} from '../../../IPC/BrowserViewIPC/BrowserViewIPC.channel';
import {appTheme} from '../../Library/Style/appTheme';
import {View} from '../../Library/View/View';
import {BrowserCodeExecFragment} from './BrowserCodeExecFragment';
import {BrowserFrameFragment} from './BrowserFrameFragment';
import {BrowserLoadFragment} from './BrowserLoadFragment';
import {BrowserSearchFragment} from './BrowserSearchFragment';

type Props = {
  className?: string;
  firstLoading?: boolean;
  isHideHelp?: boolean;
}

type State = {
  toolbarMode: 'load' | 'search',
}

export class BrowserFragment extends React.Component<Props, State> {
  static defaultProps = {className: ''};

  state: State = {
    toolbarMode: 'load',
  };

  componentDidMount() {
    window.ipc.on(BrowserViewIPCChannels.startSearch, () => this.handleSearchStart());
    this.setupConsoleLog();
  }

  private setupConsoleLog() {
    window.ipc.on(BrowserViewIPCChannels.eventConsoleMessage, (_ev, level, message) => {
      const log = `[BrowserView] ${message}`;
      switch (level) {
        case -1: console.debug(log); break;
        case 0: console.log(log); break;
        case 1: console.warn(log); break;
        case 2: console.error(log); break;
      }
    });
  }

  private handleSearchStart() {
    this.setState({toolbarMode: 'search'});
  }

  render() {
    return (
      <Root className={this.props.className}>
        <BrowserLoadFragment
          show={this.state.toolbarMode === 'load'}
          onSearchStart={() => this.handleSearchStart()}
          firstLoading={this.props.firstLoading}
        />

        <BrowserSearchFragment
          show={this.state.toolbarMode === 'search'}
          onClose={() => this.setState({toolbarMode: 'load'})}
        />

        <BrowserFrameFragment isHideHelp={this.props.isHideHelp}/>

        <BrowserCodeExecFragment/>
      </Root>
    );
  }
}

const Root = styled(View)`
  flex: 1;
  height: 100%;
  background: ${() => appTheme().bg.primary};
`;
