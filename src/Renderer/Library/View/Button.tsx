import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {appTheme} from '../Style/appTheme';
import {border, font} from '../Style/layout';
import {ClickView} from './ClickView';
import {color} from '../Style/color';

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
  border-radius: 6px;
  cursor: pointer;
  min-width: 80px;
  text-align: center;
  font-size: ${font.medium}px;
  
  border-style: solid;
  border-width: ${border.medium}px;
  border-color: ${() => appTheme().button.normal.border};
  background: ${() => appTheme().button.normal.bg};
  
  &.button-type-primary {
    color: ${color.white};
    background: ${() => appTheme().button.primary.bg};
    border-color: ${() => appTheme().button.primary.border};
  }
  
  &.button-disable > *{
    opacity: 0.4;
  }
`;
