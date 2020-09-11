import React, {CSSProperties} from 'react';
import {Image} from './Image';
import styled from 'styled-components';
import {View} from './View';
import {Icon} from './Icon';

type Props = {
  userName: string;
  iconUrl: string;
  size: number;
  title?: string;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class UserIcon extends React.Component<Props, State> {
  render() {
    let iconView;
    if (this.props.iconUrl) {
      iconView = <Image source={{url: this.props.iconUrl}}/>;
    } else {
      iconView = <Icon name='account' size={this.props.size}/>
    }

    return (
      <Root
        style={{width: this.props.size, height: this.props.size, ...this.props.style}}
        title={this.props.title}
        className={this.props.className}
      >
        {iconView}
      </Root>
    );
  }
}

const Root = styled(View)`
  border-radius: 100%;
`;
