import React from 'react';
import {StreamSetup} from '../../Repository/Setup/StreamSetup';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {space} from '../../Library/Style/layout';
import {Button} from '../../Library/View/Button';
import {Link} from '../../Library/View/Link';
import {DocsUtil} from '../../Library/Util/DocsUtil';
import {Translate} from '../../Library/View/Translate';

type Props = {
}

type State = {
  show: boolean;
}

export class IntroFragment extends React.Component<Props, State> {
  state: State = {
    show: StreamSetup.isCreatingInitialStreams()
  }

  render() {
    return (
      <Modal show={this.state.show} onClose={() => null}>
        <Root>
          <Translate
            onMessage={mc => mc.intro.desc}
            values={{handbook: <Link url={DocsUtil.getTopURL()}> Jasper Handbook </ Link>}}
          />
          <Button onClick={() => this.setState({show: false})} type='primary' style={{alignSelf: 'center', marginTop: space.small}}>OK</Button>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  width: 500px;
`;
