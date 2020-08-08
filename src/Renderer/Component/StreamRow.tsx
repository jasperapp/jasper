import React, {CSSProperties} from 'react';
import {BaseStreamEntity} from '../Type/StreamEntity';
import styled from 'styled-components';
import {Icon} from './Core/Icon';
import {Text} from './Core/Text';
import {font, fontWeight, space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';
import {ClickView} from './Core/ClickView';
import {ContextMenu, MenuType} from './Core/ContextMenu';

type Props = {
  stream: BaseStreamEntity;
  onClick: (stream: BaseStreamEntity) => void;
  contextMenuRows: MenuType[];
  title?: string;
  selected: boolean;
  className?: string;
  style?: CSSProperties;
}

type State = {
  menuShow: boolean;
}

export class StreamRow extends React.Component<Props, State> {
  state: State = {
    menuShow: false,
  };

  render() {
    const selectedClassName = this.props.selected ? 'selected' : '';
    const className = this.props.stream.unreadCount ? 'has-unread' : 'no-unread';
    const name = this.props.stream.name;
    const title = this.props.title || `${name} issues`;

    return (
      <Root
        title={title}
        className={`${this.props.className} ${selectedClassName}`}
        style={this.props.style}
        onClick={() => this.props.onClick(this.props.stream)}
        onContextMenu={() => this.setState({menuShow: true})}
      >
        <Icon name={this.props.stream.iconName}/>
        <StreamName className={className}>{name}</StreamName>
        <StreamUnreadCount className={className}>{this.props.stream.unreadCount}</StreamUnreadCount>

        <ContextMenu
          show={this.state.menuShow}
          onClose={() => this.setState({menuShow: false})}
          menus={this.props.contextMenuRows}
        />
      </Root>
    );
  }
}

const Root = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  padding-left: ${space.extraLarge}px;
  padding-right: ${space.medium}px;
  padding-top: ${space.tiny}px;
  padding-bottom: ${space.tiny}px;
  
  &.selected {
    background: ${() => appTheme().bgSideSelect};
  }
  
  &:hover {
    background: ${() => appTheme().bgSideSelect};
  }
`;

const StreamName = styled(Text)`
  flex: 1;
  padding-left: ${space.small}px;
  
  &.has-unread {
    font-weight: ${fontWeight.bold};
  }
  
  &.no-unread {
    color: ${() => appTheme().textSoftColor};
  }
`;

const StreamUnreadCount = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().textSoftColor};
  
  &.no-unread {
    font-weight: ${fontWeight.thin};
  }
`;
