import React from 'react';
import styled from 'styled-components';
import {Icon} from '../../Library/View/Icon';
import {border, font, fontWeight, iconFont, space} from '../../Library/Style/layout';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {UserPrefEntity} from '../../Library/Type/UserPrefEntity';
import {IssueRepo} from '../../Repository/IssueRepo';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {StreamPolling} from '../../Repository/Polling/StreamPolling';
import {Button} from '../../Library/View/Button';
import {CheckBox} from '../../Library/View/CheckBox';
import {Modal} from '../../Library/View/Modal';
import {Text} from '../../Library/View/Text';
import {ClickView} from '../../Library/View/ClickView';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';
import {Select} from '../../Library/View/Select';
import {TextInput} from '../../Library/View/TextInput';
import {StreamRepo} from '../../Repository/StreamRepo';
import {UserPrefEvent} from '../../Event/UserPrefEvent';
import {color} from '../../Library/Style/color';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {ScrollView} from '../../Library/View/ScrollView';
import {StreamEvent} from '../../Event/StreamEvent';

type Props = {
  show: boolean;
  onClose(): void;
}

type State = {
  body: 'github' | 'browse' | 'notification' | 'streams' | 'storage' | 'export';
  currentRecord: number;
  pref: UserPrefEntity;
  streams: StreamEntity[];
}

export class PrefEditorFragment extends React.Component<Props, State>{
  state: State = {
    body: 'github',
    currentRecord: null,
    pref: UserPrefRepo.getPref(),
    streams: [],
  }

