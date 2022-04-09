import React from 'react';
import {Loading} from '../../../Library/View/Loading';
import {View} from '../../../Library/View/View';
import {Text} from '../../../Library/View/Text';
import {Link} from '../../../Library/View/Link';
import {TextInput} from '../../../Library/View/TextInput';
import {Select} from '../../../Library/View/Select';
import {UserPrefEntity} from '../../../Library/Type/UserPrefEntity';
import {CheckBox} from '../../../Library/View/CheckBox';
import {Button} from '../../../Library/View/Button';
import {MainWindowIPC} from '../../../../IPC/MainWindowIPC';
import {GitHubUserClient} from '../../../Library/GitHub/GitHubUserClient';
import {isValidScopes} from '../../../Repository/UserPrefRepo';
import {TimerUtil} from '../../../Library/Util/TimerUtil';
import {PrefSetupBody, PrefSetupBodyLabel, PrefSetupRow, PrefSetupScopeName, PrefSetupSlimDraggableHeader, PrefSetupSpace} from './PrefSetupCommon';
import {ShellUtil} from '../../../Library/Util/ShellUtil';
import {RemoteUserEntity} from '../../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';

type Props = {
  visible: boolean;
  https: boolean;
  webHost: string;
  host: string;
  accessToken: string;
  pathPrefix: string;
  browser: UserPrefEntity['general']['browser'];
  onChangeHost: (host: string) => void;
  onChangeHttps: (https: boolean) => void;
  onChangePathPrefix: (pathPrefix: string) => void;
  onChangeAccessToken: (accessToken: string) => void;
  onChangeWebHost: (webHost: string) => void;
  onChangeBrowser: (browser: UserPrefEntity['general']['browser']) => void;
  onFinish: (user: RemoteUserEntity, gheVersion: string) => void;
}

type State = {
  connectionTestStatus: 'wait' | 'loading' | 'scopeError' | 'networkError' | 'success';
  loginName: string;
}

export class PrefSetupConfirm extends React.Component<Props, State> {
  state: State = {
    connectionTestStatus: 'wait',
    loginName: '',
  }

  private lock: boolean;

  private async handleOpenGitHubCheckAccess() {
    await MainWindowIPC.openNewWindow(`http${this.props.https ? 's' : ''}://${this.props.webHost}`);
    await this.handleConnectionTest();
  }

  private handleOpenGitHubScopeSettings() {
    const url = `http${this.props.https ? 's' : ''}://${this.props.webHost}/settings/tokens`;
    ShellUtil.openExternal(url);
  }

  private async handleConnectionTest() {
    if (!this.props.host) return;
    if (!this.props.accessToken) return;
    if (!this.props.webHost) return;
    if (this.lock) return;

    this.lock = true;
    this.setState({connectionTestStatus: 'loading'});

    // connection
    const client = new GitHubUserClient(this.props.accessToken, this.props.host, this.props.pathPrefix, this.props.https);
    const {user, error, githubHeader} = await client.getUser();
    this.lock = false;

    // error
    if (error) {
      this.setState({connectionTestStatus: 'networkError'});
      console.error(error);
      return;
    }

    if (!isValidScopes(githubHeader.scopes)) {
      this.setState({connectionTestStatus: 'scopeError'});
      return;
    }

    // finish
    this.setState({connectionTestStatus: 'success', loginName: user.login});
    await TimerUtil.sleep(1000);
    this.props.onFinish(user, githubHeader.gheVersion);

    // const github: UserPrefEntity['github'] = {
    //   accessToken: this.state.accessToken,
    //   host: this.state.host,
    //   https: this.state.https,
    //   webHost: this.state.webHost,
    //   pathPrefix: this.state.pathPrefix,
    //   interval: 10,
    //   user: null,
    //   gheVersion: null,
    // };
    //
    // this.props.onClose(github, this.state.browser);
  }

  render() {
    let loadingView;
    let testFailView;
    let testMessageView;

    switch (this.state.connectionTestStatus) {
      case 'loading':
        loadingView = <Loading show={true}/>;
        break;
      case 'networkError':
        testFailView = (
          <View>
            <Text>Fail requesting to GitHub/GHE. Please check settings, network, VPN, ssh-proxy and more.</Text>
            <Link onClick={() => this.handleOpenGitHubCheckAccess()}>Open GitHub/GHE to check access</Link>
          </View>
        );
        testMessageView = <Text>connection fail</Text>;
        break;
      case 'scopeError':
        testFailView = (
          <View>
            <Text>Jasper requires <PrefSetupScopeName>repo</PrefSetupScopeName>, <PrefSetupScopeName>user</PrefSetupScopeName>, <PrefSetupScopeName>notifications</PrefSetupScopeName> and <PrefSetupScopeName>read:org</PrefSetupScopeName> scopes.</Text>
            Please enable those scopes at GitHub/GHE site.
            <Link onClick={() => this.handleOpenGitHubScopeSettings()}>Open Settings</Link>
          </View>
        );
        testMessageView = <Text>connection fail</Text>;
        break;
      case 'success':
        testMessageView = <Text>Hello {this.state.loginName}</Text>;
        break;
    }

    return (
      <PrefSetupBody style={{display: this.props.visible ? undefined : 'none'}}>
        <PrefSetupSlimDraggableHeader/>
        <PrefSetupBodyLabel>API Host</PrefSetupBodyLabel>
        <TextInput value={this.props.host} onChange={this.props.onChangeHost}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel>Access Token</PrefSetupBodyLabel>
        <TextInput value={this.props.accessToken} onChange={this.props.onChangeAccessToken} secure={true}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel>Path Prefix</PrefSetupBodyLabel>
        <TextInput value={this.props.pathPrefix} onChange={this.props.onChangePathPrefix}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel>Web Host</PrefSetupBodyLabel>
        <TextInput value={this.props.webHost} onChange={this.props.onChangeWebHost}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel>Browser</PrefSetupBodyLabel>
        <Select<UserPrefEntity['general']['browser']>
          value={this.props.browser}
          items={[{label: 'Use Built-In Browser', value: 'builtin'}, {label: 'Use External Browser', value: 'external'}]}
          onSelect={this.props.onChangeBrowser}
        />
        <PrefSetupSpace/>

        <CheckBox
          checked={this.props.https}
          onChange={this.props.onChangeHttps}
          label='Use HTTPS'
        />
        <PrefSetupSpace/>

        <PrefSetupRow>
          {loadingView}
          {testMessageView}
          <View style={{flex: 1}}/>
          <Button onClick={() => this.handleConnectionTest()}>OK</Button>
        </PrefSetupRow>

        <PrefSetupSpace/>

        {testFailView}

      </PrefSetupBody>
    );
  }
}
