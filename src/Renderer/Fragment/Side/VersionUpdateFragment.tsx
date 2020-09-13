import React from 'react';
import {RemoteVersionEntity} from '../../Library/Type/RemoteVersionEntity';
import {VersionEvent} from '../../Event/VersionEvent';
import {ClickView} from '../../Library/View/ClickView';
import styled from 'styled-components';
import {Text} from '../../Library/View/Text';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {color} from '../../Library/Style/color';
import {View} from '../../Library/View/View';
import {Icon} from '../../Library/View/Icon';
import {VersionPolling} from '../../Repository/Polling/VersionPolling';
import {DateUtil} from '../../Library/Util/DateUtil';
import {ShellUtil} from '../../../Util/ShellUtil';

type Props = {
}

type State = {
  newVersion: RemoteVersionEntity | null;
  closed: boolean;
}

export class VersionUpdateFragment extends React.Component<Props, State> {
  state: State = {
    newVersion: null,
    closed: false,
  }

  componentDidMount() {
    VersionEvent.onNewVersion(this, (newVersion) => this.setState({newVersion}));
  }

  componentWillUnmount() {
    VersionEvent.offAll(this);
  }

  private handleNewVersion() {
    ShellUtil.openExternal(this.state.newVersion.url);
  }

  private handleClose() {
    this.setState({closed: true});
  }

  render() {
    if (!this.state.newVersion) return null;
    if (this.state.closed) return null;

    return (
      <Root>
        <Card onClick={() => this.handleNewVersion()}>
          <NewVersionTextWrap>
            <NewVersionText>New Version Available!</NewVersionText>
            <ClickView onClick={() => this.handleClose()}>
              <Icon name='close-circle-outline' color={color.white}/>
            </ClickView>
          </NewVersionTextWrap>

          <Desc>{VersionPolling.getVersion()} → {this.state.newVersion.version}</Desc>

          <UpdatedAt>{DateUtil.fromNow(new Date(this.state.newVersion.date))}</UpdatedAt>
        </Card>
      </Root>
    );
  }
}

const Root = styled(ClickView)`
  padding: 0 ${space.medium}px ${space.medium}px;
`;

const Card = styled(ClickView)`
  border-radius: 6px;
  background: ${color.brand};
  width: 100%;
  padding: ${space.medium}px;
`;

const NewVersionTextWrap = styled(View)`
  flex-direction: row;
`;

const NewVersionText = styled(Text)`
  color: ${color.white};
  font-size: ${font.small}px;
  font-weight: ${fontWeight.bold};
  flex: 1;
`;

const Desc = styled(Text)`
  color: ${color.white};
  font-size: ${font.small}px;
`;

const UpdatedAt = styled(Text)`
  color: ${color.white};
  font-size: ${font.tiny}px;
  align-self: flex-end;
`;
