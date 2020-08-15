import React from 'react';
import ReactDOM from 'react-dom';
import {View} from '../../Component/Core/View';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';

type Props = {
}

type State = {
}

export class BrowserFrameFragment extends React.Component<Props, State> {
  componentDidMount() {
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    // @ts-ignore
    const resizeObserver = new ResizeObserver(_entries => {
      const rect = el.getBoundingClientRect();
      BrowserViewIPC.setRect(rect.x, rect.y, rect.width, rect.height);
    });
    resizeObserver.observe(el);
  }

  render() {
    return (
      <Root>
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled(View)`
  flex: 1;
  width: 100%;
`;
