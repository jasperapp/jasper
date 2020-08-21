import React from 'react';
import {ConfigRepo} from '../../Repository/ConfigRepo';
import {UserIcon} from '../../Component/UserIcon';
import {font, fontWeight, icon, space} from '../../Style/layout';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {ClickView} from '../../Component/Core/ClickView';
import {View} from '../../Component/Core/View';
import {Icon} from '../../Component/Core/Icon';
import {ConfigType} from '../../Type/ConfigType';
import {AccountRepo} from '../../Repository/AccountRepo';
import {Text} from '../../Component/Core/Text';
import {RemoteUserEntity} from '../../Type/RemoteIssueEntity';
import {AccountSwitchFragment} from './AccountSwitchFragment';
import {AccountEditorFragment} from './AccountEditorFragment';
import {AppIPC} from '../../../IPC/AppIPC';

type Props = {
  onSwitchConfig: (configIndex: number) => void;
}

type State = {
  accounts: RemoteUserEntity[];
  account: RemoteUserEntity;
  showAccountSetup: boolean;
  showAccountSwitch: boolean;
}

export class AccountsFragment extends React.Component<Props, State> {
  state: State = {
    account: ConfigRepo.getUser(),
    accounts: [],
    showAccountSetup: false,
    showAccountSwitch: false,
  };

  componentDidMount() {
    this.fetchAccounts();
  }

  private async fetchAccounts() {
    const {error, accounts} = await AccountRepo.getAccounts();
    if (error) return console.error(accounts);
    this.setState({accounts});
  }

  private async handleSwitchConfig(index: number) {
    this.setState({showAccountSwitch: false, account: this.state.accounts[index]});
    this.props.onSwitchConfig(index);
  }

  private async handleDeleteAccount(index: number) {
    const account = this.state.accounts[index];
    const needReload = index === ConfigRepo.getIndex();
    if (confirm(`Do you remove ${account.login} from Jasper?`)) {
      await ConfigRepo.deleteConfig(index);
      if (needReload) {
        await AppIPC.reload();
      } else {
        this.state.accounts.splice(index, 1);
        this.setState({accounts: this.state.accounts});
      }
    }
  }

  private async handleCloseAccountSetup(github: ConfigType['github'], browser: ConfigType['general']['browser']) {
    this.setState({showAccountSetup: false});
    if (github) {
      const res = await ConfigRepo.addConfigGitHub(github, browser);
      if (!res) return;
      await this.fetchAccounts();
      this.setState({showAccountSwitch: true});
    }
  }

  render() {
    return (
      <React.Fragment>
        <Root onClick={() => this.setState({showAccountSwitch: true})}>
          <UserIcon userName={this.state.account.login} iconUrl={this.state.account.avatar_url} size={icon.medium}/>
          <NameWrap>
            <DisplayName>{this.state.account.name || this.state.account.login}</DisplayName>
            <LoginName>{this.state.account.login}</LoginName>
          </NameWrap>
          <SwitchIconWrap className='account-switch-icon'>
            <Icon name='unfold-more-horizontal'/>
          </SwitchIconWrap>
        </Root>

        <AccountSwitchFragment
          show={this.state.showAccountSwitch}
          accounts={this.state.accounts}
          onClose={() => this.setState({showAccountSwitch: false})}
          onSwitchAccount={(index) => this.handleSwitchConfig(index)}
          onAddNewAccount={() => this.setState({showAccountSetup: true, showAccountSwitch: false})}
          onDeleteAccount={(index) => this.handleDeleteAccount(index)}
        />

        <AccountEditorFragment
          show={this.state.showAccountSetup}
          onClose={(github, browser) => this.handleCloseAccountSetup(github, browser)}
          closable={true}
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
  
  &:hover .account-switch-icon {
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
