import React from 'react';
import ReactDOM from 'react-dom';
import electron from 'electron';
import SystemStreamCenter from '../SystemStreamCenter';
import SystemStreamEmitter from '../SystemStreamEmitter';
import StreamEmitter from '../StreamEmitter';
import LibraryStreamEmitter from '../LibraryStreamEmitter';
import IssueEmitter from '../IssueEmitter';
import IssueCenter from '../IssueCenter';
import SystemStreamSettingComponent from './SystemStreamSettingComponent'

const remote = electron.remote;
const Config = remote.require('./Config.js').default;
const Timer = remote.require('./Util/Timer.js').default;
const MenuItem = remote.MenuItem;
const Menu = remote.Menu;
const GA = remote.require('./Util/GA').default;

export default class SystemStreamsComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {streams: [], selectedStream: null};
    this._systemStreamListenerIds = [];
    this._streamListenerIds = [];
    this._libraryStreamListenerIds = [];
    this._issueListenerIds = [];
  }

  componentDidMount() {
    this._loadStreams();

    {
      let id;
      id = LibraryStreamEmitter.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._libraryStreamListenerIds.push(id);
    }

    {
      let id;
      id = SystemStreamEmitter.addUpdateStreamListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEmitter.addSelectStreamListener((stream)=>{
        if (stream.enabled) this.setState({selectedStream: stream});
      });
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEmitter.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);
    }

    {
      let id;
      id = StreamEmitter.addUpdateStreamListener(this._loadStreams.bind(this));
      this._streamListenerIds.push(id);

      id = StreamEmitter.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._streamListenerIds.push(id);

      id = StreamEmitter.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._streamListenerIds.push(id);
    }

    {
      let id;
      id = IssueEmitter.addReadIssueListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addReadIssuesListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addArchiveIssueListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addReadAllIssuesListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addReadAllIssuesFromLibraryListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);
    }
  }

  componentWillUnmount() {
    SystemStreamEmitter.removeListeners(this._systemStreamListenerIds);
    StreamEmitter.removeListeners(this._streamListenerIds);
    LibraryStreamEmitter.removeListeners(this._libraryStreamListenerIds);
    IssueEmitter.removeListeners(this._issueListenerIds);
  }

  async _loadStreams() {
    const streams = await SystemStreamCenter.findAllStreams();
    this.setState({streams: streams});
  }

  _handleClick(stream) {
    if (stream.enabled) {
      SystemStreamEmitter.emitSelectStream(stream);
      this.setState({selectedStream: stream});
      GA.eventSystemStreamRead(stream.name);
    }
  }

  async _handleContextMenu(stream, evt) {
    evt.preventDefault();

    // hack: dom operation
    const currentTarget = evt.currentTarget;
    currentTarget.classList.add('focus');
    await Timer.sleep(8);

    const menu = new Menu();
    menu.append(new MenuItem({
      label: 'Mark All as Read',
      click: ()=> {
        if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
          IssueCenter.readAll(stream.id);
          GA.eventSystemStreamReadAll(stream.name);
        }
      }
    }));

    menu.append(new MenuItem({
      label: 'Edit',
      click: ()=> SystemStreamEmitter.emitOpenStreamSetting(stream)
    }));

    if (stream.id === SystemStreamCenter.STREAM_ID_SUBSCRIPTION) {
      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Subscribe Issue',
        click: this._openSubscribeDialog.bind(this, stream)
      }));
    }

    menu.popup(remote.getCurrentWindow());

    // hack: dom operation
    currentTarget.classList.remove('focus');
  }

  _openSubscribeDialog() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    dialog.querySelector('#urlInput').value = '';
    dialog.showModal();
  }

  async _handleSubscriptionOK() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    const url = dialog.querySelector('#urlInput').value;
    if (!this._isIssueUrl(url)) return;

    dialog.close();
    await SystemStreamCenter.subscribe(url);
    await this._loadStreams();

    const stream = this.state.streams.find((stream)=> stream.id === SystemStreamCenter.STREAM_ID_SUBSCRIPTION);
    this._handleClick(stream);
  }

  _handleSubscriptionCancel() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    dialog.close();
  }

  _isIssueUrl(url) {
    if (!url) return false;
    const host = Config.webHost;

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

      <SystemStreamSettingComponent/>
    </nav>;
  }
}
