import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {space} from '../../Library/Style/layout';
import {VersionPolling} from '../../Repository/Polling/VersionPolling';
import {Translate} from '../../Library/View/Translate';
import {PrefSetupAccessToken} from './PrefSetup/PrefSetupAccessToken';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {Link} from '../../Library/View/Link';

type Props = {
  onRetry: () => void;
}

type State = {
  accessToken: string;
}

export class PrefScopeErrorFragment extends React.Component<Props, State> {
  state: State = {
    accessToken: '',
  };

  private async handleOK() {
    const pref = UserPrefRepo.getPref();
    pref.github.accessToken = this.state.accessToken;
    await UserPrefRepo.updatePref(pref);
    this.props.onRetry();
  }

  render() {
    const pref = UserPrefRepo.getPref();
    const version = VersionPolling.getVersion();
    const url = `http${pref.github.https ? 's' : ''}://${pref.github.webHost}/settings/tokens`;
    return (
      <Modal show={true} onClose={() => null}>
        <Root>
          <Translate
            onMessage={mc => mc.prefScopeError.desc}
            values={{
              version,
              url: <Link url={url}>GitHub/GHE</Link>
          }}
          />

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
  width: 560px;
`;
