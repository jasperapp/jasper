import React from 'react';
import {ConfigRepo} from '../../Repository/ConfigRepo';
import {UserIcon} from '../../Component/UserIcon';
import {color} from '../../Style/color';
import {border, icon, space} from '../../Style/layout';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {ClickView} from '../../Component/Core/ClickView';
import {View} from '../../Component/Core/View';
import {Icon} from '../../Component/Core/Icon';
import {AccountEditorFragment} from './AccountEditorFragment';
import {ConfigType} from '../../../Type/ConfigType';
import {AccountRepo} from '../../Repository/AccountRepo';
import {AccountType} from '../../Type/AccountType';
import {SideSectionTitle} from '../../Component/SideSectionTitle';
import {SideSection} from '../../Component/SideSection';

type Props = {
  onSwitchConfig: (configIndex: number) => void;
}

type State = {
  accounts: AccountType[];
  activeIndex: number;
  accountSetupShow: boolean;
}

export class AccountsFragment extends React.Component<Props, State> {
  state: State = {
    accounts: [],
    activeIndex: ConfigRepo.getIndex(),
    accountSetupShow: false,
  };

  componentDidMount() {
    this.fetchAccounts();
  }

  private async fetchAccounts() {
    const {error, accounts} = await AccountRepo.getAccounts();
    if (error) return console.error(accounts);
    this.setState({accounts});
  }

  private async switchConfig(index: number) {
    if (this.state.activeIndex === index) return;

    this.setState({activeIndex: index});
    this.props.onSwitchConfig(index);
  }

  private async handleCloseAccountSetup(github: ConfigType['github'], browser: ConfigType['general']['browser']) {
    this.setState({accountSetupShow: false});
    if (github) {
      const res = await ConfigRepo.addConfigGitHub(github, browser);
      if (!res) return;
      await this.fetchAccounts();
    }
  }

  render() {
    return (
      <SideSection>
        <Label>
          <SideSectionTitle>ACCOUNTS</SideSectionTitle>
          <ClickView onClick={() => this.setState({accountSetupShow: true})}>
            <Icon name='plus' title='add account'/>
          </ClickView>
        </Label>

        <UserIcons>
          {this.renderUserIcons()}
        </UserIcons>

        <AccountEditorFragment
          show={this.state.accountSetupShow}
          onClose={(github, browser) => this.handleCloseAccountSetup(github, browser)}
          closable={true}
        />
      </SideSection>
    );
  }

  private renderUserIcons() {
    return this.state.accounts.map((avatar, index) => {
      const style = this.state.activeIndex === index ? {borderColor: color.blue} : {};
      return (
        <UserIconWrap style={style} key={index} onClick={() => this.switchConfig(index)}>
          <UserIcon userName={avatar.loginName} iconUrl={avatar.avatarURL} size={icon.medium}/>
        </UserIconWrap>
      );
    });
  }
}

const UserIcons = styled(View)`
  flex-direction: row;
  padding-top: ${space.medium}px;
  padding-left: ${space.medium}px;
`;

const Label = styled(View)`
  flex-direction: row;
`;

const UserIconWrap = styled(ClickView)`
  margin-right: ${space.small}px;
  border: solid ${border.large2}px ${appTheme().borderColor};
  border-radius: 100%;
`;
