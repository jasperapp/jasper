import React, {CSSProperties} from 'react';
import {StreamEntity} from '../Type/StreamEntity';
import styled from 'styled-components';
import {Icon} from './Icon';
import {Text} from './Text';
import {font, fontWeight, space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';
import {ClickView} from './ClickView';
import {ContextMenu, ContextMenuType} from './ContextMenu';
import {color} from '../Style/color';
import ReactDOM from 'react-dom';

type Props = {
  stream: StreamEntity;
  selected: boolean;
  title?: string;
  className?: string;
  disableMenu?: boolean;
  skipHandlerSameCheck: boolean;
  onSelect: (stream: StreamEntity) => void;
  onReadAll?: (stream: StreamEntity) => void;
  onEdit?: (stream: StreamEntity) => void;
  onSubscribe?: (stream: StreamEntity) => void;
  onDelete?: (stream: StreamEntity) => void;
  onCreateStream?: (stream: StreamEntity) => void;
  onCreateFilterStream?: (stream: StreamEntity) => void;
  onCreateProjectStream?: (stream: StreamEntity) => void;
}

type State = {
  showMenu: boolean;
}

export class StreamRow extends React.Component<Props, State> {
  state: State = {
    showMenu: false,
  };

  private menus: ContextMenuType[] = [];
  private contextMenuPos: {top: number; left: number};

  shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, _nextContext: any): boolean {
    if (this.state.showMenu !== nextState.showMenu) return true;

    if (this.props.stream !== nextProps.stream) return true;
    if (this.props.selected !== nextProps.selected) return true;
    if (this.props.title !== nextProps.title) return true;
    if (this.props.className !== nextProps.className) return true;
    if (this.props.disableMenu !== nextProps.disableMenu) return true;

    // handlerは基本的に毎回新しく渡ってくるので、それをチェックしてしまうと、毎回renderすることになる
    // なので、明示的にsame check指示されたときのみチェックする
    if (!nextProps.skipHandlerSameCheck) {
      if (this.props.onSelect !== nextProps.onSelect) return true;
      if (this.props.onReadAll !== nextProps.onReadAll) return true;
      if (this.props.onEdit !== nextProps.onEdit) return true;
      if (this.props.onSubscribe !== nextProps.onSubscribe) return true;
      if (this.props.onDelete !== nextProps.onDelete) return true;
      if (this.props.onCreateStream !== nextProps.onCreateStream) return true;
      if (this.props.onCreateFilterStream !== nextProps.onCreateFilterStream) return true;
      if (this.props.onCreateProjectStream !== nextProps.onCreateProjectStream) return true;
    }

    return false;
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 選択されたときには強制的に表示領域に入るようにする
    if (!prevProps.selected && this.props.selected) {
      const el = ReactDOM.findDOMNode(this) as HTMLDivElement;
      // @ts-ignore
      el.scrollIntoViewIfNeeded(false);
    }
  }

  private handleContextMenu(ev: React.MouseEvent) {
    const menus: ContextMenuType[] = [];

    if (this.props.onReadAll) {
      menus.push({label: 'Mark All as Read', icon: 'check-all', handler: () => this.props.onReadAll(this.props.stream)});
    }

    if (this.props.onEdit) {
      menus.push({label: 'Edit', icon: 'pencil-outline', handler: () => this.props.onEdit(this.props.stream)});
    }

    if (this.props.onSubscribe) {
      menus.push({type: 'separator'});
      menus.push({label: 'Subscribe', icon: 'volume-high', handler: () => this.props.onSubscribe(this.props.stream)});
    }

    if (this.props.onDelete) {
      menus.push({type: 'separator'});
      menus.push({label: 'Delete', icon: 'delete-outline', handler: () => this.props.onDelete(this.props.stream)});
    }

    if (this.props.onCreateFilterStream) {
      menus.push({type: 'separator'});
      menus.push({label: 'Add Filter Stream', icon: 'file-tree', handler: () => this.props.onCreateFilterStream(this.props.stream)});
    }

    if (this.props.onCreateStream) {
      menus.push({type: 'separator'});
      menus.push({label: 'Create Stream', icon: 'github', handler: () => this.props.onCreateStream(this.props.stream)});
      menus.push({label: 'Create Project Stream', icon: 'rocket-launch-outline', handler: () => this.props.onCreateProjectStream(this.props.stream)});
    }

    if (menus.length) {
      this.menus = menus;
      this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
      this.setState({showMenu: true});
    }
  }

  render() {
    if (!this.props.stream.enabled) return null;

    const stream = this.props.stream;
    const selectedClassName = this.props.selected ? 'stream-selected' : '';
    const unreadClassName = stream.unreadCount ? 'stream-has-unread' : 'stream-no-unread';
    const enabledClassName = stream.enabled ? 'stream-enabled' : 'stream-disabled';
    const name = stream.name;
    const title = this.props.title || `${name} issues`;
    const unreadCount = stream.enabled ? stream.unreadCount : '';
    const iconColor = this.props.selected ? color.white : (stream.color || appTheme().icon.normal);

    // コンテキストメニューを表示しない場合はhoverによる動きを無効にする
    const menuIconStyle: CSSProperties = {};
    const unreadCountStyle: CSSProperties = {};
    if (this.props.disableMenu) {
      menuIconStyle.display = 'none';
      unreadCountStyle.display = 'initial';
    }

    return (
      <Root
        title={title}
        className={`${this.props.className} stream-row ${selectedClassName} ${unreadClassName} ${enabledClassName}`}
        onClick={() => this.props.onSelect(this.props.stream)}
        onContextMenu={(ev) => this.handleContextMenu(ev)}
      >
        <StreamIcon name={this.props.stream.iconName} color={iconColor}/>
        <StreamName singleLine={true}>{name}</StreamName>
        <StreamUnreadCount style={unreadCountStyle}>{unreadCount}</StreamUnreadCount>
        <StreamMenuIcon style={menuIconStyle} onClick={(ev) => this.handleContextMenu(ev)}>
          <Icon name='dots-vertical' color={this.props.selected ? color.white : appTheme().icon.normal}/>
        </StreamMenuIcon>

        <ContextMenu
          show={this.state.showMenu}
          pos={this.contextMenuPos}
          onClose={() => this.setState({showMenu: false})}
          menus={this.menus}
          hideBrowserView={false}
        />
      </Root>
    );
  }
}

