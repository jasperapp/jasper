import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {AppIPC} from '../../../IPC/AppIPC';

type Props = {
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class DraggableHeader extends React.Component<Props, State> {
  private handleMaximize() {
    AppIPC.toggleMaximizeWindow();
  }

  render() {
    return (
      <Root
        className={this.props.className}
        style={this.props.style}
        onDoubleClick={() => this.handleMaximize()}
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
  height: 63px;
  align-items: center;
  width: 100%;
  
  -webkit-app-region: drag;
  
  & > * {
    -webkit-app-region: none;
  }
`;
