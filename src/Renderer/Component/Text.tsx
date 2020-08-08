import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {font} from '../Style/layout';
import {appTheme} from '../Style/appTheme';

type Props = {
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class Text extends React.Component<Props, State> {
  render() {
    return (
      <Root
        style={this.props.style}
        className={this.props.className}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled.span`
  box-sizing: border-box;
  font-size: ${font.medium}px;
  color: ${() => appTheme().textColor};
`;
