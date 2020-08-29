import React from 'react';
import {space} from '../Style/layout';
import styled from 'styled-components';

type Props = {
}

type State = {
}

export class DragBar extends React.Component<Props, State> {
  render() {
    return (
      <Root/>
    );
  }
}

const Root = styled.div`
  width: 100%;
  height: ${space.medium2}px;
  -webkit-app-region: drag;
  box-sizing: border-box;
`;
