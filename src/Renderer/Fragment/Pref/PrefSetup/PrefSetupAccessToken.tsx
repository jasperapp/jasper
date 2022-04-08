import React, {CSSProperties} from 'react';
import {clipboard} from 'electron';
import {Link} from '../../../Library/View/Link';
import {border, font, space} from '../../../Library/Style/layout';
import {Text} from '../../../Library/View/Text';
import {TextInput} from '../../../Library/View/TextInput';
import {Button} from '../../../Library/View/Button';
import {PrefSetupBody, PrefSetupBodyLabel, PrefSetupRow, PrefSetupScopeName, PrefSetupSlimDraggableHeader, PrefSetupSpace} from './PrefSetupCommon';
import styled from 'styled-components';
import {appTheme} from '../../../Library/Style/appTheme';
import {View} from '../../../Library/View/View';
import {Image} from '../../../Library/View/Image';
import {ClickView} from '../../../Library/View/ClickView';
import {Loading} from '../../../Library/View/Loading';
import {fetchw} from '../../../Library/Infra/fetchw';
import {TimerUtil} from '../../../Library/Util/TimerUtil';

type Props = {
  visible: boolean;
  githubType: 'github' | 'ghe';
  https: boolean;
  webHost: string;
  accessToken: string;
  onChangeAccessToken: (accessToken: string) => void;
  onFinish: () => void;
  style?: CSSProperties;
}

type State = {
  accessTokenType: 'oauth' | 'pat' | null;
  oauthCode: RemoteOauthCode | null;
  oauthCodeLoading: boolean;
  oauthAccessTokenLoading: boolean;
  oauthError: Error | null;
  isShowSuccessCopyLabel: boolean;
}

type RemoteOauthCode = {
  verification_uri: string;
  user_code: string;
  device_code: string;
  expires_in: number;
  interval: number;
}

type RemoteOauthAccessToken = {
  access_token?: string;
  token_type?: 'bearer';
  scope?: string;
  error?: 'authorization_pending' | 'slow_down' | 'expired_token' | 'unsupported_grant_type' | 'incorrect_client_credentials' | 'incorrect_device_code' | 'access_denied' | 'device_flow_disabled' | string;
  error_description?: string;
  error_uri?: string;
  interval?: number;
}

export class PrefSetupAccessToken extends React.Component<Props, State> {
  state: State = {
    accessTokenType: null,
    oauthCode: null,
    oauthCodeLoading: false,
    oauthAccessTokenLoading: false,
    oauthError: null,
    isShowSuccessCopyLabel: false,
  }

  private async startOauth() {
    this.setState({accessTokenType: 'oauth', oauthError: null});

    // oauth code
    this.setState({oauthCodeLoading: true});
    const {error: e1, oauthCode} = await this.loadOauthCode();
    if (e1) {
      this.setState({oauthCodeLoading: false, oauthError: e1});
      return;
    }
    await new Promise((resolve) => {
      this.setState({oauthCode, oauthCodeLoading: false}, () => resolve());
    });

    // oauth access token
    const {error: e2, accessToken} = await this.loadOauthAccessToken();
    if (e2) {
      this.setState({oauthAccessTokenLoading: false, oauthError: e2});
      return;
    }
    this.setState({oauthAccessTokenLoading: false});

    // finish
    this.props.onChangeAccessToken(accessToken);
    this.props.onFinish();
  }

  private async loadOauthCode(): Promise<{error?: Error; oauthCode?: RemoteOauthCode}> {
    const {error, res} = await fetchw<RemoteOauthCode>('https://github.com/login/device/code', {
      method: 'post',
      headers: {Accept: 'application/json'},
      body: {
        'client_id': '9fff174944ae52586478',
        'scope': 'user,repo,notifications,read:org',
      },
    });

    if (error) {
      return {error};
    } else {
      return {oauthCode: res};
    }
  }

  private async loadOauthAccessToken(): Promise<{error?: Error; accessToken?: string}> {
    let expiresIn = this.state.oauthCode.expires_in;
    const deviceCode = this.state.oauthCode.device_code;

    while (1) {
      if (expiresIn < 0) return {error: new Error('expired')};
      if (deviceCode !== this.state.oauthCode?.device_code) return;

      const {error, res} = await fetchw<RemoteOauthAccessToken>('https://github.com/login/oauth/access_token', {
        method: 'post',
        headers: {Accept: 'application/json'},
        body: {
          'client_id': '9fff174944ae52586478',
          'device_code': this.state.oauthCode.device_code,
          'grant_type': 'urn:ietf:params:oauth:grant-type:device_code'
        },
      });
      if (error) return {error};
      if (res.access_token != null) return {accessToken: res.access_token};
      if (res.error != null) {
        const {stop} = this.handleOauthAccessTokenError(res);
        if (stop) return {error: new Error(res.error_description)};
      }

      expiresIn -= this.state.oauthCode.interval;
      await TimerUtil.sleep(this.state.oauthCode.interval * 1000);
    }
  }

