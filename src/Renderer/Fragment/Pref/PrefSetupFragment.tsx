import React from 'react';
import styled from 'styled-components';
import {border, space} from '../../Library/Style/layout';
import {UserPrefEntity} from '../../Library/Type/UserPrefEntity';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';
import {ClickView} from '../../Library/View/ClickView';
import {Modal} from '../../Library/View/Modal';
import {PrefSetupGitHubHost} from './PrefSetup/PrefSetupGitHubHost';
import {PrefSetupAccessToken} from './PrefSetup/PrefSetupAccessToken';
import {PrefSetupConfirm} from './PrefSetup/PrefSetupConfirm';
import {RemoteUserEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';

type Props = {
  show: boolean;
  onClose: (github?: UserPrefEntity['github'], browser?: UserPrefEntity['general']['browser']) => void;
  showImportData?: boolean;
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
  }

  private handleConfirmFinish(user: RemoteUserEntity, gheVersion: string) {
    const github: UserPrefEntity['github'] = {
      accessToken: this.state.accessToken,
      host: this.state.host,
      https: this.state.https,
      webHost: this.state.webHost,
      pathPrefix: this.state.pathPrefix,
      interval: 10,
      user: {login: user.login, avatar_url: user.avatar_url, name: user.name},
      gheVersion,
    };

    this.props.onClose(github, this.state.browser);
  }

  private handleSelectGitHubCom() {
    this.setState({step: 'accessToken', githubType: 'github', host: 'api.github.com', webHost: 'github.com', https: true, pathPrefix: ''});
  }

  private handleSelectGHE() {
    this.setState({githubType: 'ghe', host: 'ghe.example.com'});
  }

  private handleInputGHEHost(host: string) {
    this.setState({host, webHost: host, pathPrefix: '/api/v3/'});
  }

  private handleClose() {
    this.props.onClose();
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
      </Side>
    );
  }

  renderGitHubHost() {
    return (
      <PrefSetupGitHubHost
        visible={this.state.step === 'githubHost'}
        githubType={this.state.githubType}
        host={this.state.host}
        https={this.state.https}
        showImportData={this.props.showImportData}
        onSelectGitHubCom={() => this.handleSelectGitHubCom()}
        onSelectGHE={() => this.handleSelectGHE()}
        onChangeGHEHost={(host) => this.handleInputGHEHost(host)}
        onChangeHTTPS={(https) => this.setState({https})}
        onFinishGHE={() =>  this.state.host && this.setState({step: 'accessToken'})}
      />
    );
  }

  renderAccessToken() {
    return (
      <PrefSetupAccessToken
        visible={this.state.step === 'accessToken'}
        githubType={this.state.githubType}
        https={this.state.https}
        webHost={this.state.webHost}
        accessToken={this.state.accessToken}
        onChangeAccessToken={(accessToken) => this.setState({accessToken})}
        onFinish={() => this.state.accessToken && this.setState({step: 'confirm'})}
      />
    );
  }

  renderConfirm() {
    return (
      <PrefSetupConfirm
        visible={this.state.step === 'confirm'}
        https={this.state.https}
        webHost={this.state.webHost}
        host={this.state.host}
        accessToken={this.state.accessToken}
        pathPrefix={this.state.pathPrefix}
        browser={this.state.browser}
        onChangeHost={host => this.setState({host})}
        onChangeHttps={https => this.setState({https})}
        onChangePathPrefix={pathPrefix => this.setState({pathPrefix})}
        onChangeAccessToken={accessToken => this.setState({accessToken})}
        onChangeWebHost={webHost => this.setState({webHost})}
        onChangeBrowser={browser => this.setState({browser})}
        onFinish={(user, gheVersion) => this.handleConfirmFinish(user, gheVersion)}
      />
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
