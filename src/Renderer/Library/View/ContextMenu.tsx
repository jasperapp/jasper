import React from 'react';
import styled from 'styled-components';
import {appTheme} from '../Style/appTheme';
import {border, font, iconFont, space} from '../Style/layout';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {ClickView} from './ClickView';
import {color} from '../Style/color';
import {Text} from './Text';
import {View} from './View';
import {IconNameType} from '../Type/IconNameType';
import {Icon} from './Icon';
import {TimerUtil} from '../Util/TimerUtil';
import {Image} from './Image';

export type ContextMenuType = {
  type?: 'item' | 'separator';
  icon?: IconNameType;
  label?: string;
  handler?: () => void;
  hide?: boolean;
  subLabel?: string;
  image?: string;
}

type Props = {
  show: boolean;
  pos: {top: number; left: number};
  onClose: () => void;
  menus: ContextMenuType[];
  hideBrowserView?: boolean;
  horizontalLeft?: boolean;
}

type State = {
}

export class ContextMenu extends React.Component<Props, State> {
  static defaultProps = {hideBrowserView: true};

  componentDidMount() {
    window.addEventListener('keydown', this.handleKeyDownBind);
    window.addEventListener('blur', this.handleBlurBind);
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.show && !prevProps.show) {
      if (this.props.hideBrowserView) BrowserViewIPC.hide(true);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDownBind);
    window.removeEventListener('blur', this.handleBlurBind);
  }

  private handleKeyDownBind = (ev: KeyboardEvent) => {
    if (this.props.show && ev.key === 'Escape') this.handleClose();
  }

  private handleBlurBind = () => {
    if (this.props.show) this.handleClose();
  }

  private handleClose() {
    this.props.onClose();

    // メニュー表示時にbrowser viewをhideしていた場合に限り、hideを解除する(hideがカウントロックなため)
    if (this.props.hideBrowserView) BrowserViewIPC.hide(false);
  }

  private async handleMenu(menu: ContextMenuType) {
    this.handleClose();
    await TimerUtil.sleep(16); // context menuを完全に消すため
    await menu.handler();
  }

  render() {
    if (!this.props.show) return null;

    const horizontalLeftClassName = this.props.horizontalLeft ? 'context-menu-horizontal-left' : '';
    const {top, left} = this.props.pos;

    return (
      <Root onClick={() => this.handleClose()} onContextMenu={() => this.handleClose()}>
        <Body onClick={() => null} style={{top, left}} className={`${horizontalLeftClassName}`}>
          {this.renderMenus()}
        </Body>
      </Root>
    );
  }

  renderMenus() {
    return this.props.menus.map((menu, index) => {
      if (menu.hide) return;

      if (menu.type === 'separator') return <MenuSeparator key={index}/>;

      let icon;
      if (menu.icon) {
        icon = <MenuIcon name={menu.icon}/>;
      }

      let image;
      if (menu.image) {
        image = <MenuImage source={{url: menu.image}}/>;
      }

      let subLabel;
      if (menu.subLabel) {
        subLabel = (
          <MenuSubLabel>{menu.subLabel}</MenuSubLabel>
        );
      }

      return (
        <MenuRow onClick={this.handleMenu.bind(this, menu)} key={index} className='context-menu-row'>
          {icon}
          {image}
          <MenuLabel>{menu.label}</MenuLabel>
          {subLabel}
        </MenuRow>
      )
    });
  }
}

const Root = styled(ClickView)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  cursor: initial;
`;

const Body = styled(ClickView)`
  position: fixed;
  top: 0;
  left: 0;
  background: ${() => appTheme().bg.primary};
  padding: 0 0 ${space.small}px;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  box-shadow: 0 0 8px 4px #00000010;
  border-radius: 6px;

  &.context-menu-horizontal-left {
    transform: translateX(-100%);
  }
`;

const MenuRow = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  margin: ${space.small}px ${space.small2}px;
  padding: ${space.tiny}px ${space.medium2}px;
  border-radius: 6px;

  &:hover {
    background: ${color.blue};
  }
`;

const MenuLabel = styled(Text)`
  .context-menu-row:hover & {
    color: ${color.white};
  }
`;

const MenuSubLabel = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().text.soft};
  padding-left: ${space.small}px;
  .context-menu-row:hover & {
    color: ${color.white};
  }
`;

const MenuIcon = styled(Icon)`
  margin-right: ${space.small2}px;

  .context-menu-row:hover & {
    color: ${color.white};
  }
`;

const MenuSeparator = styled(View)`
  margin-top: ${space.small}px;
  height: ${border.medium}px;
  width: 100%;
  background: ${() => appTheme().border.normal};
`;

const MenuImage = styled(Image)`
  margin-right: ${space.small2}px;
  width: ${iconFont.medium}px;
  border-radius: 100px;
`;
