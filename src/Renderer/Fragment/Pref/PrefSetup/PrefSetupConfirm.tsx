import React from 'react';
import {Loading} from '../../../Library/View/Loading';
import {View} from '../../../Library/View/View';
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
import {mc, Translate} from '../../../Library/View/Translate';

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
            <Translate onMessage={mc => mc.prefSetup.confirm.error.network}/>
            <Link onClick={() => this.handleOpenGitHubCheckAccess()}><Translate onMessage={mc => mc.prefSetup.confirm.error.openGitHub}/></Link>
          </View>
        );
        testMessageView = <Translate onMessage={mc => mc.prefSetup.confirm.error.fail}/>;
        break;
      case 'scopeError':
        testFailView = (
          <View>
            <Translate
              onMessage={mc => mc.prefSetup.confirm.error.scope}
              values={{
                repo: <PrefSetupScopeName>repo</PrefSetupScopeName>,
                user: <PrefSetupScopeName>user</PrefSetupScopeName>,
                notifications: <PrefSetupScopeName>notifications</PrefSetupScopeName>,
                readOrg: <PrefSetupScopeName>read:org</PrefSetupScopeName>,
              }}
            />
            <Link onClick={() => this.handleOpenGitHubScopeSettings()}><Translate onMessage={mc => mc.prefSetup.confirm.error.openSetting}/></Link>
          </View>
        );
        testMessageView = <Translate onMessage={mc => mc.prefSetup.confirm.error.fail}/>;
        break;
      case 'success':
        testMessageView = <Translate onMessage={mc => mc.prefSetup.confirm.success} values={{user: this.state.loginName}}/>;
        break;
    }

    return (
      <PrefSetupBody style={{display: this.props.visible ? undefined : 'none'}}>
        <PrefSetupSlimDraggableHeader/>
        <PrefSetupBodyLabel><Translate onMessage={mc => mc.prefSetup.confirm.host}/></PrefSetupBodyLabel>
        <TextInput value={this.props.host} onChange={this.props.onChangeHost}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel><Translate onMessage={mc => mc.prefSetup.confirm.accessToken}/></PrefSetupBodyLabel>
        <TextInput value={this.props.accessToken} onChange={this.props.onChangeAccessToken} secure={true}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel><Translate onMessage={mc => mc.prefSetup.confirm.pathPrefix}/></PrefSetupBodyLabel>
        <TextInput value={this.props.pathPrefix} onChange={this.props.onChangePathPrefix}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel><Translate onMessage={mc => mc.prefSetup.confirm.webHost}/></PrefSetupBodyLabel>
        <TextInput value={this.props.webHost} onChange={this.props.onChangeWebHost}/>
        <PrefSetupSpace/>

        <PrefSetupBodyLabel><Translate onMessage={mc => mc.prefSetup.confirm.browser}/></PrefSetupBodyLabel>
        <Select<UserPrefEntity['general']['browser']>
          value={this.props.browser}
          items={[{label: mc().prefSetup.confirm.builtin, value: 'builtin'}, {label: mc().prefSetup.confirm.external, value: 'external'}]}
          onSelect={this.props.onChangeBrowser}
        />
        <PrefSetupSpace/>

        <CheckBox
          checked={this.props.https}
          onChange={this.props.onChangeHttps}
          label={mc().prefSetup.confirm.https}
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
