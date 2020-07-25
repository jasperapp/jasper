import React from 'react';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {Icon} from './Icon';
import {space} from '../Style/layout';
import {Config} from '../Config';
import {ConfigType} from '../../Type/ConfigType';
import {IssuesRepo} from '../Repository/IssuesRepo';
import {StreamExporter} from '../Infra/StreamExporter';
import {StreamIPC} from '../../IPC/StreamIPC';
import {StreamPolling} from '../Infra/StreamPolling';
import {DangerIPC} from '../../IPC/DangerIPC';

type Props = {
  show: boolean;
  onClose(): void;
}

type State = {
  body: 'github' | 'browse' | 'notification' | 'storage' | 'export' | 'danger';
  currentRecord: number;
  config: ConfigType;
}

export class PrefComponent extends React.Component<Props, State>{
  state: State = {
    body: 'github',
    currentRecord: null,
    config: Config.getConfig(),
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
    this.setState({body: 'github', config: Config.getConfig()});
    const {error, count} = await IssuesRepo.getCount();
    if (error) return;
    this.setState({currentRecord: count});
  }

  private async handleClose() {
    const result = await Config.updateConfig(this.state.config);
    if (!result) return console.error(`fail update config`, this.state.config);

    BrowserViewIPC.hide(false);
    this.props.onClose();
  }

  private async handleExportStream() {
    const {streamSettings} = await StreamExporter.export();
    await StreamIPC.exportStreams(streamSettings);
  }

  private async handleImportStream() {
    const {streamSettings} = await StreamIPC.importStreams();
    if (streamSettings) {
      await StreamExporter.import(streamSettings);
      StreamPolling.restart();
    }
  }

  private async handleDeleteAllData() {
    if (!confirm('Do you delete all data?')) {
      return;
    }
    await StreamPolling.stop();
    await DangerIPC.deleteAllData();
  }

  render() {
    if (!this.props.show) return null;
    BrowserViewIPC.hide(true);

    return (
      <Root onClick={this.handleClose.bind(this)}>
        <Container onClick={ev => ev.stopPropagation()}>
          {this.renderSide()}
          <Body>
            {this.renderGitHub()}
            {this.renderBrowse()}
            {this.renderNotification()}
            {this.renderStorage()}
            {this.renderExport()}
            {this.renderDanger()}
          </Body>
        </Container>
      </Root>
    );
  }

  private setConfig(callback: () => void) {
    callback();
    this.setState({config: this.state.config});
  }

