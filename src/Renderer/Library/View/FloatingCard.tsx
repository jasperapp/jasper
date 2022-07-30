import React from 'react';
import styled from 'styled-components';
import {ClickView} from './ClickView';
import {border, fontWeight, space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';
import {View} from './View';
import {Text} from './Text';
import {Icon} from './Icon';
import {color} from '../Style/color';

type Props = {
  isShow: boolean;
  title: JSX.Element;
  onClick: () => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingCard: React.FC<Props> = (props) => {
  return (
    <Root style={props.style} className={props.className} isShow={props.isShow} onClick={props.onClick}>
      <TitleRow>
        <Icon name='information' color={color.stream.blue}/>
        <Title>{props.title}</Title>
        <View style={{flex: 1}}/>
        <ClickView onClick={props.onClose} className='close-button'>
          <Icon name='close'/>
        </ClickView>
      </TitleRow>
      <Body>
        {props.children}
      </Body>
    </Root>
  );
}

const Root = styled(ClickView)<{isShow: boolean}>`
  display: ${(props) => props.isShow ? 'flex' : 'none'};
  position: fixed;
  bottom: 36px;
  left: 12px;
  width: 360px;
  border-radius: 6px;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  background-color: ${() => appTheme().bg.primary};
  padding: ${space.medium}px;
  box-shadow: ${() => appTheme().floatingCard.boxShadow};
  
  & .close-button {
    display: none;
  }
  
  &:hover .close-button {
    display: flex;
  }
`;

const TitleRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${space.medium}px;
`;

const Title = styled(Text)`
  margin-left: ${space.small}px;
  font-weight: ${fontWeight.bold};
`

const Body = styled(View)`
`;
