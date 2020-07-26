import React from 'react';
import electron from 'electron';
import {SystemStreamEmitter} from '../SystemStreamEmitter';
import {StreamEmitter} from '../StreamEmitter';
import {IssueEmitter} from '../IssueEmitter';
import {LibraryStreamCenter} from '../LibraryStreamCenter';
import {LibraryStreamEmitter} from '../LibraryStreamEmitter';
import {IssueCenter} from '../IssueCenter';
import {GARepo} from '../Repository/GARepo';

const remote = electron.remote;
const MenuItem = remote.MenuItem;
const Menu = remote.Menu;

interface State {
  streams: any[];
  selectedStream: any;
}

export class LibraryStreamsComponent extends React.Component {
  state: State = {streams: [], selectedStream: null};
  private readonly _systemStreamListenerIds: number[] = [];
  private readonly _streamListenerIds: number[] = [];
  private readonly _libraryListenerIds: number[] = [];
  private readonly _issueListenerIds: number[] = [];

  componentDidMount() {
    this._init();

    {
      let id;
      id = LibraryStreamEmitter.addSelectFirstStreamListener(this._init.bind(this));
      this._libraryListenerIds.push(id);
    }

    {
      let id;
      id = SystemStreamEmitter.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEmitter.addUpdateStreamListener(()=>{
        this._loadStreams();
      });
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEmitter.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);
    }

    {
      let id;
      id = StreamEmitter.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._streamListenerIds.push(id);

      id = StreamEmitter.addUpdateStreamListener(()=>{
        this._loadStreams();
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

      id = IssueEmitter.addMarkIssueListener(this._loadStreams.bind(this));
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
    LibraryStreamEmitter.removeListeners(this._libraryListenerIds);
    StreamEmitter.removeListeners(this._streamListenerIds);
    SystemStreamEmitter.removeListeners(this._systemStreamListenerIds);
    IssueEmitter.removeListeners(this._issueListenerIds);
  }

  async _init() {
    await this._loadStreams();
    const firstStream = this.state.streams[0];
    this._handleClick(firstStream);
  }

  async _loadStreams() {
    const streams = await LibraryStreamCenter.findAllStreams();
    this.setState({streams: streams});
  }

  _handleClick(stream) {
    this.setState({selectedStream: stream});
    LibraryStreamEmitter.emitSelectStream(stream.name);

    GARepo.eventLibraryStreamRead(stream.name);
  }

  async _handleContextMenu(stream, evt) {
    evt.preventDefault();

    // hack: dom operation
    const currentTarget = evt.currentTarget;
    currentTarget.classList.add('focus');

    const menu = new Menu();

    menu.append(new MenuItem({
      label: 'Mark All as Read',
      click: ()=>{
        if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
          IssueCenter.readAllFromLibrary(stream.name);
          GARepo.eventLibraryStreamReadAll(stream.name);
        }
      }
    }));

    menu.popup({
      window: remote.getCurrentWindow(),
      callback: () => {
        // hack: dom operation
        currentTarget.classList.remove('focus');
      }
    });
  }

  render() {
    function icon(stream) {
      switch (stream.name) {
        case 'Inbox': return 'icon-inbox';
        case 'Unread': return 'icon-book';
        case 'Marked': return 'icon-star';
        case 'Open': return 'icon-doc-text';
        case 'Archived': return 'icon-archive';
      }
    }

    function name(stream) {
      switch (stream.name) {
        case 'Inbox': return 'Inbox';
        case 'Unread': return 'Unread';
        case 'Marked': return 'Star';
        case 'Open': return 'Open';
        case 'Archived': return 'Archive';
      }
    }

    function title(stream) {
      switch (stream.name) {
        case 'Inbox': return 'all issues';
        case 'Unread': return 'unread issues';
        case 'Marked': return 'stared issues';
        case 'Open': return 'open issues';
        case 'Archived': return 'archived issues';
      }
    }

    const nodes = this.state.streams.map((stream)=>{
      const active = this.state.selectedStream && this.state.selectedStream.name === stream.name ? 'active' : '';
      const unread = stream.unreadCount > 0 ? 'is-unread' : '';
      return (
        <a key={stream.name} className={`nav-group-item ${active} ${unread}`}
         onClick={this._handleClick.bind(this, stream)}
         onContextMenu={this._handleContextMenu.bind(this, stream)}
         title={title(stream)}>

          <span className={`icon ${icon(stream)}`}/>
          <span className="stream-name">{name(stream)}</span>
          <span className="stream-unread-count">{stream.unreadCount}</span>
        </a>);
    });

    return (
    <nav className="nav-group">
      <h5 className="nav-group-title">LIBRARY</h5>
      {nodes}
    </nav>
    );
  }
}