  renderSide() {
    return (
      <Side>
        <SideRow
          onClick={() => this.setState({body: 'github'})}
          className={this.state.body === 'github' ? 'active' : ''}
        >
          <Icon name='github'/> GitHub
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'browse'})}
          className={this.state.body === 'browse' ? 'active' : ''}
        >
          <Icon name='monitor'/> Browse
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'notification'})}
          className={this.state.body === 'notification' ? 'active' : ''}
        >
          <Icon name='bell'/> Notification
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'storage'})}
          className={this.state.body === 'storage' ? 'active' : ''}
        >
          <Icon name='database'/> Storage
        </SideRow>

        <SideRow
          onClick={() => this.setState({body: 'export'})}
          className={this.state.body === 'export' ? 'active' : ''}
        >
          <Icon name='download-box'/> Export
        </SideRow>

        <div style={{flex: 1}}/>

        <SideRow
          onClick={() => this.setState({body: 'danger'})}
          className={this.state.body === 'danger' ? 'active' : ''}
        >
          <Icon name='delete'/> Danger
        </SideRow>
      </Side>
    );
  }

  renderGitHub() {
    const display = this.state.body === 'github' ? null : 'none';
    return (
      <div style={{display}}>
        <BodyLabel>API Host:</BodyLabel>
        <InputBox value={this.state.config.github.host} onChange={ev => this.setConfig(() => this.state.config.github.host = ev.target.value)}/>
        <Space/>

        <BodyLabel>Access Token:</BodyLabel>
        <InputBox value={this.state.config.github.accessToken} onChange={ev => this.setConfig(() => this.state.config.github.accessToken = ev.target.value)}/>
        <Space/>

        <BodyLabel>Path Prefix:</BodyLabel>
        <InputBox value={this.state.config.github.pathPrefix} onChange={ev => this.setConfig(() => this.state.config.github.pathPrefix = ev.target.value)}/>
        <Space/>

        <BodyLabel>API Interval(sec):</BodyLabel>
        <InputBox type='number'
                  value={this.state.config.github.interval}
                  onChange={ev => this.setConfig(() => this.state.config.github.interval = parseInt(ev.target.value || '10', 10))}
                  min={10}
        />
        <Space/>

        <BodyLabel>Web Host:</BodyLabel>
        <InputBox value={this.state.config.github.webHost} onChange={ev => this.setConfig(() => this.state.config.github.webHost = ev.target.value)}/>
        <Space/>

        <Row>
          <CheckBox type='checkbox' checked={this.state.config.github.https} onChange={ev => this.setConfig(() => this.state.config.github.https = ev.target.checked)}/>
          <BodyLabel>Use HTTPS</BodyLabel>
        </Row>
      </div>
    );
  }

  renderBrowse() {
    const display = this.state.body === 'browse' ? null : 'none';
    return (
      <div style={{display}}>
        <Select value={this.state.config.general.browser || 'builtin'} onChange={ev => this.setConfig(() => this.state.config.general.browser = ev.target.value as any)}>
          <option value='builtin'>Use Built-in Browser</option>
          <option value='external'>Use External Browser</option>
        </Select>
        <Space/>

        <Row>
          <CheckBox type='checkbox'
                    checked={this.state.config.general.alwaysOpenExternalUrlInExternalBrowser}
                    onChange={ev => this.setConfig(() => this.state.config.general.alwaysOpenExternalUrlInExternalBrowser = ev.target.checked)}
          /> Always open external URL in external browser
        </Row>
        <Space/>

        <Row>
          <CheckBox type='checkbox'
                    checked={this.state.config.general.onlyUnreadIssue}
                    onChange={ev => this.setConfig(() => this.state.config.general.onlyUnreadIssue = ev.target.checked)}
          /> Show only unread issues
        </Row>
      </div>
    );
  }

  renderNotification() {
    const display = this.state.body === 'notification' ? null : 'none';

    return (
      <div style={{display}}>
        <Row>
          <CheckBox type='checkbox'
                    checked={this.state.config.general.notification}
                    onChange={ev => this.setConfig(() => this.state.config.general.notification = ev.target.checked)}
          /> Enable notification
        </Row>
        <Space/>
        <Row>
          <CheckBox type='checkbox'
                    checked={this.state.config.general.notificationSilent}
                    onChange={ev => this.setConfig(() => this.state.config.general.notificationSilent = ev.target.checked)}
          /> Silent notification
        </Row>
        <Space/>
        <Row>
          <CheckBox type='checkbox'
                    checked={this.state.config.general.badge}
                    onChange={ev => this.setConfig(() => this.state.config.general.badge = ev.target.checked)}
          /> Display unread count badge in dock (Mac only)
        </Row>
        <Space/>
      </div>
    );
  }

  renderStorage() {
    const display = this.state.body === 'storage' ? null : 'none';

    return (
      <div style={{display}}>
        <BodyLabel>Current Records:</BodyLabel>
        <InputBox readOnly={true} value={this.state.currentRecord || ''}/>
        <Space/>

        <BodyLabel>Maximum Records:</BodyLabel>
        <InputBox type='number'
                  value={this.state.config.database.max}
                  onChange={ev => this.setConfig(() => this.state.config.database.max = parseInt(ev.target.value || '1000', 10))}
                  max={100000}
                  min={1000}
        />
        <Space/>
      </div>
    );
  }

  renderExport() {
    const display = this.state.body === 'export' ? null : 'none';

    return (
      <div style={{display}}>
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
      </div>
    );
  }

  renderDanger() {
    const display = this.state.body === 'danger' ? null : 'none';

    return (
      <div style={{display}}>
        <Row>
          <Button onClick={this.handleDeleteAllData.bind(this)}>Delete</Button>
          <BodyLabel style={{paddingLeft: space.medium}}>Delete all settings in Jasper.</BodyLabel>
        </Row>
      </div>
    );
  }
}

const Root = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: #00000088;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const Container = styled.div`
  background-color: #ffffff;
  width: 500px;
  height: 400px;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
`;

// side
const Side = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #eee;
  width: 120px;
`;

const SideRow = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: ${space.small}px ${space.medium}px;
  
  &.active {
    background-color: #ddd;
  }
`;

// body
const Body = styled.div`
  flex: 1;
  padding: ${space.large}px;
`;

const BodyLabel = styled.div`
  padding-right: ${space.medium}px;
`;

const InputBox = styled.input`
  border-radius: 4px;
  border: solid 1px #aaa;
  width: 100%;
  outline: none;
  
  &:focus {
    border-color: #4caaec;
  }
`;

const CheckBox = styled.input`
  margin: 0 ${space.small}px 0 0 !important; 
`;

const Row = styled.div`
  display: flex;
  align-items: center;
`;

const Space = styled.div`
  height: ${space.large}px;
`;

const Select = styled.select`
  width: 100%;
  padding: 4px;
  border: solid 1px #aaa;
  outline: none;
  border-radius: 4px;
`;

const Button = styled.div`
  background: #eee;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  border: solid 1px #ddd;
  min-width: 80px;
  text-align: center;
`;
