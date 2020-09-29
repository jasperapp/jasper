import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {Button} from '../../Library/View/Button';
import {font, space} from '../../Library/Style/layout';
import {ClickView} from '../../Library/View/ClickView';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {TextInput} from '../../Library/View/TextInput';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';

type Props = {
  githubUrl: string;
  onRetry: () => void;
}

type State = {
  lang: 'ja' | 'en';
  accessToken: string;
}

export class PrefUnauthorizedFragment extends React.Component<Props, State> {
  state: State = {
    lang: PlatformUtil.getLang(),
    accessToken: UserPrefRepo.getPref().github.accessToken,
  }

  private handleOpenGitHub() {
    ShellUtil.openExternal(`${this.props.githubUrl}/settings/tokens`);
  }

  private async handleOK() {
    const pref = UserPrefRepo.getPref();
    pref.github.accessToken = this.state.accessToken;
    await UserPrefRepo.updatePref(pref);
    this.props.onRetry();
  }

  render() {
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

          <View style={{height: space.large}}/>
          <TextInput onChange={t => this.setState({accessToken: t})} value={this.state.accessToken}/>

          <ButtonRow>
            <Button onClick={() => this.handleOK()}>OK</Button>
            <View style={{width: space.large}}/>
            <Button onClick={() => this.handleOpenGitHub()} type='primary'>Open GitHub/GHE</Button>
          </ButtonRow>
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

const ButtonRow = styled(View)`
  padding-top: ${space.large}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
