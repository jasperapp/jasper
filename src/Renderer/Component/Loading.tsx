import React from 'react';
import styled from 'styled-components';
import {View} from './Core/View';
import {Image} from './Core/Image';
import {space} from '../Style/layout';

type Props = {
  show: boolean;
}

type State = {
}

export class Loading extends React.Component<Props, State> {
  render() {
    if (!this.props.show) return <Root/>;

    return (
      <Root>
        <Image source={{url: '../image/spin.gif'}}/>
      </Root>
    );
  }
}

const Root = styled(View)`
  align-items: center;
  padding: ${space.medium}px;
  min-height: 50px;
  width: 100%;
`;
