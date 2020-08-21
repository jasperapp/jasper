import React from 'react';
import {RemoteUserEntity} from '../../Type/RemoteIssueEntity';
import {Modal} from '../../Component/Core/Modal';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {UserIcon} from '../../Component/UserIcon';
import {border, font, fontWeight, icon, space} from '../../Style/layout';
import {Text} from '../../Component/Core/Text';
import {appTheme} from '../../Style/appTheme';
import {ClickView} from '../../Component/Core/ClickView';
import {Icon} from '../../Component/Core/Icon';
import {color} from '../../Style/color';
import {Button} from '../../Component/Core/Button';
import {ConfigRepo} from '../../Repository/ConfigRepo';

type Props = {
  show: boolean;
  accounts: RemoteUserEntity[];
  onClose: () => void;
  onSwitchAccount: (accountIndex: number) => void;
  onAddNewAccount: () => void;
  onDeleteAccount: (index: number) => void;
}

type State = {
}

export class AccountSwitchFragment extends React.Component<Props, State> {
  private handleSwitchAccount(index: number) {
    if (index === ConfigRepo.getIndex()) return;

    this.props.onSwitchAccount(index);
  }

  private handleDeleteAccount(index: number) {
    this.props.onDeleteAccount(index);
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={this.props.onClose} style={{width: 300}}>
        {this.renderAccounts()}

        <Button
          onClick={this.props.onAddNewAccount}
          style={{width: '100%', marginTop: space.medium}}
        >
          Add New Account
        </Button>
      </Modal>
    );
  }

  renderAccounts() {
    return this.props.accounts.map((account, index) => {
      const currentClassName = index === ConfigRepo.getIndex() ? 'account-current' : '';

      return (
        <Account key={index} className={`account-row ${currentClassName}`} onClick={() => this.handleSwitchAccount(index)}>
          <UserIcon userName={account.login} iconUrl={account.avatar_url} size={icon.medium}/>
          <NameWrap>
            <DisplayName>{account.name || account.login}</DisplayName>
            <LoginName>{account.login}</LoginName>
          </NameWrap>
          <DeleteIconClick title='Remove Account from Jasper' onClick={() => this.handleDeleteAccount(index)}>
            <DeleteIcon name='delete'/>
          </DeleteIconClick>
        </Account>
      );
    });
  }
}

const Account = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  border: solid ${border.medium}px ${color.blue};
  flex: 1;
  padding: ${space.medium}px;
  border-radius: 4px;
  margin-bottom: ${space.medium}px;
  
  &:hover, &.account-current {
    background: ${color.blue};
  }
`;

const NameWrap = styled(View)`
  flex: 1;
  padding-left: ${space.medium}px;
`;

const DisplayName = styled(Text)`
  font-size: ${font.small}px;
  font-weight: ${fontWeight.bold};

  .account-row:hover &, .account-current & {
    color: ${color.white};
  }
`;

const LoginName = styled(Text)`
  font-size: ${font.tiny}px;
  color: ${() => appTheme().textSoftColor};

  .account-row:hover &, .account-current & {
    color: ${color.white};
  }
`;

const DeleteIconClick = styled(ClickView)`
  padding-left: ${space.medium}px;
`;

const DeleteIcon = styled(Icon)`
  .account-row:hover &, .account-current & {
    color: ${color.white};
  }
`;
