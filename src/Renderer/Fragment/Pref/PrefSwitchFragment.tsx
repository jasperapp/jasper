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
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

type Props = {
  show: boolean;
  users: RemoteUserEntity[];
  onClose: () => void;
  onSwitchPref: (prefIndex: number) => void;
}

type State = {
}

export class PrefSwitchFragment extends React.Component<Props, State> {
  private handleSwitchPref(index: number) {
    if (index === UserPrefRepo.getIndex()) return;

    this.props.onSwitchPref(index);
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={this.props.onClose} style={{width: 300}}>
        {this.renderUsers()}
      </Modal>
    );
  }

  renderUsers() {
    return this.props.users.map((user, index) => {
      const currentClassName = index === UserPrefRepo.getIndex() ? 'user-current' : '';

      return (
        <User key={index} className={`user-row ${currentClassName}`} onClick={() => this.handleSwitchPref(index)}>
          <UserIcon userName={user.login} iconUrl={user.avatar_url} size={icon.medium}/>
          <NameWrap>
            <DisplayName>{user.name || user.login}</DisplayName>
            <LoginName>{user.login}</LoginName>
          </NameWrap>
        </User>
      );
    });
  }
}

const User = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  border: solid ${border.medium}px ${color.blue};
  flex: 1;
  padding: ${space.medium}px;
  border-radius: 4px;
  margin-bottom: ${space.medium}px;
  
  &:hover, &.user-current {
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

  .user-row:hover &, .user-current & {
    color: ${color.white};
  }
`;

const LoginName = styled(Text)`
  font-size: ${font.tiny}px;
  color: ${() => appTheme().textSoftColor};

  .user-row:hover &, .user-current & {
    color: ${color.white};
  }
`;
