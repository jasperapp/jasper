import React, {CSSProperties} from 'react';
import styled from 'styled-components';

type Props = {
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  title?: string;
  onContextMenu?: () => void;
}

type State = {
}

export class ClickView extends React.Component<Props, State> {
  render() {
    return (
      <Root
        title={this.props.title}
        onClick={this.props.onClick}
        className={this.props.className}
        style={this.props.style}
        onContextMenu={this.props.onContextMenu}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  cursor: pointer;
  
  & * {
    cursor: pointer;
  }
`;
