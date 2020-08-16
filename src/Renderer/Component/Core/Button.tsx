import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {border} from '../../Style/layout';
import {ClickView} from './ClickView';
import {color} from '../../Style/color';

type Props = {
  onClick: (ev: React.MouseEvent) => void;
  className?: string;
  style?: CSSProperties;
  type?: 'default' | 'primary';
  title?: string;
  disable?: boolean;
}

type State = {
}

export class Button extends React.Component<Props, State> {
  static defaultProps = {type: 'default'};

  private handleClick(ev: React.MouseEvent) {
    if (this.props.disable) return;
    this.props.onClick(ev);
  }

  render() {
    const disableClassName = this.props.disable ? 'button-disable' : '';

    return (
      <Root
        onClick={ev => this.handleClick(ev)}
        className={`${this.props.className} button button-type-${this.props.type} ${disableClassName}`}
        style={this.props.style}
        title={this.props.title}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled(ClickView)`
  width: fit-content;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
  
  border-style: solid;
  border-width: ${border.medium}px;
  border-color: ${() => appTheme().buttonBorder};
  background-image: ${() => appTheme().button};
  
  &.button-type-primary {
    border-color: #388df8;
    border-bottom-color: #0866dc;
    color: ${color.white};
    background-image: linear-gradient(to bottom, #6eb4f7 0%, #1a82fb 100%);
  }
  
  &.button-disable > *{
    opacity: 0.4;
  }
`;
