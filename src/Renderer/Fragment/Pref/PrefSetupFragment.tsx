import React from 'react';
import styled from 'styled-components';
import {border, font, fontWeight, space} from '../../Library/Style/layout';
import {Button} from '../../Library/View/Button';
import {TextInput} from '../../Library/View/TextInput';
import {CheckBox} from '../../Library/View/CheckBox';
import {TimerUtil} from '../../Library/Util/TimerUtil';
import {UserPrefEntity} from '../../Library/Type/UserPrefEntity';
import {MainWindowIPC} from '../../../IPC/MainWindowIPC';
import {Link} from '../../Library/View/Link';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';
import {ClickView} from '../../Library/View/ClickView';
import {Image} from '../../Library/View/Image';
import {Text} from '../../Library/View/Text';
import {Select} from '../../Library/View/Select';
import {GitHubUserClient} from '../../Library/GitHub/GitHubUserClient';
import {DraggableHeader} from '../../Library/View/DraggableHeader';
import {Modal} from '../../Library/View/Modal';
import {isValidScopes} from '../../Repository/UserPrefRepo';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {UserPrefIPC} from '../../../IPC/UserPrefIPC';
import {shell} from 'electron';

type Props = {
  show: boolean;
  closable?: boolean;
  onClose: (github?: UserPrefEntity['github'], browser?: UserPrefEntity['general']['browser']) => void;
}

type State = {
  step: 'githubHost' | 'accessToken' | 'confirm';
  githubType: 'github' | 'ghe';
  host: string;
  pathPrefix: string;
  webHost: string;
  https: boolean;
  accessToken: string;
  browser: UserPrefEntity['general']['browser'];
  connectionTestStatus: 'wait' | 'loading' | 'scopeError' | 'networkError' | 'success';
  loginName: string;
  showImportDataDesc: boolean;
}

export class PrefSetupFragment extends React.Component<Props, State> {
  state: State = {
    step: 'githubHost',
    githubType: null,
    host: '',
    pathPrefix: '',
    webHost: '',
    https: true,
    accessToken: '',
    browser: 'builtin',
    connectionTestStatus: 'wait',
    loginName: '',
    showImportDataDesc: false,
  }

  private lock: boolean;

  private async handleOpenGitHubCheckAccess() {
    await MainWindowIPC.openNewWindow(`http${this.state.https ? 's' : ''}://${this.state.webHost}`);
    await this.handleConnectionTest();
  }

  private handleOpenGitHubScopeSettings() {
    const url = `http${this.state.https ? 's' : ''}://${this.state.webHost}/settings/tokens`;
    ShellUtil.openExternal(url);
  }

  private async handleConnectionTest() {
    if (!this.state.host) return;
    if (!this.state.accessToken) return;
    if (!this.state.webHost) return;
    if (this.lock) return;

    this.lock = true;
    this.setState({connectionTestStatus: 'loading'});

    // connection
    const client = new GitHubUserClient(this.state.accessToken, this.state.host, this.state.pathPrefix, this.state.https);
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

    const github: UserPrefEntity['github'] = {
      accessToken: this.state.accessToken,
      host: this.state.host,
      https: this.state.https,
      webHost: this.state.webHost,
      pathPrefix: this.state.pathPrefix,
      interval: 10,
    };

    this.props.onClose(github, this.state.browser);
  }

  private handleSelectGitHubCom() {
    this.setState({step: 'accessToken', githubType: 'github', host: 'api.github.com', webHost: 'github.com', https: true});
  }

  private handleSelectGHE() {
    this.setState({githubType: 'ghe'});
  }

  private handleInputGHEHost(host: string) {
    this.setState({host, webHost: host, pathPrefix: '/api/v3/'});
  }

  private handleClose() {
    this.props.onClose();
  }

  private async handleOpenDataDir() {
    const {userPrefPath} = await UserPrefIPC.getEachPaths();
    shell.showItemInFolder(userPrefPath);
  }

