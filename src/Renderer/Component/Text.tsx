import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {View} from './VIew';
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
    const style = {
      fontSize: font.medium,
      color: appTheme().textColor,
    }

    return (
      <Root
        style={{...style, ...this.props.style}}
        className={this.props.className}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled(View)`
`;
