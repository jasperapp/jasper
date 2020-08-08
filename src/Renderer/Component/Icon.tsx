import React, {CSSProperties} from 'react';
import {IconNameType} from '../Type/IconNameType';
import styled from 'styled-components';
import {View} from './VIew';
import {iconFont} from '../Style/layout';
import {appTheme} from '../Style/appTheme';

interface Props {
  name: IconNameType;
  size?: number;
  color?: string;
  style?: CSSProperties;
  onClick?: (ev: any) => void;
  title?: string;
}

export class Icon extends React.Component<Props> {
  render() {
    const size = this.props.size || iconFont.medium;
    const style: CSSProperties = {
      fontSize: size,
      width: size,
      height: size,
      lineHeight: `${size}px`,
      color: this.props.color || appTheme().iconColor,
    };

    return <Root
      className={`mdi mdi-${this.props.name}`}
      style={{...style, ...this.props.style}}
      onClick={this.props.onClick}
      title={this.props.title}
    />;
  }
}

const Root = styled(View)`
`;
