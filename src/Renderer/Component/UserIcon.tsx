import React, {CSSProperties} from 'react';
import {Image} from '../Library/View/Image';
import styled from 'styled-components';
import {View} from '../Library/View/View';
import {Icon} from '../Library/View/Icon';

type Props = {
  userName: string;
  iconUrl: string;
  size: number;
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
        title={this.props.userName}
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