  private handleOauthAccessTokenError(res: RemoteOauthAccessToken): {stop: boolean} {
    if (res.error == null) return {stop: false};

    switch (res.error) {
      case 'authorization_pending':
        return {stop: false};
      case 'slow_down':
        const interval = res.interval ?? this.state.oauthCode.interval ?? 5;
        this.setState({oauthCode: {...this.state.oauthCode, interval}});
        return {stop: false};
      case 'expired_token':
      case 'unsupported_grant_type':
      case 'incorrect_client_credentials':
      case 'incorrect_device_code':
      case 'access_denied':
      case 'device_flow_disabled':
      default:
        return {stop: true};
    }
  }

  private startPat() {
    this.setState({accessTokenType: 'pat', oauthCode: null, oauthCodeLoading: false, oauthAccessTokenLoading: false, isShowSuccessCopyLabel: false});
  }

  private handleOauthVerificationUrl(defaultOnClick: () => void) {
    this.setState({oauthAccessTokenLoading: true});
    defaultOnClick();
  }

  private async handleCopyOauthUserCode() {
    await clipboard.writeText(this.state.oauthCode.user_code);
    this.setState({isShowSuccessCopyLabel: true});
    await TimerUtil.sleep(3000);
    this.setState({isShowSuccessCopyLabel: false});
  }

  render() {
    return (
      <PrefSetupBody style={{display: this.props.visible ? undefined : 'none', ...(this.props.style ?? {})}}>
        <PrefSetupSlimDraggableHeader/>

        <Content style={{display: this.props.githubType === 'github' ? undefined : 'none'}}>
          <Header onClick={() => this.startOauth()}>
            Use OAuth (recommended)
          </Header>
          {this.renderOauth()}
        </Content>

        <Content>
          <Header onClick={() => this.startPat()}>
            Use Personal Access Token
          </Header>
          {this.renderPat()}
        </Content>
      </PrefSetupBody>
    );
  }

  private renderOauth() {
    if (this.state.accessTokenType !== 'oauth') return null;

    if (this.state.oauthCodeLoading || this.state.oauthCode == null) {
      return (
        <Body>
          <Loading show={this.state.oauthCodeLoading}/>
        </Body>
      );
    }

    return (
      <Body>
        <div>Access <Link onClick={(defaultOnClick) => this.handleOauthVerificationUrl(defaultOnClick)} url={this.state.oauthCode.verification_uri}>{this.state.oauthCode.verification_uri}</Link> and enter the code.</div>
        <OauthUserCodeRow>
          <OauthUserCode>{this.state.oauthCode.user_code}</OauthUserCode>
          <OauthUserCodeCopyButton onClick={()=> this.handleCopyOauthUserCode()}>Copy code</OauthUserCodeCopyButton>
          {this.state.isShowSuccessCopyLabel && (
            <span style={{marginLeft: space.small}}>success copy.</span>
          )}
        </OauthUserCodeRow>
        <Loading show={this.state.oauthAccessTokenLoading}/>
        {this.state.oauthError != null && (
          <OauthErrorMessage>{this.state.oauthError.message}</OauthErrorMessage>
        )}
      </Body>
    );
  }

  private renderPat() {
    if (this.state.accessTokenType !== 'pat' && this.props.githubType !== 'ghe') return null;

    const scopes = 'repo,read:org,notifications,user';
    const description = 'Jasper'
    const url = `http${this.props.https ? 's' : ''}://${this.props.webHost}/settings/tokens/new?scopes=${scopes}&description=${description}`;

    return (
      <Body>
        <PrefSetupBodyLabel>Please enter your <Link url={url} style={{padding: `0 ${space.small2}px`}}>personal-access-token</Link> of GitHub.</PrefSetupBodyLabel>
        <Text style={{fontSize: font.small}}>GitHub → Settings → Developer settings → Personal access tokens → Generate new token</Text>
        <PrefSetupRow>
          <TextInput
            style={{marginRight: space.medium}}
            value={this.props.accessToken}
            onChange={t => this.props.onChangeAccessToken(t)}
            onEnter={this.props.onFinish}
          />
          <Button onClick={this.props.onFinish}>OK</Button>
        </PrefSetupRow>

        <PrefSetupSpace/>

        <Text>Jasper requires <PrefSetupScopeName>repo</PrefSetupScopeName>, <PrefSetupScopeName>user</PrefSetupScopeName>, <PrefSetupScopeName>notifications</PrefSetupScopeName> and <PrefSetupScopeName>read:org</PrefSetupScopeName> scopes.</Text>
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
}

const Content = styled.div`
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: ${space.large}px;
`;

const Header = styled(ClickView)`
  background-color: ${() => appTheme().bg.third};
  padding: ${space.medium}px;
`;

const Body = styled.div`
  padding: ${space.medium}px;
`;

const OauthUserCodeRow = styled.div`
  display: flex;
  align-items: center;
  margin: ${space.small}px 0;
`;

const OauthUserCode = styled.span`
  background-color: ${() => appTheme().bg.third};
  padding: ${space.medium}px;
  margin-right: ${space.medium}px;
  border-radius: 4px;
  user-select: text;
`;

const OauthUserCodeCopyButton = styled(Button)`
  display: inline-block;
`;

const OauthErrorMessage = styled.div`
  color: ${() => appTheme().text.error};
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
