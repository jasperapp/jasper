import React from 'react';
import styled from 'styled-components';
import {View} from './View';
import {DragBar} from './DragBar';

type Props = {
}

type State = {
}

export class TrafficLightsSafe extends React.Component<Props, State> {
  render() {
    return (
      <Root>
        <DragBar/>
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled(View)`
  min-height: 20px;
  margin-left: 70px;
`;
