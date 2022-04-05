import React from 'react';
import {Link} from '../../../Library/View/Link';
import {font, space} from '../../../Library/Style/layout';
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
}

type State = {
  accessTokenType: 'oauth' | 'pat' | null;
  oauthCode: RemoteOauthCode | null;
  oauthCodeLoading: boolean;
  oauthAccessTokenLoading: boolean;
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
  error?: 'authorization_pending' | string;
  error_description?: string;
  error_uri?: string;
}

export class PrefSetupAccessToken extends React.Component<Props, State> {
  state: State = {
    accessTokenType: null,
    oauthCode: null,
    oauthCodeLoading: false,
    oauthAccessTokenLoading: false,
  }

  private async startOauth() {
    this.setState({accessTokenType: 'oauth'});

    // oauth code
    this.setState({oauthCodeLoading: true});
    const {error: e1, oauthCode} = await this.loadOauthCode();
    if (e1) {
      // todo
      this.setState({oauthCodeLoading: false});
      console.error(e1);
      return;
    }
    await new Promise((resolve) => {
      this.setState({oauthCode, oauthCodeLoading: false}, () => resolve());
    });

    // oauth access token
    this.setState({oauthAccessTokenLoading: true});
    const {error: e2, accessToken} = await this.loadOauthAccessToken();
    if (e2) {
      // todo
      this.setState({oauthCode: null, oauthAccessTokenLoading: false});
      console.error(e2);
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
      if (res.error) {
        // todo
      }

      expiresIn -= this.state.oauthCode.interval;
      await TimerUtil.sleep(this.state.oauthCode.interval * 1000);
    }
  }

  render() {
    return (
      <PrefSetupBody style={{display: this.props.visible ? undefined : 'none'}}>
        <PrefSetupSlimDraggableHeader/>
        <div style={{display: this.props.githubType === 'github' ? undefined : 'none'}}>
          <ClickView onClick={() => this.startOauth()}>Use OAuth</ClickView>
          or
        </div>

        <ClickView onClick={() => this.setState({accessTokenType: 'pat', oauthCode: null})}>
          Use Personal Access Token
        </ClickView>

        {this.renderOauth()}
        {this.renderPat()}
      </PrefSetupBody>
    );
  }

  private renderOauth() {
    if (this.state.accessTokenType !== 'oauth') return null;

    if (this.state.oauthCodeLoading) {
      return (
        <Loading show={this.state.oauthCodeLoading}/>
      );
    }

    return (
      <div>
        <div>Access <Link url={this.state.oauthCode.verification_uri}>{this.state.oauthCode.verification_uri}</Link> and enter <span>{this.state.oauthCode.user_code}</span></div>
        {this.state.oauthAccessTokenLoading && (
          <div>waiting verification...</div>
        )}
      </div>
    );
  }

  private renderPat() {
    if (this.state.accessTokenType !== 'pat') return null;

    const scopes = 'repo,read:org,notifications,user';
    const description = 'Jasper'
    const url = `http${this.props.https ? 's' : ''}://${this.props.webHost}/settings/tokens/new?scopes=${scopes}&description=${description}`;

    return (
      <div>
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
      </div>
    );
  }
}

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
