import React from 'react';
import styled from 'styled-components';
import {space} from '../Style/layout';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {Button} from './Button';
import {TextInput} from './TextInput';
import {CheckBox} from './CheckBox';
import {GitHubClient} from '../Infra/GitHubClient';
import {Timer} from '../../Util/Timer';
import {ConfigType} from '../../Type/ConfigType';
import {AppIPC} from '../../IPC/AppIPC';
import {Link} from './Link';

type Props = {
  onSuccess(github: ConfigType['github']): void
}

type State = {
  step: 'githubHost' | 'accessToken' | 'confirm';
  githubType: 'github' | 'ghe';
  host: string;
  pathPrefix: string;
  webHost: string;
  https: boolean;
  accessToken: string;
  loading: boolean;
  connectionTestMessage: string;
  connectionTestResult: boolean;
}

export class ConfigSetupComponent extends React.Component<Props, State> {
  state: State = {
    step: 'githubHost',
    githubType: null,
    host: '',
    pathPrefix: '',
    webHost: '',
    https: true,
    accessToken: '',
    loading: false,
    connectionTestMessage: '',
    connectionTestResult: null,
  }

  private lock: boolean;

  private async handleOpenGitHubCheckAccess() {
    await AppIPC.openNewWindow(this.state.webHost, this.state.https);
    await this.handleConnectionTest();
  }

  private async handleConnectionTest() {
    if (!this.state.host) return;
    if (!this.state.accessToken) return;
    if (!this.state.webHost) return;
    if (this.lock) return;

    this.lock = true;
    this.setState({loading: true, connectionTestResult: null, connectionTestMessage: 'connection...'});

    // connection
    const client = new GitHubClient(this.state.accessToken, this.state.host, this.state.pathPrefix, this.state.https);
    const {body, error} = await client.request('/user');
    this.lock = false;

    // error
    if (error) {
      this.setState({loading: false, connectionTestResult: false, connectionTestMessage: 'connection fail'});
      console.error(error);
      return;
    }

    // finish
    this.setState({loading: false, connectionTestMessage: `Hello ${body.login}`});
    await Timer.sleep(1000);

    const github: ConfigType['github'] = {
      accessToken: this.state.accessToken,
      host: this.state.host,
      https: this.state.https,
      webHost: this.state.webHost,
      pathPrefix: this.state.pathPrefix,
      interval: 10,
    };

    this.props.onSuccess(github);
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

  render() {
    BrowserViewIPC.hide(true);

    return (
      <Root>
        <Container>
          {this.renderSide()}
          {this.renderGitHubHost()}
          {this.renderAccessToken()}
          {this.renderConfirm()}
        </Container>
      </Root>
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
      </Side>
    );
  }

  renderGitHubHost() {
    const display = this.state.step === 'githubHost' ? null : 'none';
    return (
      <Body style={{display}}>
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
      </Body>
    );
  }

  renderGHE() {
    if (this.state.githubType !== 'ghe') return;

    return (
      <React.Fragment>
        <BodyLabel>Please enter your GitHub Enterprise host.</BodyLabel>
        <TextInput value={this.state.host} onChange={ev => this.handleInputGHEHost(ev.target.value)} placeholder='ghe.example.com'/>
        <Space/>

        <Row>
          <CheckBox checked={this.state.https} onChange={ev => this.setState({https: ev.target.checked})}/>
          <BodyLabel style={{paddingLeft: space.medium}}>Use HTTPS</BodyLabel>
        </Row>
        <Space/>
        <Space/>

        <Button onClick={() => this.state.host && this.setState({step: 'accessToken'})}>OK</Button>
      </React.Fragment>
    );
  }

  renderAccessToken() {
    const display = this.state.step === 'accessToken' ? null : 'none';

    const url = `http${this.state.https ? 's' : ''}://${this.state.webHost}/settings/tokens`;
    return (
      <Body style={{display}}>
        <BodyLabel>Please enter your <Link url={url}>personal-access-token</Link> of GitHub.</BodyLabel>
        <span style={{fontSize: '0.8em'}}>GitHub → Settings → Developer settings → Personal access tokens → Generate new token</span>
        <Row>
          <TextInput
            style={{marginRight: space.medium}}
            value={this.state.accessToken}
            onChange={ev => this.setState({accessToken: ev.target.value})}
            onEnter={() => this.state.accessToken && this.setState({step: 'confirm'})}
          />
          <Button onClick={() => this.state.accessToken && this.setState({step: 'confirm'})}>OK</Button>
        </Row>

        <Space/>

        <div>Jasper requires <code>repo</code> and <code>user</code> scopes.</div>
        <ImageWrap>
          <Image src='../image/token-setting.png'/>
        </ImageWrap>
      </Body>
    );
  }

  renderConfirm() {
    const display = this.state.step === 'confirm' ? null : 'none';

    let loadingView;
    if (this.state.loading) {
      loadingView = (
        <iframe style={{width: 20, height: 20, border: 'none', marginRight: space.medium}} src="./spin.html"/>
      );
    }

    let testFailView;
    if (this.state.connectionTestResult === false) {
      testFailView = (
        <div>
          <div>Fail requesting to GitHub/GHE. Please check settings, network, VPN, ssh-proxy and more.</div>
          <Link onClick={this.handleOpenGitHubCheckAccess.bind(this)}>Open GitHub/GHE to check access</Link>
        </div>
      );
    }

    return (
      <Body style={{display}}>
        <BodyLabel>API Host</BodyLabel>
        <TextInput value={this.state.host} onChange={ev => this.setState({host: ev.target.value})}/>
        <Space/>

        <BodyLabel>Access Token</BodyLabel>
        <TextInput value={this.state.accessToken} onChange={ev => this.setState({accessToken: ev.target.value})}/>
        <Space/>

        <BodyLabel>Path Prefix</BodyLabel>
        <TextInput value={this.state.pathPrefix} onChange={ev => this.setState({pathPrefix: ev.target.value})}/>
        <Space/>

        <BodyLabel>Web Host</BodyLabel>
        <TextInput value={this.state.webHost} onChange={ev => this.setState({webHost: ev.target.value})}/>
        <Space/>

        <Row>
          <CheckBox checked={this.state.https} onChange={ev => this.setState({https: ev.target.checked})}/>
          <BodyLabel style={{paddingLeft: space.medium}}>Use HTTPS</BodyLabel>
        </Row>
        <Space/>

        <Row>
          {loadingView}
          {this.state.connectionTestMessage}
          <div style={{flex: 1}}/>
          <Button onClick={() => this.handleConnectionTest()}>OK</Button>
        </Row>

        <Space/>

        {testFailView}

      </Body>
    );
  }
}

const Root = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: #00000088;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Container = styled.div`
  background-color: #ffffff;
  width: calc(100vw - 40px);
  height: calc(100vh - 40px);
  display: flex;
  border-radius: 4px;
  overflow: hidden;
`;

// side
const Side = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #eee;
  width: 200px;
`;

const SideRow = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: ${space.medium}px;
  
  &.active {
    background-color: #ddd;
  }
`;

// body
const Body = styled.div`
  flex: 1;
  padding: ${space.large}px;
  max-width: 600px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const BodyLabel = styled.div`
  padding-right: ${space.medium}px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Space = styled.div`
  height: ${space.large}px;
`;

const ImageWrap = styled.div`
  border: 1px solid #888;
  border-radius: 4px;
  overflow: scroll;
`;

const Image = styled.img`
  width: 100%;
`;
