import React, {CSSProperties} from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import {AppIPC} from '../../../IPC/AppIPC';

type Props = {
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class DraggableHeader extends React.Component<Props, State> {
  private handleMaximize(ev: React.MouseEvent) {
    if (ev.target === ReactDOM.findDOMNode(this)) {
      AppIPC.toggleMaximizeWindow();
    }
  }

  render() {
    return (
      <Root
        className={this.props.className}
        style={this.props.style}
        onDoubleClick={(ev) => this.handleMaximize(ev)}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled.div`
  display: flex;
  flex-direction: row;
  box-sizing: border-box;
  min-height: 63px;
  align-items: center;
  width: 100%;
  
  -webkit-app-region: drag;
  
  & > * {
    -webkit-app-region: none;
  }
`;
