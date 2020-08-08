import React from 'react';
import {ConfigRepo} from '../../Repository/ConfigRepo';
import {UserIcon} from '../../Component/UserIcon';
import {color} from '../../Style/color';
import {border, font, fontWeight, icon, space} from '../../Style/layout';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {ClickView} from '../../Component/ClickView';
import {View} from '../../Component/VIew';
import {Icon} from '../../Component/Icon';
import {Text} from '../../Component/Text';
import {ModalAccountSetupFragment} from './ModalAccountSetupFragment';
import {ConfigType} from '../../../Type/ConfigType';
import {AccountRepo} from '../../Repository/AccountRepo';
import {AccountType} from '../../Type/AccountType';

type Props = {
  onSwitchConfig: (configIndex: number) => void;
}

type State = {
  accounts: AccountType[];
  activeIndex: number;
  accountSetupShow: boolean;
}

export class AccountFragment extends React.Component<Props, State> {
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

  private async handleCloseAccountSetup(github: ConfigType['github']) {
    this.setState({accountSetupShow: false});
    if (github) {
      const res = await ConfigRepo.addConfigGitHub(github);
      if (!res) return;
      await this.fetchAccounts();
    }
  }

  render() {
    return (
      <Root>
        <Label>
          <Text style={{flex: 1, fontWeight: fontWeight.softBold, color: appTheme().textSoftColor, fontSize: font.small}}>ACCOUNTS</Text>
          <ClickView onClick={() => this.setState({accountSetupShow: true})}>
            <Icon name='plus' title='add account'/>
          </ClickView>
        </Label>

        <UserIcons>
          {this.renderUserIcons()}
        </UserIcons>

        <ModalAccountSetupFragment
          show={this.state.accountSetupShow}
          onClose={this.handleCloseAccountSetup.bind(this)}
          closable={true}
        />
      </Root>
    );
  }

  private renderUserIcons() {
    return this.state.accounts.map((avatar, index) => {
      const style = this.state.activeIndex === index ? {borderColor: color.orange} : {};
      return (
        <UserIconWrap style={style} key={index} onClick={() => this.switchConfig(index)}>
          <UserIcon userName={avatar.loginName} iconUrl={avatar.avatarURL} size={icon.medium}/>
        </UserIconWrap>
      );
    });
  }
}

const Root = styled(View)`
  padding: ${space.medium}px ${space.medium}px 0;
`;

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
