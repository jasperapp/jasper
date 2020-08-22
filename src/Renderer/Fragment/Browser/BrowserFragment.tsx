import React from 'react';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {BrowserLoadFragment} from './BrowserLoadFragment';
import {BrowserSearchFragment} from './BrowserSearchFragment';
import {BrowserCodeExecFragment} from './BrowserCodeExecFragment';
import {BrowserFrameFragment} from './BrowserFrameFragment';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';

type Props = {
  className?: string;
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
    BrowserViewIPC.onStartSearch(() => this.handleSearchStart());
    this.setupConsoleLog();
  }

  private setupConsoleLog() {
    BrowserViewIPC.onEventConsoleMessage((level, message) => {
      const log = `[webview] ${message}`;
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
        />

        <BrowserSearchFragment
          show={this.state.toolbarMode === 'search'}
          onClose={() => this.setState({toolbarMode: 'load'})}
        />

        <BrowserFrameFragment/>

        <BrowserCodeExecFragment/>
      </Root>
    );
  }
}

const Root = styled(View)`
  flex: 1;
  height: 100%;
  background: ${() => appTheme().bg};
`;
