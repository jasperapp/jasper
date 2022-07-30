import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {Button} from '../../Library/View/Button';
import {space} from '../../Library/Style/layout';
import {MainWindowIPC} from '../../../IPC/MainWindowIPC';
import {Translate} from '../../Library/View/Translate';

type Props = {
  githubUrl: string;
  onRetry: () => void;
}

type State = {
}

export class PrefNetworkErrorFragment extends React.Component<Props, State> {
  private handleOpenGitHub() {
    MainWindowIPC.openNewWindow(this.props.githubUrl);
  }

  render() {
    return (
      <Modal show={true} onClose={() => null}>
        <Root>
          <Text>
            <Translate onMessage={mc => mc.prefNetworkError.fail}/>
            <br/>
            <Translate onMessage={mc => mc.prefNetworkError.check}/>
          </Text>

          <ButtonRow>
            <Button onClick={() => this.props.onRetry()}>OK</Button>
            <View style={{width: space.large}}/>
            <Button onClick={() => this.handleOpenGitHub()} type='primary'><Translate onMessage={mc => mc.prefNetworkError.open}/></Button>
          </ButtonRow>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  padding: ${space.medium}px;
`;

const ButtonRow = styled(View)`
  padding-top: ${space.large}px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;
