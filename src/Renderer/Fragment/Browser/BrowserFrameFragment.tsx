import React from 'react';
import ReactDOM from 'react-dom';
import {View} from '../../Library/View/View';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';

type Props = {
}

type State = {
}

export class BrowserFrameFragment extends React.Component<Props, State> {
  componentDidMount() {
    this.setupBrowserResize();
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

  render() {
    return <Root/>;
  }
}

const Root = styled(View)`
  flex: 1;
  width: 100%;
  align-items: center;
  padding-top: 100px;
`;