const Root = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  margin-left: ${space.medium}px;
  margin-right: ${space.medium}px;
  padding-left: ${space.medium}px;
  padding-right: ${space.medium}px;
  padding-top: ${space.small}px;
  padding-bottom: ${space.small}px;
  min-height: fit-content;
  border-radius: 8px;
  
  &:hover {
    background: ${() => appTheme().bg.primaryHover};
  }
  
  &.stream-selected {
    background: ${() => color.blue};
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
  
  .stream-has-unread & {
    font-weight: ${fontWeight.strongBold};
  }
  
  .stream-no-unread & {
    color: ${() => appTheme().text.soft};
  }
  
  .stream-disabled & {
    font-weight: ${fontWeight.medium};
    color: ${() => appTheme().text.tiny};
    opacity: 0.5;
  }
  
  .stream-selected & {
    color: ${color.white};
  }
`;

const StreamUnreadCount = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().text.soft};
  min-width: 1.5em;
  text-align: right;
  
  .stream-has-unread & {
    font-weight: ${fontWeight.strongBold};
  }
  
  .stream-no-unread & {
    color: ${() => appTheme().text.soft};
  }
  
  .stream-row:hover & {
    display: none;
  }
  
  .stream-selected & {
    color: ${color.white};
  }
`;

const StreamMenuIcon = styled(ClickView)`
  display: none;
  min-width: 1.5em;
  position: relative;
  left: 8px;
  
  .stream-row:hover & {
    display: flex;
    opacity: 0.7;
  }
`;
