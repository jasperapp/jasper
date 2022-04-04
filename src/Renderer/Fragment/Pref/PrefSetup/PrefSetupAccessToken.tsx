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

type Props = {
  visible: boolean;
  https: boolean;
  webHost: string;
  accessToken: string;
  onChangeAccessToken: (accessToken: string) => void;
  onFinish: () => void;
}

type State = {
}

export class PrefSetupAccessToken extends React.Component<Props, State> {
  render() {
    const scopes = 'repo,read:org,notifications,user';
    const description = 'Jasper'
    const url = `http${this.props.https ? 's' : ''}://${this.props.webHost}/settings/tokens/new?scopes=${scopes}&description=${description}`;

    return (
      <PrefSetupBody style={{display: this.props.visible ? undefined : 'none'}}>
        <PrefSetupSlimDraggableHeader/>
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
      </PrefSetupBody>
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
