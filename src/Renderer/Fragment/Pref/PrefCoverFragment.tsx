import React from 'react';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {UserIcon} from '../../Library/View/UserIcon';
import {font, fontWeight, icon, space} from '../../Library/Style/layout';
import styled from 'styled-components';
import {appTheme} from '../../Library/Style/appTheme';
import {ClickView} from '../../Library/View/ClickView';
import {View} from '../../Library/View/View';
import {Icon} from '../../Library/View/Icon';
import {UserPrefEntity} from '../../Library/Type/UserPrefEntity';
import {Text} from '../../Library/View/Text';
import {RemoteUserEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {PrefSwitchFragment} from './PrefSwitchFragment';
import {PrefSetupFragment} from './PrefSetupFragment';
import {AppIPC} from '../../../IPC/AppIPC';
import {PrefEditorFragment} from './PrefEditorFragment';
import {ContextMenu, ContextMenuType} from '../../Library/View/ContextMenu';

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
    const otherUsers = this.state.users.filter(user => user.login !== this.state.user.login);
    let otherUserViews;
    if (otherUsers.length) {
      otherUserViews = otherUsers.map((user, index) => {
        return (
          <UserIcon
            userName={user.login}
            iconUrl={user.avatar_url}
            size={icon.small}
            key={index}
            style={{marginLeft: space.tiny, opacity: 0.7}}
          />
        );
      });
    }

    return (
      <React.Fragment>
        <Root
          onClick={() => this.setState({showPrefSwitch: true})}
          onContextMenu={ev => this.handleContextMenu(ev)}
          className='pref-cover'
        >
          <UserIcon userName={this.state.user.login} iconUrl={this.state.user.avatar_url} size={icon.medium}/>
          <NameWrap>
            <DisplayNameWrap>
              <DisplayName>{this.state.user.name || this.state.user.login}</DisplayName>
              <SwitchIconWrap onClick={ev => this.handleContextMenu(ev)}>
                <Icon name='dots-vertical'/>
              </SwitchIconWrap>
            </DisplayNameWrap>
            <LoginNameRow>
              <LoginName>{this.state.user.login}</LoginName>
              {otherUserViews}
            </LoginNameRow>
          </NameWrap>
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
    background: ${() => appTheme().bgSideSelect};
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
  color: ${() => appTheme().textSoftColor}
`;

const SwitchIconWrap = styled(ClickView)`
  display: none;
  
  .pref-cover:hover & {
    display: flex;
  }
`;
