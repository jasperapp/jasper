import React from 'react';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {border, space} from '../../Style/layout';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {ClickView} from './ClickView';
import {color} from '../../Style/color';
import {Text} from './Text';
import {View} from './View';

export type MenuType = {
  type?: 'item' | 'separator';
  label?: string;
  handler?: () => void;
}

type Props = {
  show: boolean;
  onClose: () => void;
  menus: MenuType[];
}

type State = {
}

export class ContextMenu extends React.Component<Props, State> {
  static moveMouse;
  static pos = {top: null, left: null};

  static setupMouse() {
    if (this.moveMouse) return;

    this.moveMouse = (ev: React.MouseEvent) => {
      this.pos = {top: ev.clientY, left: ev.clientX};
    }

    window.addEventListener('mousemove', this.moveMouse);
  }

  private onKeyup;

  constructor(props) {
    super(props);

    ContextMenu.setupMouse();
  }

  componentDidMount() {
    this.onKeyup = (ev) => {
      if (this.props.show && ev.key === 'Escape') this.handleClose();
    };
    window.addEventListener('keyup', this.onKeyup);
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.onKeyup);
  }

  private handleClose() {
    this.props.onClose();
    BrowserViewIPC.hide(false);
  }

  private handleMenu(menu: MenuType) {
    this.handleClose();
    menu.handler();
  }

  render() {
    if (!this.props.show) return null;

    BrowserViewIPC.hide(true);

    const {top, left} = ContextMenu.pos;

    return (
      <Root onClick={() => this.handleClose()} onContextMenu={() => this.handleClose()}>
        <Body onClick={() => null} style={{top, left}}>
          {this.renderMenus()}
        </Body>
      </Root>
    );
  }

  renderMenus() {
    return this.props.menus.map((menu, index) => {
      if (menu.type === 'separator') return <MenuSeparator key={index}/>;

      return (
        <MenuRow onClick={this.handleMenu.bind(this, menu)} key={index}>
          <MenuLabel>{menu.label}</MenuLabel>
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
  background: ${() => appTheme().contextMenuColor};
  padding: ${space.small}px 0;
  border: solid ${border.medium}px ${() => appTheme().borderColor};
  box-shadow: 0 0 8px 4px #00000010;
  border-radius: 6px;
`;

const MenuRow = styled(ClickView)`
`;

const MenuLabel = styled(Text)`
  padding: 0 ${space.large}px;
  &:hover {
    background: ${() => appTheme().contextMenuHover};
    color: ${color.white};
  }
`;

const MenuSeparator = styled(View)`
  height: ${border.large}px;
  width: 100%;
  background: ${() => appTheme().borderColor};
`;
