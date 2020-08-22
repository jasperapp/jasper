import {shell} from 'electron';
import React from 'react';
import {StreamEvent} from '../../Event/StreamEvent';
import {StreamRepo} from '../../Repository/StreamRepo';
import {SystemStreamRepo} from '../../Repository/SystemStreamRepo';
import {DateUtil} from '../../Library/Util/DateUtil';
import {VersionEvent} from '../../Event/VersionEvent';
import {BaseStreamEntity, StreamEntity, SystemStreamEntity} from '../../Library/Type/StreamEntity';
import {RemoteVersionEntity} from '../../Library/Type/RemoteVersionEntity';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {ClickView} from '../../Library/View/ClickView';
import {Icon} from '../../Library/View/Icon';
import {Text} from '../../Library/View/Text';
import {font, fontWeight, iconFont, space} from '../../Library/Style/layout';
import {appTheme} from '../../Library/Style/appTheme';
import {color} from '../../Library/Style/color';

type Props = {
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
    StreamEvent.onUpdateStreamIssues(this, (streamId) => this.updateTime(streamId));
    VersionEvent.onNewVersion(this, (newVersion) => this.setState({newVersion}));
  }

  componentWillUnmount(): void {
    StreamEvent.offAll(this);
  }

  private async updateTime(streamId: number) {
    let stream: StreamEntity | SystemStreamEntity;

    if (SystemStreamRepo.isSystemStreamId(streamId)) {
      const res = await SystemStreamRepo.getSystemStream(streamId);
      if (res.error) return console.error(res.error);
      stream = res.systemStream;
    } else {
      const res = await StreamRepo.getStream(streamId);
      if (res.error) return console.error(res.error);
      stream = res.stream;
    }

    this.setState({lastStream: stream, lastDate: new Date()});
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
      hoverMessage = `"${this.state.lastStream.name}" stream updated at ${lastDate}`;
    }

    const newVersion = this.state.newVersion ? 'New Version' : '';

    return (
      <Root>
        <Icon name='cloud-download-outline' size={iconFont.small}/>
        <UpdateText title={hoverMessage}>
          {lastStreamMessage}
        </UpdateText>
        <View style={{flex: 1}}/>
        <ClickView onClick={() => this.handleNewVersion()} style={{display: newVersion ? null : 'none'}}>
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
  padding-top: 1px;
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
