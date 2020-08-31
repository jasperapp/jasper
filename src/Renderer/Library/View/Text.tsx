import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {font} from '../Style/layout';
import {appTheme} from '../Style/appTheme';

type Props = {
  title?: string;
  className?: string;
  style?: CSSProperties;
  singleLine?: boolean;
}

type State = {
}

export class Text extends React.Component<Props, State> {
  render() {
    const singleLineClassName = this.props.singleLine ? 'text-single-line' : '';

    return (
      <Root
        style={this.props.style}
        className={`${singleLineClassName} ${this.props.className}`}
        title={this.props.title}
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
  
  &.text-single-line {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    word-break: break-all;
    overflow: hidden;
  }
`;
