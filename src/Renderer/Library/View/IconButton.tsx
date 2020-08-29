import React, {CSSProperties} from 'react';
import {IconNameType} from '../Type/IconNameType';
import {Button} from './Button';
import {Icon} from './Icon';
import styled from 'styled-components';
import {appTheme} from '../Style/appTheme';

type Props = {
  name: IconNameType;
  onClick?: (ev: React.MouseEvent) => void;
  title?: string;
  disable?: boolean;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class IconButton extends React.Component<Props, State> {
  render() {
    return (
      <Root
        onClick={this.props.onClick}
        title={this.props.title}
        disable={this.props.disable}
        className={this.props.className}
        style={this.props.style}
      >
        <Icon name={this.props.name}/>
      </Root>
    );
  }
}

const Root = styled(Button)`
  min-width: fit-content;
  height: fit-content;
  border: none;
  background: none;
  &:hover {
    background: ${() => appTheme().iconButton.hover};
  }
`;
