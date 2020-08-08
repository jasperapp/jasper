import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {border} from '../../Style/layout';
import {ClickView} from './ClickView';

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

const Root = styled(ClickView)`
  background: ${() => appTheme().buttonColor};
  width: fit-content;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: solid ${border.medium}px ${() => appTheme().buttonBorderColor};
  min-width: 80px;
  text-align: center;
`;
