import React from 'react';
import {StreamSetup} from '../../Repository/Setup/StreamSetup';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {ClickView} from '../../Library/View/ClickView';
import {Text} from '../../Library/View/Text';
import {font, space} from '../../Library/Style/layout';
import {Image} from '../../Library/View/Image';
import {Button} from '../../Library/View/Button';

type Props = {
}

type State = {
  show: boolean;
  lang: 'ja' | 'en' | string;
}

export class IntroFragment extends React.Component<Props, State> {
  state: State = {
    show: StreamSetup.isCreatingInitialStreams(),
    lang: navigator.language || 'en',
  }

  render() {
    return (
      <Modal show={this.state.show} onClose={() => null}>
        <Root>
          <LangRow>
            <ClickView onClick={() => this.setState({lang: 'en'})}><LangLabel>English</LangLabel></ClickView>
            <Text style={{fontSize: font.small, padding: `0 ${space.small}px`}}>/</Text>
            <ClickView onClick={() => this.setState({lang: 'ja'})}><LangLabel>Japanese</LangLabel></ClickView>
          </LangRow>

          <Text style={{display: this.state.lang !== 'ja' ? 'inline' : 'none'}}>
            Welcome to Jasper!
            <br/>
            <br/>
            We are currently loading issues related to you.
            <br/>
            It will take a few minutes for the initial load to complete. During that time, please use it without closing Jasper.
          </Text>
          <Text style={{display: this.state.lang === 'ja' ? 'inline' : 'none'}}>
            🎉Jasperにようこそ🎉
            <br/>
            <br/>
            現在、あなたに関連するissueの読み込みを行っています。
            <br/>
            初回の読み込みが完了するには数分かかります。その間はJasperを終了せずにお使いください。
          </Text>

          <Miniature source={{url: '../image/jasper_miniature.png'}}/>

          <Button onClick={() => this.setState({show: false})} type='primary' style={{alignSelf: 'center', marginTop: space.small}}>OK</Button>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  width: 640px;
`;

const LangRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-bottom: ${space.medium}px;
`;

const LangLabel = styled(Text)`
  font-size: ${font.small}px;
`;

const Miniature = styled(Image)`
  width: 460px;
  margin: ${space.large}px;
  align-self: center;
`;
