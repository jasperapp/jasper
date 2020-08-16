import {shell} from 'electron';
import React from 'react';
import {StreamEvent} from '../../Event/StreamEvent';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {StreamRepo} from '../../Repository/StreamRepo';
import {SystemStreamRepo} from '../../Repository/SystemStreamRepo';
import {DateUtil} from '../../Util/DateUtil';
import {VersionEvent} from '../../Event/VersionEvent';
import {BaseStreamEntity, StreamEntity, SystemStreamEntity} from '../../Type/StreamEntity';
import {RemoteVersionEntity} from '../../Type/RemoteVersionEntity';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {ClickView} from '../../Component/Core/ClickView';
import {Icon} from '../../Component/Core/Icon';
import {Text} from '../../Component/Core/Text';
import {font, fontWeight, iconFont, space} from '../../Style/layout';
import {appTheme} from '../../Style/appTheme';
import {color} from '../../Style/color';

type Props = {
  onOpenPref: () => void;
}

type State = {
  lastStream: BaseStreamEntity;
  lastDate: Date;
  newVersion: RemoteVersionEntity;
}

export class FooterFragment extends React.Component<Props, State> {
  state: State = {
    lastStream: null,
    lastDate: null,
    newVersion: null,
  };

  componentDidMount() {
    SystemStreamEvent.onUpdateStream(this, this.updateTime.bind(this, 'system'));
    StreamEvent.onUpdateStream(this, this.updateTime.bind(this, 'stream'));
    VersionEvent.onNewVersion(this, (newVersion) => this.setState({newVersion}));
  }

  componentWillUnmount(): void {
    SystemStreamEvent.offAll(this);
    StreamEvent.offAll(this);
  }

  private async updateTime(type, streamId) {
    let stream: StreamEntity | SystemStreamEntity;

    switch (type) {
      case 'system':
        const res1 = await SystemStreamRepo.getSystemStream(streamId);
        stream = res1.systemStream;
        break;
      case 'stream':
        const res2 = await StreamRepo.getStream(streamId);
        stream = res2.stream;
        break;
      default:
        throw new Error(`unknown stream type: ${type}`);
    }

    this.setState({lastStream: stream, lastDate: new Date()})
  }

  private handleNewVersion() {
    shell.openExternal(this.state.newVersion.url);
  }

  render() {
    let lastStreamMessage;
    let hoverMessage;
    if (this.state.lastStream) {
      const lastDate = DateUtil.localToString(this.state.lastDate);
      lastStreamMessage = lastDate.split(' ')[1];
      hoverMessage = `"${this.state.lastStream.name}" stream connection at ${lastDate}`;
    }

    const newVersion = this.state.newVersion ? 'New Version' : '';

    return (
      <Root>
        <Icon name='update' size={iconFont.small}/>
        <UpdateText>
          {lastStreamMessage}
        </UpdateText>
        <View style={{flex: 1}}/>
        <ClickView onClick={() => this.handleNewVersion()} title={hoverMessage} style={{display: newVersion ? null : 'none'}}>
          <NewVersionText>{newVersion}</NewVersionText>
        </ClickView>
      </Root>
    );
  }
}

const Root = styled(View)`
  flex-direction: row;
  padding: 0 ${space.medium}px ${space.small}px;
  align-items: center;
`;

const UpdateText = styled(Text)`
  padding-left: ${space.small}px;
  font-size: ${font.small}px;
  color: ${() => appTheme().textSoftColor};
`;

const NewVersionText = styled(Text)`
  font-size: ${font.small}px;
  color: ${color.white};
  background: ${color.blue};
  border-radius: 4px;
  font-weight: ${fontWeight.bold};
  padding: ${space.tiny}px ${space.small2}px;
`;
