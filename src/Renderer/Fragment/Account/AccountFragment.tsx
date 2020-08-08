import React from 'react';
import {LibraryStreamEvent} from '../../Event/LibraryStreamEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {AccountEvent} from '../../Event/AccountEvent';
import {TimerUtil} from '../../Util/TimerUtil';
import {GARepo} from '../../Repository/GARepo';
import {GitHubClient} from '../../Infra/GitHubClient';
import {ConfigRepo} from '../../Repository/ConfigRepo';
import {StreamPolling} from '../../Infra/StreamPolling';
import {DBSetup} from '../../Infra/DBSetup';
import {StreamSetup} from '../../Infra/StreamSetup';
import {AppFragmentEvent} from '../../Event/AppFragmentEvent';
import {RemoteUserEntity} from '../../Type/RemoteIssueEntity';
import {UserIcon} from '../../Component/UserIcon';
import {color} from '../../Style/color';
import {border, fontWeight, icon, space} from '../../Style/layout';
import styled from 'styled-components';
import {appTheme} from '../../Style/appTheme';
import {TouchView} from '../../Component/TouchView';
import {View} from '../../Component/VIew';
import {Icon} from '../../Component/Icon';
import {Text} from '../../Component/Text';

type Props = {
}

type State = {
  avatars: {loginName: string; avatar: string}[];
  activeIndex: number;
}

export class AccountFragment extends React.Component<Props, State> {
  state: State = {
    avatars: [],
    activeIndex: ConfigRepo.getIndex()
  };

  componentDidMount() {
    this.fetchGitHubIcons();
    AccountEvent.onCreateAccount(this, () => this.fetchGitHubIcons);
  }

  componentWillUnmount() {
    AccountEvent.offAll(this);
  }

  private async fetchGitHubIcons() {
    const avatars: State['avatars'] = [];
    for (const config of ConfigRepo.getConfigs()) {
      const github = config.github;
      const client = new GitHubClient(github.accessToken,github.host, github.pathPrefix, github.https);
      const response = await client.request('/user');
      const body = response.body as RemoteUserEntity;
      avatars.push({loginName: body.login, avatar: body.avatar_url});
    }

    this.setState({avatars});
  }

  private async switchConfig(index) {
    // hack: dom
    document.body.style.opacity = '0.3';

    this.setState({activeIndex: index});

    await StreamPolling.stop();

    const {error} = await ConfigRepo.switchConfig(index);
    if (error) return console.error(error);

    await DBSetup.exec(index);
    await StreamSetup.exec();
    StreamPolling.start();

    LibraryStreamEvent.emitSelectFirstStream();
    StreamEvent.emitRestartAllStreams();
    SystemStreamEvent.emitRestartAllStreams();

    await TimerUtil.sleep(100);
    document.body.style.opacity = '1';

    GARepo.eventAccountSwitch();
  }

  private handleOpenCreateSetting() {
    AppFragmentEvent.emitShowConfigSetup();
  }

  render() {
    return (
      <Root>
        <Label>
          <Text style={{flex: 1, fontWeight: fontWeight.softBold, color: appTheme().textSoftColor}}>ACCOUNTS</Text>
          <TouchView onTouch={() => this.handleOpenCreateSetting()}>
            <Icon name='plus' title='add account'/>
          </TouchView>
        </Label>
        <UserIcons>
          {this.renderUserIcons()}
        </UserIcons>
      </Root>
    );
  }

  private renderUserIcons() {
    return this.state.avatars.map((avatar, index) => {
      const style = this.state.activeIndex === index ? {borderColor: color.orange} : {};
      return (
        <UserIconWrap style={style} key={index} onTouch={() => this.switchConfig(index)}>
          <UserIcon userName={avatar.loginName} iconUrl={avatar.avatar} size={icon.medium}/>
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

const UserIconWrap = styled(TouchView)`
  margin-right: ${space.small}px;
  border: solid ${border.large2}px ${appTheme().borderColor};
  border-radius: 100%;
`;