  componentDidMount() {
    this.initState();
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.show !== prevProps.show && this.props.show) {
      this.initState();
    }
  }

  private async initState() {
    this.setState({body: 'github', pref: UserPrefRepo.getPref()});
    const {error, count} = await IssueRepo.getTotalCount();
    if (error) return console.error(error);
    this.setState({currentRecord: count});

    await this.loadStreams();
  }

  private async loadStreams() {
    const {error: e1, streams: libraryStreams} = await StreamRepo.getAllStreams(['LibraryStream']);
    if (e1) return console.error(e1);

    const {error: e2, streams: systemStreams} = await StreamRepo.getAllStreams(['SystemStream']);
    if (e2) return console.error(e2);

    const {error: e3, streams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream', 'ProjectStream']);
    if (e3) return console.error(e3);

    this.setState({streams: [...libraryStreams, ...systemStreams, ...streams]});
  }

  private async editStream(stream: StreamEntity) {
    const {error} = await StreamRepo.updateStream(stream.id, stream.name, stream.queries, stream.userFilter, stream.notification, stream.color, stream.enabled, stream.iconName);
    if (error) return console.error(error);

    if (stream.type === 'SystemStream' || stream.type === 'UserStream' || stream.type === 'ProjectStream') {
      await StreamPolling.refreshStream(stream.id);
    }

    StreamEvent.emitReloadAllStreams();
  }

  private async handleClose() {
    const result = await UserPrefRepo.updatePref(this.state.pref);
    if (!result) return console.error(`fail update pref`, this.state.pref);

    UserPrefEvent.emitUpdatePref();
    this.props.onClose();
  }

  private async handleExportStream() {
    const streams = await StreamRepo.export();
    await StreamIPC.exportStreams(streams);
  }

  private async handleImportStream() {
    const streams = await StreamIPC.importStreams();
    if (streams) {
      await StreamRepo.import(streams);
      await StreamPolling.restart();
    }
  }

  private setPref(callback: () => void) {
    callback();
    this.setState({pref: this.state.pref});
  }

  private handleStreamEnabled(streamId: number, enabled: boolean) {
    const stream = this.state.streams.find(s => s.id === streamId);
    stream.enabled = enabled ? 1 : 0;
    this.setState({streams: [...this.state.streams]});
    this.editStream(stream);
  }

  private async handleStreamNotification(streamId: number, notification: boolean) {
    const stream = this.state.streams.find(s => s.id === streamId);
    stream.notification = notification ? 1 : 0;
    this.setState({streams: [...this.state.streams]});
    this.editStream(stream);
  }

  render() {
    return (
      <Modal onClose={() => this.handleClose()} show={this.props.show} style={{height: 500, padding: 0}}>
        <Title>Preferences</Title>
        {this.renderTab()}
        <Body>
          {this.renderGitHub()}
          {this.renderBrowse()}
          {this.renderNotification()}
          {this.renderStreams()}
          {this.renderStorage()}
          {this.renderExport()}
        </Body>
      </Modal>
    );
  }

  private renderTab() {
    return (
      <Tab>
        <TabButton
          onClick={() => this.setState({body: 'github'})}
          className={this.state.body === 'github' ? 'active' : ''}
        >
          <Icon name='github' size={iconFont.extraLarge}/>
          <TabButtonLabel>GitHub</TabButtonLabel>
        </TabButton>

        <TabButton
          onClick={() => this.setState({body: 'browse'})}
          className={this.state.body === 'browse' ? 'active' : ''}
        >
          <Icon name='monitor' size={iconFont.extraLarge}/>
          <TabButtonLabel>Browse</TabButtonLabel>
        </TabButton>

        <TabButton
          onClick={() => this.setState({body: 'notification'})}
          className={this.state.body === 'notification' ? 'active' : ''}
        >
          <Icon name='bell' size={iconFont.extraLarge}/>
          <TabButtonLabel>Notification</TabButtonLabel>
        </TabButton>

        <TabButton
          onClick={() => this.setState({body: 'streams'})}
          className={this.state.body === 'streams' ? 'active' : ''}
        >
          <Icon name='lightning-bolt' size={iconFont.extraLarge}/>
          <TabButtonLabel>Streams</TabButtonLabel>
        </TabButton>

        <TabButton
          onClick={() => this.setState({body: 'storage'})}
          className={this.state.body === 'storage' ? 'active' : ''}
        >
          <Icon name='database' size={iconFont.extraLarge}/>
          <TabButtonLabel>Storage</TabButtonLabel>
        </TabButton>

        <TabButton
          onClick={() => this.setState({body: 'export'})}
          className={this.state.body === 'export' ? 'active' : ''}
        >
          <Icon name='download-box' size={iconFont.extraLarge}/>
          <TabButtonLabel>Export</TabButtonLabel>
        </TabButton>
      </Tab>
    );
  }

  renderGitHub() {
    const display = this.state.body === 'github' ? null : 'none';
    return (
      <View style={{display}}>
        <BodyLabel>API Host:</BodyLabel>
        <TextInput value={this.state.pref.github.host} onChange={t => this.setPref(() => this.state.pref.github.host = t)}/>
        <Space/>

        <BodyLabel>Access Token:</BodyLabel>
        <TextInput value={this.state.pref.github.accessToken} onChange={t => this.setPref(() => this.state.pref.github.accessToken = t)}/>
        <Space/>

        <BodyLabel>Path Prefix:</BodyLabel>
        <TextInput value={this.state.pref.github.pathPrefix} onChange={t => this.setPref(() => this.state.pref.github.pathPrefix = t)}/>
        <Space/>

        <BodyLabel>API Interval(sec):</BodyLabel>
        <TextInput
          type='number'
          value={this.state.pref.github.interval}
          onChange={t => this.setPref(() => this.state.pref.github.interval = parseInt(t || '10', 10))}
          min={10}
        />
        <Space/>

        <BodyLabel>Web Host:</BodyLabel>
        <TextInput value={this.state.pref.github.webHost} onChange={t => this.setPref(() => this.state.pref.github.webHost = t)}/>
        <Space/>

        <CheckBox
          checked={this.state.pref.github.https}
          onChange={c => this.setPref(() => this.state.pref.github.https = c)}
          label='Use HTTPS'
        />
      </View>
    );
  }

  renderBrowse() {
    const display = this.state.body === 'browse' ? null : 'none';
    const browseItems = [
      {label: 'Use Built-in Browser', value: 'builtin'},
      {label: 'Use External Browser', value: 'external'},
    ];

    return (
      <View style={{display}}>
        <Select
          items={browseItems}
          onSelect={value => this.setPref(() => this.state.pref.general.browser = value as any)}
          value={this.state.pref.general.browser}
        />
        <Space/>

        <CheckBox
          checked={this.state.pref.general.alwaysOpenExternalUrlInExternalBrowser}
          onChange={c => this.setPref(() => this.state.pref.general.alwaysOpenExternalUrlInExternalBrowser = c)}
          label='Always open external URL in external browser'
        />
        <Space/>

        <CheckBox
          checked={this.state.pref.general.onlyUnreadIssue}
          onChange={c => this.setPref(() => this.state.pref.general.onlyUnreadIssue = c)}
          label='Show only unread issues'
        />
      </View>
    );
  }

  renderNotification() {
    const display = this.state.body === 'notification' ? null : 'none';

    return (
      <View style={{display}}>
        <CheckBox
          checked={this.state.pref.general.notification}
          onChange={c => this.setPref(() => this.state.pref.general.notification = c)}
          label='Enable notification'
        />
        <Space/>
        <CheckBox
          checked={this.state.pref.general.notificationSilent}
          onChange={c => this.setPref(() => this.state.pref.general.notificationSilent = c)}
          label='Silent notification'
        />
        <Space/>
        <CheckBox
          checked={this.state.pref.general.badge}
          onChange={c => this.setPref(() => this.state.pref.general.badge = c)}
          label='Display unread count badge in dock (Mac only)'
        />
        <Space/>
      </View>
    );
  }

  renderStreams() {
    const display = this.state.body === 'streams' ? null : 'none';

    const libraryStreamViews = [];
    const systemStreamViews = [];
    const userStreamViews = [];

    this.state.streams.forEach(stream => {
      const enabledClassName = stream.enabled ? '' : 'stream-row-disabled';
      const view = (
        <StreamRow key={stream.id} className={enabledClassName}>
          <StreamIcon name={stream.iconName} color={stream.color}/>
          <StreamName>{stream.name}</StreamName>
          <CheckBox checked={!!stream.enabled} onChange={(enabled) => this.handleStreamEnabled(stream.id, enabled)}/>
          <View style={{width: 50}}/>
          <CheckBox checked={!!stream.notification} onChange={(notification) => this.handleStreamNotification(stream.id, notification)}/>
          <View style={{width: 20}}/>
        </StreamRow>
      );

      if (stream.type === 'LibraryStream') {
        libraryStreamViews.push(view);
      } else if (stream.type === 'SystemStream') {
        systemStreamViews.push(view);
      } else {
        userStreamViews.push(view);
      }
    });

    return (
      <View style={{display}}>
        <Text style={{textAlign: 'right'}}>
          <Text>Enabled</Text>
          <Text style={{paddingLeft: space.medium2}}>Notification</Text>
        </Text>
        <ScrollView>
          <StreamSectionLabel style={{paddingTop: 0}}>LIBRARY</StreamSectionLabel>
          {libraryStreamViews}
          <StreamSectionLabel>SYSTEM</StreamSectionLabel>
          {systemStreamViews}
          <StreamSectionLabel>STREAM</StreamSectionLabel>
          {userStreamViews}
        </ScrollView>
      </View>
    );
  }

  renderStorage() {
    const display = this.state.body === 'storage' ? null : 'none';

    return (
      <View style={{display}}>
        <BodyLabel>Current Records:</BodyLabel>
        <TextInput
          readOnly={true}
          value={this.state.currentRecord || ''}
          onChange={() => null}
        />
        <Space/>

        <BodyLabel>Maximum Records:</BodyLabel>
        <TextInput
          type='number'
          value={this.state.pref.database.max}
          onChange={t => this.setPref(() => this.state.pref.database.max = parseInt(t || '1000', 10))}
          max={100000}
          min={1000}
        />
      </View>
    );
  }

  renderExport() {
    const display = this.state.body === 'export' ? null : 'none';

    return (
      <View style={{display}}>
        <Row>
          <Button onClick={this.handleExportStream.bind(this)}>Export</Button>
          <BodyLabel style={{paddingLeft: space.medium}}>Export streams settings.</BodyLabel>
        </Row>
        <Space/>

        <Row>
          <Button onClick={this.handleImportStream.bind(this)}>Import</Button>
          <BodyLabel style={{paddingLeft: space.medium}}>Import streams settings.</BodyLabel>
        </Row>
        <Space/>
      </View>
    );
  }
}

