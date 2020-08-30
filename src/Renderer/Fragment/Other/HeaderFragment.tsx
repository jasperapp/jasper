import React from 'react';
import {RemoteVersionEntity} from '../../Library/Type/RemoteVersionEntity';
import {TrafficLightsSafe} from '../../Library/View/TrafficLightsSafe';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {IconButton} from '../../Library/View/IconButton';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IconNameType} from '../../Library/Type/IconNameType';
import {UserPrefEvent} from '../../Event/UserPrefEvent';
import {VersionEvent} from '../../Event/VersionEvent';
import {shell} from "electron";
import {ClickView} from '../../Library/View/ClickView';
import {Text} from '../../Library/View/Text';
import {color} from '../../Library/Style/color';
import {AppIPC} from '../../../IPC/AppIPC';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {JumpNavigationFragment} from '../JumpNavigation/JumpNavigationFragment';

type Props = {
}

type State = {
  notification: boolean;
  newVersion: RemoteVersionEntity | null;
  showJumpNavigation: boolean;
  initialKeywordForJumpNavigation: string;
}

export class HeaderFragment extends React.Component<Props, State> {
  state: State = {
    notification: true,
    newVersion: null,
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

    VersionEvent.onNewVersion(this, (newVersion) => this.setState({newVersion}));

    AppIPC.onToggleNotification(() => this.handleToggleNotification());
    AppIPC.onShowJumpNavigation(() => this.handleShowGlobalSearch());
    AppIPC.onShowRecentlyReads(() => this.handleShowGlobalSearch('sort:read'));
  }

  componentWillUnmount() {
    UserPrefEvent.offAll(this);
    VersionEvent.offAll(this);
  }

  private handleNewVersion() {
    shell.openExternal(this.state.newVersion.url);
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

    const newVersion = this.state.newVersion ? 'New Version' : '';

    return (
      <TrafficLightsSafe hideDragBar={true}>
        <Inner>
          <ClickView onClick={() => this.handleNewVersion()} style={{display: newVersion ? null : 'none'}}>
            <NewVersionText>{newVersion}</NewVersionText>
          </ClickView>

          <IconButton
            name='magnify'
            onClick={() => this.handleShowGlobalSearch()}
            title={`Jump Navigation (${PlatformUtil.getCommandKeyName()} + K)`}
          />

          <IconButton
            name={icon}
            onClick={() => this.handleToggleNotification()}
            title={`Toggle Notification On/Off (${PlatformUtil.getCommandKeyName()} + I)`}
          />
        </Inner>

        <JumpNavigationFragment
          show={this.state.showJumpNavigation}
          onClose={() => this.setState({showJumpNavigation: false})}
          initialKeyword={this.state.initialKeywordForJumpNavigation}
        />
      </TrafficLightsSafe>
    );
  }
}

const Inner = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-top: ${space.small}px;
  width: fit-content;
  align-self: flex-end;
`;

const NewVersionText = styled(Text)`
  font-size: ${font.small}px;
  color: ${color.white};
  background: ${color.brand};
  border-radius: 6px;
  font-weight: ${fontWeight.bold};
  padding: ${space.tiny}px ${space.small2}px;
`;
