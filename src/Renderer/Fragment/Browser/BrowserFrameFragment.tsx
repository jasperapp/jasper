import React from 'react';
import ReactDOM from 'react-dom';
import {View} from '../../Component/Core/View';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IssueEvent} from '../../Event/IssueEvent';
import {UserPrefEntity} from '../../Type/UserPrefEntity';
import {Text} from '../../Component/Core/Text';
import {IssueEntity} from '../../Type/IssueEntity';

type Props = {
}

type State = {
  issue: IssueEntity | null;
  browser: UserPrefEntity['general']['browser'];
}

export class BrowserFrameFragment extends React.Component<Props, State> {
  state: State = {
    issue: null,
    browser: UserPrefRepo.getPref().general.browser,
  }

  componentDidMount() {
    this.setupBrowserResize();
    IssueEvent.onSelectIssue(this, (issue) => {
      this.setState({issue});
      this.handleBrowserVisible();
    });
  }

  componentWillUnmount() {
    IssueEvent.offAll(this);
  }

  private setupBrowserResize() {
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    // @ts-ignore
    const resizeObserver = new ResizeObserver(_entries => {
      const rect = el.getBoundingClientRect();
      BrowserViewIPC.setRect(rect.x, rect.y, rect.width, rect.height);
    });
    resizeObserver.observe(el);
  }

  private handleBrowserVisible() {
    if (UserPrefRepo.getPref().general.browser === 'builtin') {
      BrowserViewIPC.hide(false);
    } else {
      BrowserViewIPC.hide(true);
    }
    this.setState({browser: UserPrefRepo.getPref().general.browser});
  }

  render() {
    if (this.state.browser === 'builtin') {
      BrowserViewIPC.hide(false);
      return <Root/>;
    } else {
      BrowserViewIPC.hide(true);
      return (
        <Root>
          <Text>Use external browser.</Text>
          <Text>You can also change the setting of the browser at preferences.</Text>
        </Root>
      );
    }
  }
}

const Root = styled(View)`
  flex: 1;
  width: 100%;
  align-items: center;
  padding-top: 100px;
`;
