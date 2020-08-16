import React, {CSSProperties} from 'react';
import {IconNameType} from '../../Type/IconNameType';
import styled from 'styled-components';
import {View} from './View';
import {iconFont} from '../../Style/layout';
import {appTheme} from '../../Style/appTheme';

interface Props {
  name: IconNameType;
  size?: number;
  color?: string;
  style?: CSSProperties;
  title?: string;
  className?: string;
}

export class Icon extends React.Component<Props> {
  render() {
    // const size = this.props.size || iconFont.medium;
    // const style: CSSProperties = {
    //   fontSize: size,
    //   width: size,
    //   height: size,
    //   lineHeight: `${size}px`,
    //   color: this.props.color || appTheme().iconColor,
    // };

    const style: CSSProperties = {};

    if (this.props.size) {
      const size = this.props.size;
      style.fontSize = size;
      style.width = size;
      style.height = size;
      style.lineHeight = `${size}px`;
    }

    if (this.props.color) {
      style.color = this.props.color;
    }

    return <Root
      className={`mdi mdi-${this.props.name} ${this.props.className}`}
      style={{...style, ...this.props.style}}
      title={this.props.title}
    />;
  }
}

const Root = styled(View)`
  font-size: ${iconFont.medium}px;
  width: ${iconFont.medium}px;
  height: ${iconFont.medium}px;
  line-height: ${iconFont.medium}px;
  color: ${() => appTheme().iconColor};
`;
