import React, {CSSProperties} from 'react';
import styled from 'styled-components';

type Props = {
  onClick(): void;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class Button extends React.Component<Props, State> {
  render() {
    return (
      <Root
        onClick={this.props.onClick}
        className={this.props.className}
        style={this.props.style}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled.div`
  background: #eee;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: solid 1px #ddd;
  min-width: 80px;
  text-align: center;
`;
