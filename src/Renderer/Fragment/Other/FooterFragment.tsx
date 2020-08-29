import React from 'react';
import {StreamEvent} from '../../Event/StreamEvent';
import {DateUtil} from '../../Library/Util/DateUtil';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Icon} from '../../Library/View/Icon';
import {Text} from '../../Library/View/Text';
import {font, iconFont, space} from '../../Library/Style/layout';
import {appTheme} from '../../Library/Style/appTheme';
import {StreamRepo} from '../../Repository/StreamRepo';

type Props = {
}

type State = {
  lastStream: StreamEntity;
  lastDate: Date;
}

export class FooterFragment extends React.Component<Props, State> {
  state: State = {
    lastStream: null,
    lastDate: null,
  };

  componentDidMount() {
    StreamEvent.onUpdateStreamIssues(this, (streamId) => this.updateTime(streamId));
  }

  componentWillUnmount(): void {
    StreamEvent.offAll(this);
  }

  private async updateTime(streamId: number) {
    const {error, stream} = await StreamRepo.getStream(streamId);
    if (error) return console.error(error);
    this.setState({lastStream: stream, lastDate: new Date()});
  }


  render() {
    let lastStreamMessage;
    let hoverMessage;
    if (this.state.lastStream) {
      const lastDate = DateUtil.localToString(this.state.lastDate);
      lastStreamMessage = lastDate.split(' ')[1];
      hoverMessage = `"${this.state.lastStream.name}" stream updated at ${lastDate}`;
    }


    return (
      <Root>
        <Icon name='cloud-download-outline' size={iconFont.small}/>
        <UpdateText title={hoverMessage}>
          {lastStreamMessage}
        </UpdateText>
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
