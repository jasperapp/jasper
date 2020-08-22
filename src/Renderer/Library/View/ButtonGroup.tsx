import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {View} from './View';
import {border} from '../Style/layout';
import {appTheme} from '../Style/appTheme';

type Props = {
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class ButtonGroup extends React.Component<Props, State> {
  render() {
    return (
      <Root style={this.props.style} className={this.props.className}>
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled(View)`
  flex-direction: row;
  border: solid ${border.medium}px ${() => appTheme().borderColor};
  border-radius: 4px;
  border-bottom-color: ${() => appTheme().borderBold + 'dd'};
  
  & .button {
    min-width: fit-content;
    height: fit-content;
    border-radius: 0;
    border-style: none solid none none;
  }
  
  & .button:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  
  & .button:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-right: none;
  }
`;
