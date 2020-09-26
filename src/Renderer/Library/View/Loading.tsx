import React from 'react';
import styled, {keyframes} from 'styled-components';
import {View} from './View';
import {space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';

type Props = {
  show: boolean;
  size?: number;
}

type State = {
}

export class Loading extends React.Component<Props, State> {
  static defaultProps = {size: 16}

  render() {
    const dotViews = [];
    for (let i = 0; i < 8; i++) {
      dotViews.push(
        <FountainDot
          key={i}
          className={`Dot${i + 1}`}
          style={{width: this.props.size, height: this.props.size}}
        />
      );
    }

    const display = this.props.show ? 'flex' : 'none';

    return (
      <Root style={{display}}>
        <FountainRoot>
          {dotViews}
        </FountainRoot>
      </Root>
    );
  }
}

const Root = styled(View)`
  align-items: center;
  padding: ${space.medium}px;
`;

// ref: https://icons8.com/cssload/en/horizontal-bars
const FountainRoot = styled.div`
  display: flex;
  margin: auto;
`;

const bounce = keyframes`
  0%{
    transform:scale(1);
    opacity: 1;
  }

  100%{
    transform:scale(.3);
    opacity: 0;
  }
`;

const FountainDot = styled.div`
  background-color: ${() => appTheme().accent.normal};
  width: 28px;
  height: 28px;
  animation-name: ${bounce};
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
  animation-direction: normal;
  transform: scale(.3);
  border-radius: 100px;
  margin: 0 2px;
  
  &.Dot1 {
    animation-delay: 0s;
  }
  
  &.Dot2 {
    animation-delay:0.15s;
  }
  
  &.Dot3 {
    animation-delay:0.3s;
  }
  
  &.Dot4 {
    animation-delay:0.45s;
  }
  
  &.Dot5 {
    animation-delay:0.6s;
  }
  
  &.Dot6 {
    animation-delay:0.75s; 
  }
  
  &.Dot7 {
    animation-delay:0.9s;  
  }
  
  &.Dot8 {
    animation-delay:1.04s; 
  }
`;
