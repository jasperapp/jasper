import React from 'react';
import styled from 'styled-components';
import {space} from '../../Library/Style/layout';
import {Button} from '../../Library/View/Button';
import {Modal} from '../../Library/View/Modal';
import {Text} from '../../Library/View/Text';
import {Translate} from '../../Library/View/Translate';
import {View} from '../../Library/View/View';

type Props = {
  githubUrl: string;
  onRetry: () => void;
}

type State = {
}

export class PrefNetworkErrorFragment extends React.Component<Props, State> {
  private handleOpenGitHub() {
    window.ipc.mainWindow.openNewWindow(this.props.githubUrl);
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