  private handleRestart() {
    MainWindowIPC.reload();
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={() => this.handleClose()} style={{padding: 0}} draggable={true}>
        <Root>
          {this.renderSide()}
          {this.renderGitHubHost()}
          {this.renderAccessToken()}
          {this.renderConfirm()}
        </Root>
      </Modal>
    );
  }

  renderSide() {
    return (
      <Side>
        <SideRow
          className={this.state.step === 'githubHost' ? 'active' : ''}
          onClick={() => this.setState({step: 'githubHost'})}
        >
          1. Select GitHub Host
        </SideRow>

        <SideRow
          className={this.state.step === 'accessToken' ? 'active' : ''}
          onClick={() => this.setState({step: 'accessToken'})}
        >
          2. Personal Access Token
        </SideRow>

        <SideRow
          className={this.state.step === 'confirm' ? 'active' : ''}
          onClick={() => this.setState({step: 'confirm'})}
        >
          3. Confirm
        </SideRow>

        <View style={{padding: space.medium, display: this.props.closable ? null : 'none'}}>
          <Button onClick={this.handleClose.bind(this)} style={{width: '100%'}}>Close</Button>
        </View>
      </Side>
    );
  }

  renderGitHubHost() {
    const display = this.state.step === 'githubHost' ? null : 'none';
    return (
      <Body style={{display}}>
        <SlimDraggableHeader/>
        <Row>
          <Button onClick={() => this.handleSelectGitHubCom()} style={{width: 160, marginRight: space.medium}}>GitHub (github.com)</Button>
          Use standard GitHub (github.com).
        </Row>
        <Space/>

        <Row>
          <Button onClick={() => this.handleSelectGHE()} style={{width: 160, marginRight: space.medium}}>GitHub Enterprise</Button>
          Use GitHub Enterprise.
        </Row>
        <Space/>

        {this.renderGHE()}
        {this.renderImportData()}
      </Body>
    );
  }

  renderGHE() {
    if (this.state.githubType !== 'ghe') return;

    return (
      <React.Fragment>
        <BodyLabel>Please enter your GitHub Enterprise host.</BodyLabel>
        <TextInput value={this.state.host} onChange={t => this.handleInputGHEHost(t)} placeholder='ghe.example.com'/>
        <Space/>

        <Row>
          <CheckBox checked={this.state.https} onChange={c => this.setState({https: c})}/>
          <BodyLabel style={{paddingLeft: space.medium}}>Use HTTPS</BodyLabel>
        </Row>
        <Space/>
        <Space/>

        <Button onClick={() => this.state.host && this.setState({step: 'accessToken'})}>OK</Button>
      </React.Fragment>
    );
  }

  renderImportData() {
    let descView;
    if (this.state.showImportDataDesc) {
      descView = (
        <ImportDescRoot>
          <ImportDesc>1. Export existing all data from <ImportDescHighlight>Menu → Jasper → Export Data</ImportDescHighlight> of current Jasper.</ImportDesc>
          <ImportDesc>2. <Link onClick={() => this.handleOpenDataDir()}>Open data directory</Link>.</ImportDesc>
          <ImportDesc>3. Copy existing all data to the data directory.</ImportDesc>
          <ImportDesc>4. <Link onClick={() => this.handleRestart()}>Restart Jasper</Link>.</ImportDesc>
        </ImportDescRoot>
      );
    }

    return (
      <React.Fragment>
        <Space/>
        <View style={{height: border.medium, background: appTheme().border.normal}}/>
        <Space/>
        <Space/>
        <Row>
          <Button onClick={() => this.setState({showImportDataDesc: true})} style={{width: 160, marginRight: space.medium}}>Import Data</Button>
          <Text style={{paddingRight: space.medium}}>Import existing Jasper data.</Text>
          <Link url='https://docs.jasperapp.io/setup/data-transfer'>Help</Link>
        </Row>
        {descView}
      </React.Fragment>
    );
  }

  renderAccessToken() {
    const display = this.state.step === 'accessToken' ? null : 'none';

    const url = `http${this.state.https ? 's' : ''}://${this.state.webHost}/settings/tokens`;
    return (
      <Body style={{display}}>
        <SlimDraggableHeader/>
        <BodyLabel>Please enter your <Link url={url} style={{padding: `0 ${space.small2}px`}}>personal-access-token</Link> of GitHub.</BodyLabel>
        <Text style={{fontSize: font.small}}>GitHub → Settings → Developer settings → Personal access tokens → Generate new token</Text>
        <Row>
          <TextInput
            style={{marginRight: space.medium}}
            value={this.state.accessToken}
            onChange={t => this.setState({accessToken: t})}
            onEnter={() => this.state.accessToken && this.setState({step: 'confirm'})}
          />
          <Button onClick={() => this.state.accessToken && this.setState({step: 'confirm'})}>OK</Button>
        </Row>

        <Space/>

        <Text>Jasper requires <ScopeName>repo</ScopeName>, <ScopeName>user</ScopeName>, <ScopeName>notifications</ScopeName> and <ScopeName>read:org</ScopeName> scopes.</Text>
        <ScopeImages>
          <ScopeImageWrap>
            <ScopeImage source={{url: '../image/scope_repo.png'}}/>
          </ScopeImageWrap>
          <ScopeImageWrap>
            <ScopeImage source={{url: '../image/scope_notifications.png'}}/>
          </ScopeImageWrap>
          <ScopeImageWrap>
            <ScopeImage source={{url: '../image/scope_user.png'}}/>
          </ScopeImageWrap>
          <ScopeImageWrap>
            <ScopeImage source={{url: '../image/scope_readorg.png'}}/>
          </ScopeImageWrap>
        </ScopeImages>
      </Body>
    );
  }

  renderConfirm() {
    const display = this.state.step === 'confirm' ? null : 'none';

    let loadingView;
    let testFailView;
    let testMessageView;

    switch (this.state.connectionTestStatus) {
      case 'loading':
        loadingView = (
          <iframe style={{width: 20, height: 20, border: 'none', marginRight: space.medium}} src="../../asset/html/spin.html"/>
        );
        testMessageView = <Text>connection...</Text>;
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
            <Text>Jasper requires <ScopeName>repo</ScopeName>, <ScopeName>user</ScopeName>, <ScopeName>notifications</ScopeName> and <ScopeName>read:org</ScopeName> scopes.</Text>
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
      <Body style={{display}}>
        <SlimDraggableHeader/>
        <BodyLabel>API Host</BodyLabel>
        <TextInput value={this.state.host} onChange={t => this.setState({host: t})}/>
        <Space/>

        <BodyLabel>Access Token</BodyLabel>
        <TextInput value={this.state.accessToken} onChange={t => this.setState({accessToken: t})}/>
        <Space/>

        <BodyLabel>Path Prefix</BodyLabel>
        <TextInput value={this.state.pathPrefix} onChange={t => this.setState({pathPrefix: t})}/>
        <Space/>

        <BodyLabel>Web Host</BodyLabel>
        <TextInput value={this.state.webHost} onChange={t => this.setState({webHost: t})}/>
        <Space/>

        <BodyLabel>Browser</BodyLabel>
        <Select<UserPrefEntity['general']['browser']>
          value={this.state.browser}
          items={[{label: 'Use Built-In Browser', value: 'builtin'}, {label: 'Use External Browser', value: 'external'}]}
          onSelect={v => this.setState({browser: v})}
        />
        <Space/>

        <CheckBox
          checked={this.state.https}
          onChange={c => this.setState({https: c})}
          label='Use HTTPS'
        />
        <Space/>

        <Row>
          {loadingView}
          {testMessageView}
          <View style={{flex: 1}}/>
          <Button onClick={() => this.handleConnectionTest()}>OK</Button>
        </Row>

        <Space/>

        {testFailView}

      </Body>
    );
  }
}

