import React from 'react';
import styled from 'styled-components';
import {IconButton} from '../../Library/View/IconButton';
import {space} from '../../Library/Style/layout';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IconNameType} from '../../Library/Type/IconNameType';
import {UserPrefEvent} from '../../Event/UserPrefEvent';
import {AppIPC} from '../../../IPC/AppIPC';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {JumpNavigationFragment} from '../JumpNavigation/JumpNavigationFragment';
import {DraggableHeader} from '../../Library/View/DraggableHeader';

type Props = {
}

type State = {
  notification: boolean;
  showJumpNavigation: boolean;
  initialKeywordForJumpNavigation: string;
}

export class SideHeaderFragment extends React.Component<Props, State> {
  state: State = {
    notification: true,
    showJumpNavigation: false,
    initialKeywordForJumpNavigation: '',
  }

  componentDidMount() {
    const pref = UserPrefRepo.getPref();
    this.setState({notification: pref.general.notification});

    UserPrefEvent.onUpdatePref(this, () => {
      const pref = UserPrefRepo.getPref();
      this.setState({notification: pref.general.notification});
    });

    UserPrefEvent.onSwitchPref(this, () => {
      const pref = UserPrefRepo.getPref();
      this.setState({notification: pref.general.notification});
    });

    AppIPC.onToggleNotification(() => this.handleToggleNotification());
    AppIPC.onShowJumpNavigation(() => this.handleShowGlobalSearch());
    AppIPC.onShowRecentlyReads(() => this.handleShowGlobalSearch('sort:read'));
  }

  componentWillUnmount() {
    UserPrefEvent.offAll(this);
  }

  private async handleToggleNotification() {
    const pref = UserPrefRepo.getPref();
    const notification = !pref.general.notification;

    this.setState({notification});

    pref.general.notification = notification;
    await UserPrefRepo.updatePref(pref);
  }

  private handleShowGlobalSearch(initialKeyword = '') {
    this.setState({showJumpNavigation: true, initialKeywordForJumpNavigation: initialKeyword});
  }

  render() {
    const icon: IconNameType = this.state.notification ? 'bell-outline' : 'bell-off-outline';

    return (
      <Root>
        <IconButton
          name='magnify'
          onClick={() => this.handleShowGlobalSearch()}
          title={`Jump Navigation (${PlatformUtil.getCommandKeyName()} K)`}
        />

        <IconButton
          name={icon}
          onClick={() => this.handleToggleNotification()}
          title={`Toggle Notification On/Off (${PlatformUtil.getCommandKeyName()} I)`}
        />

        <JumpNavigationFragment
          show={this.state.showJumpNavigation}
          onClose={() => this.setState({showJumpNavigation: false})}
          initialKeyword={this.state.initialKeywordForJumpNavigation}
        />
      </Root>
    );
  }
}

const Root = styled(DraggableHeader)`
  justify-content: flex-end;
  align-self: flex-end;
  min-height: 42px;
  padding-right: ${space.medium}px;
`;

