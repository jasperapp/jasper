import React from 'react';
import ReactDOM from 'react-dom';
import electron from 'electron';
import {SystemStreamRepo} from '../../Repository/SystemStreamRepo';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {LibraryStreamEvent} from '../../Event/LibraryStreamEvent';
import {IssueEvent} from '../../Event/IssueEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {ModalSystemStreamSettingFragment} from './ModalSystemStreamSettingFragment'
import {GARepo} from '../../Repository/GARepo';
import {ConfigRepo} from '../../Repository/ConfigRepo';

const remote = electron.remote;
const MenuItem = remote.MenuItem;
const Menu = remote.Menu;

interface State {
  streams: any[];
  selectedStream: any;
}

export class SystemStreamsFragment extends React.Component<any, State> {
  state: State = {streams: [], selectedStream: null};
  private readonly _systemStreamListenerIds: number[] = [];
  private readonly _streamListenerIds: number[] = [];
  private readonly _libraryStreamListenerIds: number[] = [];

  componentDidMount() {
    this._loadStreams();

    {
      let id;
      id = LibraryStreamEvent.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._libraryStreamListenerIds.push(id);
    }

    {
      let id;
      id = SystemStreamEvent.addUpdateStreamListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEvent.addSelectStreamListener((stream)=>{
        if (stream.enabled) this.setState({selectedStream: stream});
      });
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEvent.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);
    }

    {
      let id;
      id = StreamEvent.addUpdateStreamListener(this._loadStreams.bind(this));
      this._streamListenerIds.push(id);

      id = StreamEvent.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._streamListenerIds.push(id);

      id = StreamEvent.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._streamListenerIds.push(id);
    }

    IssueEvent.onReadIssue(this, this._loadStreams.bind(this));
    IssueEvent.onReadIssues(this, this._loadStreams.bind(this));
    IssueEvent.addArchiveIssueListener(this, this._loadStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this._loadStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this._loadStreams.bind(this));
  }

  componentWillUnmount() {
    SystemStreamEvent.removeListeners(this._systemStreamListenerIds);
    StreamEvent.removeListeners(this._streamListenerIds);
    LibraryStreamEvent.removeListeners(this._libraryStreamListenerIds);
    IssueEvent.offAll(this);
  }

  async _loadStreams() {
    const streams = await SystemStreamRepo.findAllStreams();
    this.setState({streams: streams});
  }

  _handleClick(stream) {
    if (stream.enabled) {
      SystemStreamEvent.emitSelectStream(stream);
      this.setState({selectedStream: stream});
      GARepo.eventSystemStreamRead(stream.name);
    }
  }

  async _handleContextMenu(stream, evt) {
    evt.preventDefault();

    // hack: dom operation
    const currentTarget = evt.currentTarget;
    currentTarget.classList.add('focus');

    const menu = new Menu();
    menu.append(new MenuItem({
      label: 'Mark All as Read',
      click: ()=> {
        if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
          IssueRepo.readAll(stream.id);
          GARepo.eventSystemStreamReadAll(stream.name);
        }
      }
    }));

    menu.append(new MenuItem({
      label: 'Edit',
      click: ()=> SystemStreamEvent.emitOpenStreamSetting(stream)
    }));

    if (stream.id === SystemStreamRepo.STREAM_ID_SUBSCRIPTION) {
      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Subscribe Issue',
        click: this._openSubscribeDialog.bind(this, stream)
      }));
    }

    menu.popup({
      window: remote.getCurrentWindow(),
      callback: () => {
        // hack: dom operation
        currentTarget.classList.remove('focus');
      }
    });
  }

  _openSubscribeDialog() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    dialog.querySelector('#urlInput').value = '';
    dialog.showModal();
    SystemStreamEvent.emitOpenSubscriptionSetting();
  }

  async _handleSubscriptionOK() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    const url = dialog.querySelector('#urlInput').value;
    if (!this._isIssueUrl(url)) return;

    dialog.close();
    SystemStreamEvent.emitCloseSubscriptionSetting();

    await SystemStreamRepo.subscribe(url);
    await this._loadStreams();

    const stream = this.state.streams.find((stream)=> stream.id === SystemStreamRepo.STREAM_ID_SUBSCRIPTION);
    this._handleClick(stream);
  }

  _handleSubscriptionCancel() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    dialog.close();
    SystemStreamEvent.emitCloseSubscriptionSetting();
  }

  _isIssueUrl(url) {
    if (!url) return false;
    const host = ConfigRepo.getConfig().github.webHost;

    let isIssue = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/issues/\\d+$`));
    let isPR = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/pull/\\d+$`));

    return isIssue || isPR;
  }

  render() {
    function iconClassName(stream) {
      switch (stream.id) {
        case -1: return 'icon icon-user';
        case -2: return 'icon icon-users';
        case -3: return 'icon icon-eye';
        case -4: return 'icon icon-megaphone';
      }
    }

    function title(stream) {
      switch (stream.id) {
        case -1: return 'issues you created, assigned, commented, mentioned or your repository';
        case -2: return 'issues your team is mentioned in';
        case -3: return 'issues of repository you watch';
        case -4: return 'issues you subscribed to';
      }
    }

    const streamNodes = this.state.streams.map((stream)=>{
      const selected = this.state.selectedStream && this.state.selectedStream.id === stream.id ? 'active' : '';
      const enabled = stream.enabled ? 'enabled' : 'disabled';
      const unread = stream.unreadCount > 0 && stream.enabled ? 'is-unread' : '';
      return (
        <a key={stream.id}
           title={title(stream)}
           className={`nav-group-item ${selected} ${enabled} ${unread}`}
           onClick={this._handleClick.bind(this, stream)}
           onContextMenu={this._handleContextMenu.bind(this, stream)}>

          <span className={iconClassName(stream)}/>
          <span className="stream-name">{stream.name}</span>
          <span className="stream-unread-count">{stream.enabled ? stream.unreadCount : '-'}</span>
        </a>
      );
    });

    return <nav className="nav-group">
      <h5 className="nav-group-title">
        <span>SYSTEM</span>
      </h5>
      {streamNodes}

      <dialog className="add-subscription-url">
        <div className="window">
          <div className="window-content">

            <div>
              <p>Please enter issue url you want subscribe to.</p>
              <div className="form-group">
                <input id="urlInput" className="form-control" placeholder="https://github.com/foo/bar/issues/1"/>
              </div>

              <div className="form-actions">
                <button className="btn btn-form btn-default" onClick={this._handleSubscriptionCancel.bind(this)}>Cancel</button>
                <button className="btn btn-form btn-primary" onClick={this._handleSubscriptionOK.bind(this)}>OK</button>
              </div>
            </div>
          </div>
          <footer className="toolbar toolbar-footer"/>
        </div>
      </dialog>

      <ModalSystemStreamSettingFragment/>
    </nav>;
  }
}
