import React from 'react';
import styled from 'styled-components';
import {IconButton} from '../../Library/View/IconButton';
import {space} from '../../Library/Style/layout';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IconNameType} from '../../Library/Type/IconNameType';
import {UserPrefEvent} from '../../Event/UserPrefEvent';
import {AppIPC} from '../../../IPC/AppIPC';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {DraggableHeader} from '../../Library/View/DraggableHeader';
import {AppEvent} from '../../Event/AppEvent';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';

type Props = {
}

type State = {
  notification: boolean;
  showKeyboardShortcuts: boolean;
}

export class SideHeaderFragment extends React.Component<Props, State> {
  state: State = {
    notification: true,
    showKeyboardShortcuts: false,
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

  private handleShowJumpNavigation() {
    AppEvent.emitJumpNavigation();
  }

  private handleKeyboardShortcuts() {
    if (this.state.showKeyboardShortcuts) {
      BrowserViewIPC.hide(false);
      this.setState({showKeyboardShortcuts: false});
    } else {
      BrowserViewIPC.hide(true);
      this.setState({showKeyboardShortcuts: true});
    }
  }

  render() {
    const icon: IconNameType = this.state.notification ? 'bell-outline' : 'bell-off-outline';

    return (
      <Root>
        <IconButton
          name='keyboard-outline'
          onClick={() => this.handleKeyboardShortcuts()}
          title={`Keyboard Shortcuts`}
        />

        <IconButton
          name='magnify'
          onClick={() => this.handleShowJumpNavigation()}
          title={`Jump Navigation (${PlatformUtil.select('⌘', 'Ctrl')} K)`}
        />

        <IconButton
          name={icon}
          onClick={() => this.handleToggleNotification()}
          title={`Toggle Notification On/Off (${PlatformUtil.select('⌘', 'Ctrl')} I)`}
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

