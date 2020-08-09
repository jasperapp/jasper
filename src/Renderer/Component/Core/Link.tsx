import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {shell} from 'electron';
import {ClickView} from './ClickView';
import {Text} from './Text';

type Props = {
  url?: string | (() => string);
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

type State = {
}

export class Link extends React.Component<Props, State> {
  private handleClick() {
    if (this.props.onClick) {
      this.props.onClick();
    } else if (this.props.url) {
      if (typeof this.props.url === 'function') {
        shell.openExternal(this.props.url());
      } else {
        shell.openExternal(this.props.url);
      }
    }
  }

  render() {
    return (
      <ClickView onClick={() => this.handleClick()}>
        <LinkText className={this.props.className} style={this.props.style}>{this.props.children}</LinkText>
      </ClickView>
    );
  }
}
const LinkText = styled(Text)`
  color: blue;
  text-decoration: underline;
`;
