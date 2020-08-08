import React, {CSSProperties} from 'react';
import styled from 'styled-components';

type Props = {
  className?: string;
  style?: CSSProperties;
  title?: string;
  onClick?: (ev?: any) => void;
}

type State = {
}

export class View extends React.Component<Props, State> {
  render() {
    return (
      <Root
        className={this.props.className}
        style={this.props.style}
        onClick={this.props.onClick}
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
`;
