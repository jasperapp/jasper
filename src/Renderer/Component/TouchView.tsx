import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {View} from './VIew';

type Props = {
  onTouch?: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class TouchView extends React.Component<Props, State> {
  render() {
    return (
      <Root onClick={this.props.onTouch} className={this.props.className} style={this.props.style}>
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled(View)`
  cursor: pointer;
  
  & * {
    cursor: pointer;
  }
`;