const Root = styled(View)`
  _position: fixed;
  _left: 0;
  _top: 0;
  background-color: ${() => appTheme().bg.primary};
  _width: 100vw;
  _height: 100vh;
  width: 980px;
  height: 600px;
  _border-radius: 4px;
  _overflow: hidden;
  _z-index: 9999;
  flex-direction: row;
`;

// side
const Side = styled(View)`
  background-color: ${() => appTheme().bg.secondary};
  width: 200px;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  padding-top: ${space.medium}px;
`;

const SideRow = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  padding: ${space.medium}px;

  &.active {
    background-color: ${() => appTheme().bg.primaryHover};
  }
`;

// body
const Body = styled(View)`
  flex: 1;
  padding: 0 ${space.large}px;
  max-width: 600px;
  height: 100%;
`;

const SlimDraggableHeader = styled(DraggableHeader)`
  min-height: ${space.large}px;
`

const BodyLabel = styled(View)`
  padding-right: ${space.medium}px;
  flex-direction: row;
`;

const Row = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const Space = styled(View)`
  height: ${space.large}px;
`;

const ScopeName = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.small}px;
  display: inline-block;
  border-radius: 4px;
`;

const ScopeImages = styled(View)`
  flex-wrap: wrap;
  background: ${() => appTheme().accent.normal};
  margin: ${space.medium2}px 0;
  padding: ${space.large}px;
  border-radius: 4px;
  height: 260px;
  width: 440px;
  align-items: center;
  justify-content: center;
}
`;

const ScopeImageWrap = styled(View)`
  width: 200px;
  padding: ${space.medium}px;
`;

const ScopeImage = styled(Image)`
`;

// import data
const ImportDescRoot = styled(View)`
  padding: ${space.medium}px 0;
`;

const ImportDesc = styled(Text)`
  padding-bottom: ${space.small}px;
`;

const ImportDescHighlight = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.tiny}px ${space.small}px;
  display: inline-block;
  border-radius: 4px;
`;
