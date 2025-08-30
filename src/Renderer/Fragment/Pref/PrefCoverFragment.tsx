import React from 'react';
import styled from 'styled-components';
import {MainWindowIPCChannels} from '../../../IPC/MainWindowIPC/MainWindowIPC.channel';
import {appTheme} from '../../Library/Style/appTheme';
import {font, fontWeight, icon, space} from '../../Library/Style/layout';
import {RemoteUserEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {UserPrefEntity} from '../../Library/Type/UserPrefEntity';
import {ClickView} from '../../Library/View/ClickView';
import {ContextMenu, ContextMenuType} from '../../Library/View/ContextMenu';
import {Text} from '../../Library/View/Text';
import {Translate} from '../../Library/View/Translate';
import {UserIcon} from '../../Library/View/UserIcon';
import {View} from '../../Library/View/View';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {PrefEditorFragment} from './PrefEditorFragment';
import {PrefSetupFragment} from './PrefSetupFragment';

type Props = {
  onSwitchPref: (prefIndex: number) => void;
}

type State = {
  users: RemoteUserEntity[];
  index: number;
  showPrefEditor: boolean;
  showPrefSetup: boolean;
  showContextMenu: boolean;
}

export class PrefCoverFragment extends React.Component<Props, State> {
  state: State = {
    index: UserPrefRepo.getIndex(),
    users: [],
    showPrefEditor: false,
    showPrefSetup: false,
    showContextMenu: false,
  };

  private menus: ContextMenuType[] = [];
  private contextMenuPos: {left: number; top: number};

  componentDidMount() {
    window.ipc.on(MainWindowIPCChannels.showPref, () => this.setState({showPrefEditor: true}));
    this.fetchUsers();
  }

  private async fetchUsers() {
    const {users} = await UserPrefRepo.getUsers();
    this.setState({users: users});
  }

  private async handleSwitchPref(index: number) {
    if (index === this.state.index) return;
    this.setState({index});
    this.props.onSwitchPref(index);
  }

  private async handleDeletePref() {
    if (confirm(`Do you remove ${this.state.users[this.state.index].login} from Jasper?`)) {
      await UserPrefRepo.deletePref();
    }
  }

  private async handleClosePrefSetup(github: UserPrefEntity['github'], browser: UserPrefEntity['general']['browser']) {
    this.setState({showPrefSetup: false});
    if (github) {
      const res = await UserPrefRepo.addPrefGitHub(github, browser);
      if (!res) return;
      await this.fetchUsers();
    }
  }

  private handleContextMenu(ev: React.MouseEvent) {
    const userMenus: ContextMenuType[] = this.state.users.map((user, index) => {
      return {
        label: user.login,
        image: user.avatar_url,
        icon: index === this.state.index ? 'radiobox-marked' : 'radiobox-blank',
        handler: () => this.handleSwitchPref(index),
      };
    });

    this.menus = [
      {label: <Translate onMessage={mc => mc.prefCover.edit}/>, icon: 'pencil-outline', handler: () => this.setState({showPrefEditor: true})},
      {label: <Translate onMessage={mc => mc.prefCover.delete}/>, icon: 'delete-outline', handler: () => this.handleDeletePref()},
      {type: 'separator'},
      ...userMenus,
      {type: 'separator'},
      {label: <Translate onMessage={mc => mc.prefCover.addNew}/>, icon: 'account-plus-outline', handler: () => this.setState({showPrefSetup: true})},
    ];
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showContextMenu: true});
  }

  render() {
    const currentUser = UserPrefRepo.getUser();
    if (!currentUser) return null;

    const otherUserViews = this.state.users.map((user, index) => {
      if (this.state.index === index) return null;

      return (
        <ClickView
          key={index}
          title={`Switch to ${user.login}`}
          onClick={() => this.handleSwitchPref(index)}
        >
          <UserIcon
            userName={user.login}
            iconUrl={user.avatar_url}
            size={icon.small2}
            style={{marginLeft: space.tiny, opacity: 0.7}}
          />
        </ClickView>
      );
    });

    return (
      <React.Fragment>
        <Root
          onClick={ev => this.handleContextMenu(ev)}
          onContextMenu={ev => this.handleContextMenu(ev)}
          className='pref-cover'
        >
          <UserIcon userName={currentUser.name} iconUrl={currentUser.avatar_url} size={icon.large2}/>
          <NameWrap>
            <DisplayNameWrap>
              <DisplayName singleLine={true}>{currentUser.name || currentUser.login}</DisplayName>
            </DisplayNameWrap>
            <LoginNameRow>
              <LoginName singleLine={true}>{currentUser.login}</LoginName>
              {otherUserViews}
            </LoginNameRow>
          </NameWrap>
        </Root>

        <PrefEditorFragment
          show={this.state.showPrefEditor}
          onClose={() => this.setState({showPrefEditor: false})}
        />

        <PrefSetupFragment
          show={this.state.showPrefSetup}
          onClose={(github, browser) => this.handleClosePrefSetup(github, browser)}
        />

        <ContextMenu
          show={this.state.showContextMenu}
          onClose={() => this.setState({showContextMenu: false})}
          menus={this.menus}
          pos={this.contextMenuPos}
          hideBrowserView={false}
        />
      </React.Fragment>
    );
  }
}

const Root = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  padding: ${space.medium}px;
  
  &:hover {
    background: ${() => appTheme().bg.primaryHover};
  }
`;

const NameWrap = styled(View)`
  flex: 1;
  padding-left: ${space.medium}px;
`;

const DisplayNameWrap = styled(View)`
  flex-direction: row;
`;

const DisplayName = styled(Text)`
  flex: 1;
  font-size: ${font.small}px;
  font-weight: ${fontWeight.bold};
`;

const LoginNameRow = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const LoginName = styled(Text)`
  flex: 1;
  font-size: ${font.tiny}px;
  color: ${() => appTheme().text.soft}
`;