const Title = styled(Text)`
  background-color: ${() => appTheme().tab.bg};
  text-align: center;
  font-weight: ${fontWeight.bold};
  padding: ${space.small}px;
`;

// tab
const Tab = styled(View)`
  flex-direction: row;
  justify-content: center;
  width: auto;
  background-color: ${() => appTheme().tab.bg};
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  padding: ${space.medium}px;
`;

const TabButton = styled(ClickView)`
  align-items: center;
  padding: ${space.small}px ${space.medium}px;
  border-radius: 8px;
  min-width: 80px;
  border: solid ${border.medium}px transparent;
  
  &.active {
    background-color: ${() => appTheme().tab.active};
    border: solid ${border.medium}px ${() => appTheme().borderColor};
  }
  
  &.active .icon {
    color: ${color.blue} !important;;
  }
`;

const TabButtonLabel = styled(Text)`
  padding-top: ${space.tiny}px;
  font-size: ${font.small}px;
`;

// body
const Body = styled(View)`
  flex: 1;
  padding: ${space.large}px;
`;

const BodyLabel = styled(Text)`
  padding-right: ${space.medium}px;
`;

const Row = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const Space = styled(View)`
  height: ${space.large}px;
`;

// streams
const StreamSectionLabel = styled(Text)`
  display: block;
  padding-top: ${space.large}px;
`;

const StreamRow = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  padding: ${space.small2}px ${space.medium}px ${space.small2}px ${space.medium2}px;
  border-radius: 6px;
  
  &:hover {
    background: ${() => appTheme().bgHover};
  }
`;

const StreamName = styled(Text)`
  flex: 1;
  padding-left: ${space.small}px;
  
  .stream-row-disabled &{
    opacity: 0.5;
  }
`;

const StreamIcon = styled(Icon)`
  .stream-row-disabled &{
    opacity: 0.5;
  }
`;
