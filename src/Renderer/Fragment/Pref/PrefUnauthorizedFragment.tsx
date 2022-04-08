import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {font, space} from '../../Library/Style/layout';
import {ClickView} from '../../Library/View/ClickView';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {PrefSetupAccessToken} from './PrefSetup/PrefSetupAccessToken';

type Props = {
  onRetry: () => void;
}

type State = {
  lang: 'ja' | 'en';
  accessToken: string;
}

export class PrefUnauthorizedFragment extends React.Component<Props, State> {
  state: State = {
    lang: PlatformUtil.getLang(),
    accessToken: '',
  }

  private async handleOK() {
    const pref = UserPrefRepo.getPref();
    pref.github.accessToken = this.state.accessToken;
    await UserPrefRepo.updatePref(pref);
    this.props.onRetry();
  }

  render() {
    const pref = UserPrefRepo.getPref();
    return (
      <Modal show={true} onClose={() => null}>
        <Root>
          <LangRow>
            <ClickView onClick={() => this.setState({lang: 'en'})}><LangLabel>English</LangLabel></ClickView>
            <Text style={{fontSize: font.small, padding: `0 ${space.small}px`}}>/</Text>
            <ClickView onClick={() => this.setState({lang: 'ja'})}><LangLabel>Japanese</LangLabel></ClickView>
          </LangRow>

          <Text style={{display: this.state.lang !== 'ja' ? 'inline' : 'none'}}>
            The access token is not valid.
            <br/>
            Please set a valid access token.
          </Text>
          <Text style={{display: this.state.lang === 'ja' ? 'inline' : 'none'}}>
            アクセストークンが有効ではありません。
            <br/>
            有効なアクセストークンを設定してください。
          </Text>

          <PrefSetupAccessToken
            visible={true}
            githubType={pref.github.host === 'api.github.com' ? 'github' : 'ghe'}
            https={pref.github.https}
            webHost={pref.github.webHost}
            accessToken={this.state.accessToken}
            onChangeAccessToken={(accessToken => this.setState({accessToken}))}
            onFinish={() => this.handleOK()}
            style={{padding: 0}}
          />
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  padding: ${space.medium}px;
  min-width: 400px;
`;

const LangRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-bottom: ${space.medium}px;
`;

const LangLabel = styled(Text)`
  font-size: ${font.small}px;
`;
