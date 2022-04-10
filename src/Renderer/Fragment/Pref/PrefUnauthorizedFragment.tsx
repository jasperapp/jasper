import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {space} from '../../Library/Style/layout';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {PrefSetupAccessToken} from './PrefSetup/PrefSetupAccessToken';
import {Translate} from '../../Library/View/Translate';

type Props = {
  onRetry: () => void;
}

type State = {
  accessToken: string;
}

export class PrefUnauthorizedFragment extends React.Component<Props, State> {
  state: State = {
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
          <Text>
            <Translate onMessage={mc => mc.prefUnauthorized.invalid}/>
            <br/>
            <Translate onMessage={mc => mc.prefUnauthorized.setting}/>
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
