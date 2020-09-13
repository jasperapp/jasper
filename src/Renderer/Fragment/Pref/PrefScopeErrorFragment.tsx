import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {Button} from '../../Library/View/Button';
import {appTheme} from '../../Library/Style/appTheme';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {ClickView} from '../../Library/View/ClickView';
import {Image} from '../../Library/View/Image';
import {ShellUtil} from '../../../Util/ShellUtil';

type Props = {
  githubUrl: string;
  onRetry: () => void;
}

type State = {
  lang: 'ja' | string;
}

export class PrefScopeErrorFragment extends React.Component<Props, State> {
  state: State = {
    lang: navigator.language || 'en',
  }

  private handleOpenSettings() {
    const url = `${this.props.githubUrl}/settings/tokens`;
    ShellUtil.openExternal(url);
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
            Jasper(v1.0.0~) now requires <ScopeName>notifications</ScopeName> and <ScopeName>read:org</ScopeName> scopes.
            <br/>
            Please enable those scopes at GitHub/GHE site.
            <br/>
            <ScopeNote>requires scopes: repo, user, notifications and read:org</ScopeNote>
          </Text>
          <Text style={{display: this.state.lang === 'ja' ? 'inline' : 'none'}}>
            Jasper(v1.0.0~)は新たに<ScopeName>notifications</ScopeName>と<ScopeName>read:org</ScopeName>のスコープを必要とします。
            <br/>
            これらのスコープをGitHub/GHEのサイトで有効にしてください。
            <br/>
            <ScopeNote>必要なスコープ: repo, user, notifications, read:org</ScopeNote>
          </Text>

          <Images>
            <Image source={{url: '../image/scope_readorg.png'}} style={{width: 200}}/>
            <View style={{height: space.large}}/>
            <Image source={{url: '../image/scope_notifications.png'}} style={{width: 200}}/>
          </Images>

          <ButtonRow>
            <Button onClick={() => this.props.onRetry()}>OK</Button>
            <View style={{width: space.large}}/>
            <Button onClick={() => this.handleOpenSettings()} type='primary'>Open Settings</Button>
          </ButtonRow>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  padding: ${space.medium}px;
`;

const LangRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-bottom: ${space.medium}px;
`;

const LangLabel = styled(Text)`
  font-size: ${font.small}px;
`;

const ScopeName = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.small}px;
  display: inline-block;
  border-radius: 4px;
`;

const ScopeNote = styled(Text)`
  font-size: ${font.small}px;
  padding-top: ${space.small}px;
  color: ${() => appTheme().text.soft};
`;

const Images = styled(View)`
  background: ${() => appTheme().accent.normal};
  margin: ${space.medium2}px 0;
  padding: ${space.large}px;
  border-radius: 4px;
  align-items: center;
  width: 80%;
  align-self: center;
}
`;

const ButtonRow = styled(View)`
  padding-top: ${space.large}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
