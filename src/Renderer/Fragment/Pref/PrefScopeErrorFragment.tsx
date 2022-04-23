import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {Button} from '../../Library/View/Button';
import {appTheme} from '../../Library/Style/appTheme';
import {fontWeight, space} from '../../Library/Style/layout';
import {Image} from '../../Library/View/Image';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {VersionPolling} from '../../Repository/Polling/VersionPolling';
import {Translate} from '../../Library/View/Translate';

type Props = {
  githubUrl: string;
  onRetry: () => void;
}

type State = {
}

export class PrefScopeErrorFragment extends React.Component<Props, State> {
  private handleOpenSettings() {
    const url = `${this.props.githubUrl}/settings/tokens`;
    ShellUtil.openExternal(url);
  }

  render() {
    const version = VersionPolling.getVersion();
    return (
      <Modal show={true} onClose={() => null}>
        <Root>
          <Text>
            <Translate
              onMessage={mc => mc.prefScopeError.desc}
              values={{
                version,
                user: <ScopeName>read:user</ScopeName>,
                repo: <ScopeName>repo</ScopeName>,
                notifications: <ScopeName>notifications</ScopeName>,
                readOrg: <ScopeName>read:org</ScopeName>
            }}
            />
          </Text>

          <Images>
            <Image source={{url: '../image/scope_readorg.png'}} style={{width: 200}}/>
            <View style={{height: space.large}}/>
            <Image source={{url: '../image/scope_notifications.png'}} style={{width: 200}}/>
            <View style={{height: space.large}}/>
            <Image source={{url: '../image/scope_user.png'}} style={{width: 200}}/>
          </Images>

          <ButtonRow>
            <Button onClick={() => this.props.onRetry()}>OK</Button>
            <View style={{width: space.large}}/>
            <Button onClick={() => this.handleOpenSettings()} type='primary'><Translate onMessage={mc => mc.prefScopeError.open}/></Button>
          </ButtonRow>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  padding: ${space.medium}px;
`;

const ScopeName = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.small}px;
  display: inline-block;
  border-radius: 4px;
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
