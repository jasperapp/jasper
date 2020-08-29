import React from 'react';
import {RemoteVersionEntity} from '../../Library/Type/RemoteVersionEntity';
import {TrafficLightsSafe} from '../../Library/View/TrafficLightsSafe';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {IconButton} from '../../Library/View/IconButton';
import {space} from '../../Library/Style/layout';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IconNameType} from '../../Library/Type/IconNameType';
import {UserPrefEvent} from '../../Event/UserPrefEvent';

type Props = {
}

type State = {
  notification: boolean;
  newVersion: RemoteVersionEntity | null;
}

export class HeaderFragment extends React.Component<Props, State> {
  state: State = {
    notification: true,
    newVersion: null,
  }

  componentDidMount() {
    const pref = UserPrefRepo.getPref();
    this.setState({notification: pref.general.notification});

    UserPrefEvent.onUpdatePref(this, () => {
      const pref = UserPrefRepo.getPref();
      this.setState({notification: pref.general.notification});
    });
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

  render() {
    const icon: IconNameType = this.state.notification ? 'bell-outline' : 'bell-off-outline';

    return (
      <TrafficLightsSafe hideDragBar={true}>
        <Inner>
          <IconButton name={icon} onClick={() => this.handleToggleNotification()} title='Toggle Notification On/Off'/>
        </Inner>
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

