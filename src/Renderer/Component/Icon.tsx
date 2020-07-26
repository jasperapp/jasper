import React, {CSSProperties} from 'react';
import {IconNameType} from '../../Type/IconNameType';

interface Props {
  name: IconNameType;
  size?: number;
  color?: string;
  style?: CSSProperties;
  onClick?: (ev: any) => void;
  title?: string;
}

export class Icon extends React.Component<Props> {
  static defaultProps = {size: 24, color: '#888'};

  render() {
    return <span
      className={`mdi mdi-${this.props.name}`}
      style={{fontSize: `${this.props.size}px`, color: this.props.color, ...this.props.style}}
      onClick={this.props.onClick}
      title={this.props.title}
    />;
  }
}
