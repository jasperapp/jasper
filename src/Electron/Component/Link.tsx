import React from 'react';
import styled from 'styled-components';
import {shell} from 'electron';

type Props = {
  url?: string;
  onClick?: () => void;
}

type State = {
}

export class Link extends React.Component<Props, State> {
  private handleClick() {
    if (this.props.onClick) this.props.onClick();
    if (this.props.url) shell.openExternal(this.props.url);
  }

  render() {
    return <Root onClick={() => this.handleClick()}>{this.props.children}</Root>;
  }
}
const Root = styled.span`
  color: blue;
  text-decoration: underline;
  cursor: pointer;
`;
