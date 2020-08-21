import React from 'react';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {Icon} from '../../Component/Core/Icon';
import {border, iconFont, space} from '../../Style/layout';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {UserPrefEntity} from '../../Type/UserPrefEntity';
import {IssueRepo} from '../../Repository/IssueRepo';
import {StreamExportRepo} from '../../Repository/StreamExportRepo';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {StreamPolling} from '../../Repository/Polling/StreamPolling';
import {Button} from '../../Component/Core/Button';
import {CheckBox} from '../../Component/Core/CheckBox';
import {AppIPC} from '../../../IPC/AppIPC';
import {Modal} from '../../Component/Core/Modal';
import {Text} from '../../Component/Core/Text';
import {ClickView} from '../../Component/Core/ClickView';
import {View} from '../../Component/Core/View';
import {appTheme} from '../../Style/appTheme';
import {Select} from '../../Component/Core/Select';
import {TextInput} from '../../Component/Core/TextInput';

type Props = {
  show: boolean;
  onClose(): void;
}

type State = {
  body: 'github' | 'browse' | 'notification' | 'storage' | 'export' | 'danger';
  currentRecord: number;
  pref: UserPrefEntity;
}

export class PrefEditorFragment extends React.Component<Props, State>{
  state: State = {
    body: 'github',
    currentRecord: null,
    pref: UserPrefRepo.getPref(),
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
    if (error) return;
    this.setState({currentRecord: count});
  }

  private async handleClose() {
    const result = await UserPrefRepo.updatePref(this.state.pref);
    if (!result) return console.error(`fail update pref`, this.state.pref);

    BrowserViewIPC.hide(false);
    this.props.onClose();
  }

  private async handleExportStream() {
    const {streamSettings} = await StreamExportRepo.export();
    await StreamIPC.exportStreams(streamSettings);
  }

  private async handleImportStream() {
    const {streamSettings} = await StreamIPC.importStreams();
    if (streamSettings) {
      await StreamExportRepo.import(streamSettings);
      await StreamPolling.restart();
    }
  }

  private async handleDeleteAllData() {
    if (!confirm('Do you delete all settings?')) {
      return;
    }
    await StreamPolling.stop();
    await AppIPC.deleteAllData();
  }

  private setPref(callback: () => void) {
    callback();
    this.setState({pref: this.state.pref});
  }

  render() {
    return (
      <Modal onClose={() => this.handleClose()} show={this.props.show} style={{width: 600, height: 400, flexDirection: 'row', padding: 0}}>
        {this.renderSide()}
        <Body>
          {this.renderGitHub()}
          {this.renderBrowse()}
          {this.renderNotification()}
          {this.renderStorage()}
          {this.renderExport()}
          {this.renderDanger()}
        </Body>
      </Modal>
    );
  }

  private renderSide() {
    return (
      <Side>
        <SideRow
          onClick={() => this.setState({body: 'github'})}
          className={this.state.body === 'github' ? 'active' : ''}
        >
          <Icon name='github' size={iconFont.large}/>
          <SideLabel>GitHub</SideLabel>
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'browse'})}
          className={this.state.body === 'browse' ? 'active' : ''}
        >
          <Icon name='monitor' size={iconFont.large}/>
          <SideLabel>Browse</SideLabel>
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'notification'})}
          className={this.state.body === 'notification' ? 'active' : ''}
        >
          <Icon name='bell' size={iconFont.large}/>
          <SideLabel>Notification</SideLabel>
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'storage'})}
          className={this.state.body === 'storage' ? 'active' : ''}
        >
          <Icon name='database' size={iconFont.large}/>
          <SideLabel>Storage</SideLabel>
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'export'})}
          className={this.state.body === 'export' ? 'active' : ''}
        >
          <Icon name='download-box' size={iconFont.large}/>
          <SideLabel>Export</SideLabel>
        </SideRow>

        <View style={{flex: 1}}/>

        <SideRow
          onClick={() => this.setState({body: 'danger'})}
          className={this.state.body === 'danger' ? 'active' : ''}
        >
          <Icon name='delete' size={iconFont.large}/>
          <SideLabel>Danger</SideLabel>
        </SideRow>
      </Side>
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

  renderDanger() {
    const display = this.state.body === 'danger' ? null : 'none';

    return (
      <View style={{display}}>
        <Row>
          <Button onClick={this.handleDeleteAllData.bind(this)}>Delete All</Button>
          <BodyLabel style={{paddingLeft: space.medium}}>Delete all settings in Jasper.</BodyLabel>
        </Row>
      </View>
    );
  }
}

// side
const Side = styled(View)`
  background-color: ${() => appTheme().bgSide};
  border: solid ${border.medium}px ${() => appTheme().borderColor};
  width: 140px;
`;

const SideRow = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  padding: ${space.small}px ${space.medium}px;
  margin-bottom: ${space.medium}px;
  
  &.active {
    background-color: ${() => appTheme().bgSideSelect};
  }
`;

const SideLabel = styled(Text)`
  padding-left: ${space.small}px;
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
