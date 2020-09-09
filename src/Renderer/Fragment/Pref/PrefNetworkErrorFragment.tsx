import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {Button} from '../../Library/View/Button';
import {font, space} from '../../Library/Style/layout';
import {ClickView} from '../../Library/View/ClickView';
import {AppIPC} from '../../../IPC/AppIPC';

type Props = {
  githubUrl: string;
  onRetry: () => void;
}

type State = {
  lang: 'ja' | string;
}

export class PrefNetworkErrorFragment extends React.Component<Props, State> {
  state: State = {
    lang: navigator.language || 'en',
  }

  private handleOpenGitHub() {
    AppIPC.openNewWindow(this.props.githubUrl);
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
            Fail connection to GitHub/GHE.
            <br/>
            Please check network, VPN, proxy and more.
          </Text>
          <Text style={{display: this.state.lang === 'ja' ? 'inline' : 'none'}}>
            GitHub/GHEへの接続に失敗しました。
            <br/>
            ネットワーク、VPN、プロキシなどを確認してください。
          </Text>

          <ButtonRow>
            <Button onClick={() => this.props.onRetry()}>OK</Button>
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
