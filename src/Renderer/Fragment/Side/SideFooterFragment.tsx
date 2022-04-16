import React from 'react';
import {StreamEvent} from '../../Event/StreamEvent';
import {DateUtil} from '../../Library/Util/DateUtil';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Icon} from '../../Library/View/Icon';
import {Text} from '../../Library/View/Text';
import {font, space} from '../../Library/Style/layout';
import {appTheme} from '../../Library/Style/appTheme';
import {StreamRepo} from '../../Repository/StreamRepo';
import {ClickView} from '../../Library/View/ClickView';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {AppEvent} from '../../Event/AppEvent';
import {Logger} from '../../Library/Infra/Logger';
import {color} from '../../Library/Style/color';

type Props = {
}

type State = {
  lastStream: StreamEntity;
  lastDate: Date;
  hasErrorLog: boolean;
}

export class SideFooterFragment extends React.Component<Props, State> {
  state: State = {
    lastStream: null,
    lastDate: null,
    hasErrorLog: false,
  };

  componentDidMount() {
    this.setState({hasErrorLog: Logger.hasError()});
    StreamEvent.onUpdateStreamIssues(this, (streamId) => this.updateTime(streamId));
    Logger.onNewLog(this, (log) => {
      if (!this.state.hasErrorLog) this.setState({hasErrorLog: log.level === 'error'})
    });
  }

  componentWillUnmount(): void {
    StreamEvent.offAll(this);
  }

  private async updateTime(streamId: number) {
    const {error, stream} = await StreamRepo.getStream(streamId);
    if (error) return console.error(error);
    this.setState({lastStream: stream, lastDate: new Date()});
  }

  private openJasperRepository() {
    const url = 'https://github.com/jasperapp/jasper';
    ShellUtil.openExternal(url);
  }

  private openTwitter() {
    const text = encodeURIComponent(``);
    const url = encodeURIComponent('https://jasperapp.io');
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=jasperapp`;
    ShellUtil.openExternal(twitterUrl);
  }

  private onClickLogButton() {
    this.setState({hasErrorLog: false});
    AppEvent.emitOpenLogView();
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
        <LogButton onClick={() => this.onClickLogButton()}>
          <Icon
            name={this.state.hasErrorLog ? 'cloud-alert' : 'cloud-download-outline'}
            color={this.state.hasErrorLog ? color.red : null}
          />
          <UpdateText title={hoverMessage}>
            {lastStreamMessage}
          </UpdateText>
        </LogButton>

        <View style={{flex: 1}}/>

        <ClickView
          title='Open Jasper Repository'
          style={{marginRight: space.medium2}} onClick={() => this.openJasperRepository()}
        >
          <Icon name='github'/>
        </ClickView>

        <ClickView
          title='Share Jasper on Twitter'
          style={{marginRight: space.medium2}} onClick={() => this.openTwitter()}
        >
          <Icon name='twitter'/>
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

const LogButton = styled(ClickView)`
  flex-direction: row;
  align-items: center;
`;

const UpdateText = styled(Text)`
  flex: 1;
  padding-top: 1px;
  padding-left: ${space.small}px;
  font-size: ${font.small}px;
  color: ${() => appTheme().text.soft};
`;
