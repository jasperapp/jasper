import React from 'react';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {UserIcon} from '../../Component/UserIcon';
import {font, fontWeight, icon, space} from '../../Style/layout';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {ClickView} from '../../Component/Core/ClickView';
import {View} from '../../Component/Core/View';
import {Icon} from '../../Component/Core/Icon';
import {UserPrefEntity} from '../../Type/UserPrefEntity';
import {Text} from '../../Component/Core/Text';
import {RemoteUserEntity} from '../../Type/RemoteIssueEntity';
import {PrefSwitchFragment} from './PrefSwitchFragment';
import {PrefSetupFragment} from './PrefSetupFragment';
import {AppIPC} from '../../../IPC/AppIPC';
import {PrefEditorFragment} from './PrefEditorFragment';
import {ContextMenu, ContextMenuType} from '../../Component/Core/ContextMenu';

type Props = {
  onSwitchPref: (prefIndex: number) => void;
}

type State = {
  users: RemoteUserEntity[];
  user: RemoteUserEntity;
  showPrefEditor: boolean;
  showPrefSetup: boolean;
  showPrefSwitch: boolean;
  showContextMenu: boolean;
}

export class PrefCoverFragment extends React.Component<Props, State> {
  state: State = {
    user: UserPrefRepo.getUser(),
    users: [],
    showPrefEditor: false,
    showPrefSetup: false,
    showPrefSwitch: false,
    showContextMenu: false,
  };

  private menus: ContextMenuType[] = [];
  private contextMenuPos: {left: number; top: number};

  componentDidMount() {
    AppIPC.onShowPref(() => this.setState({showPrefEditor: true}));
    this.fetchUsers();
  }

  private async fetchUsers() {
    const {error, users} = await UserPrefRepo.getUsers();
    if (error) return console.error(users);
    this.setState({users: users});
  }

  private async handleSwitchPref(index: number) {
    this.setState({showPrefSwitch: false, user: this.state.users[index]});
    this.props.onSwitchPref(index);
  }

  private async handleDeletePref() {
    if (confirm(`Do you remove ${this.state.user.login} from Jasper?`)) {
      await UserPrefRepo.deletePref(UserPrefRepo.getIndex());
      await AppIPC.reload();
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
    this.menus = [
      {label: 'Edit', icon: 'pencil-outline', handler: () => this.setState({showPrefEditor: true})},
      {label: 'Delete', icon: 'delete-outline', handler: () => this.handleDeletePref()},
      {type: 'separator'},
      {label: 'Add New', icon: 'account-plus-outline', handler: () => this.setState({showPrefSetup: true})},
      {type: 'separator'},
      {label: 'Switch to Other', icon: 'account-switch-outline', handler: () => this.setState({showPrefSwitch: true})},
    ];
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showContextMenu: true});
  }

  render() {
    return (
      <React.Fragment>
        <Root
          onClick={() => this.setState({showPrefSwitch: true})}
          onContextMenu={ev => this.handleContextMenu(ev)}
        >
          <UserIcon userName={this.state.user.login} iconUrl={this.state.user.avatar_url} size={icon.medium}/>
          <NameWrap>
            <DisplayName>{this.state.user.name || this.state.user.login}</DisplayName>
            <LoginName>{this.state.user.login}</LoginName>
          </NameWrap>
          <SwitchIconWrap className='pref-switch-icon'>
            <Icon name='unfold-more-horizontal'/>
          </SwitchIconWrap>
        </Root>

        <PrefEditorFragment
          show={this.state.showPrefEditor}
          onClose={() => this.setState({showPrefEditor: false})}
        />

        <PrefSwitchFragment
          show={this.state.showPrefSwitch}
          users={this.state.users}
          onClose={() => this.setState({showPrefSwitch: false})}
          onSwitchPref={(index) => this.handleSwitchPref(index)}
        />

        <PrefSetupFragment
          show={this.state.showPrefSetup}
          onClose={(github, browser) => this.handleClosePrefSetup(github, browser)}
          closable={true}
        />

        <ContextMenu
          show={this.state.showContextMenu}
          onClose={() => this.setState({showContextMenu: false})}
          menus={this.menus}
          pos={this.contextMenuPos}
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
    background: ${() => appTheme().bgSideSelect};
  }
  
  &:hover .pref-switch-icon {
    display: flex;
  }
`;

const NameWrap = styled(View)`
  flex: 1;
  padding-left: ${space.medium}px;
`;

const DisplayName = styled(Text)`
  font-size: ${font.small}px;
  font-weight: ${fontWeight.bold};
`;

const LoginName = styled(Text)`
  font-size: ${font.tiny}px;
  color: ${() => appTheme().textSoftColor}
`;

const SwitchIconWrap = styled(ClickView)`
  display: none;
`;
