import React, {CSSProperties} from 'react';
import {BaseStreamEntity} from '../Type/StreamEntity';
import styled from 'styled-components';
import {Icon} from './Core/Icon';
import {Text} from './Core/Text';
import {font, fontWeight, space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';
import {ClickView} from './Core/ClickView';
import {ContextMenu, ContextMenuType} from './Core/ContextMenu';

type Props = {
  stream: BaseStreamEntity;
  onClick: (stream: BaseStreamEntity) => void;
  contextMenuRows: ContextMenuType[];
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
    const stream = this.props.stream;
    const selectedClassName = this.props.selected ? 'stream-selected' : '';
    const unreadClassName = stream.unreadCount ? 'stream-has-unread' : 'stream-no-unread';
    const enabledClassName = stream.enabled ? 'stream-enabled' : 'stream-disabled';
    const name = stream.name;
    const title = this.props.title || `${name} issues`;
    const unreadCount = stream.enabled ? stream.unreadCount : '';
    const iconColor = stream.color || appTheme().iconColor;

    return (
      <Root
        title={title}
        className={`${this.props.className} ${selectedClassName} ${unreadClassName} ${enabledClassName}`}
        style={this.props.style}
        onClick={() => this.props.onClick(this.props.stream)}
        onContextMenu={() => this.setState({menuShow: true})}
      >
        <StreamIcon name={this.props.stream.iconName} color={iconColor}/>
        <StreamName>{name}</StreamName>
        <StreamUnreadCount>{unreadCount}</StreamUnreadCount>

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
  
  &.stream-selected {
    background: ${() => appTheme().bgSideSelect};
  }
  
  &:hover {
    background: ${() => appTheme().bgSideSelect};
  }
`;

const StreamIcon = styled(Icon)`
  .stream-disabled & {
    opacity: 0.5;
  }
`;

const StreamName = styled(Text)`
  flex: 1;
  padding-left: ${space.small}px;
  
  /* 文字がはみ出ないようにする */
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-all;
  
  .stream-has-unread & {
    font-weight: ${fontWeight.bold};
  }
  
  .stream-no-unread & {
    color: ${() => appTheme().textSoftColor};
  }
  
  .stream-disabled & {
    opacity: 0.5;
    font-weight: ${fontWeight.medium};
  }
`;

const StreamUnreadCount = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().textSoftColor};
  
  .stream-no-unread & {
    font-weight: ${fontWeight.thin};
  }
`;
