import React, {CSSProperties} from 'react';
import styled from 'styled-components';

type Props = {
  className?: string;
  style?: CSSProperties;
  title?: string;
}

type State = {
}

export class View extends React.Component<Props, State> {
  render() {
    return (
      <Root
        className={this.props.className}
        style={this.props.style}
        title={this.props.title}
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
