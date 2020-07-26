import React from 'react';
import electron from 'electron';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {IssueEvent} from '../../Event/IssueEvent';
import {LibraryStreamRepo} from '../../Repository/LibraryStreamRepo';
import {LibraryStreamEvent} from '../../Event/LibraryStreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {GARepo} from '../../Repository/GARepo';

const remote = electron.remote;
const MenuItem = remote.MenuItem;
const Menu = remote.Menu;

interface State {
  streams: any[];
  selectedStream: any;
}

export class LibraryStreamsFragment extends React.Component {
  state: State = {streams: [], selectedStream: null};
  private readonly _systemStreamListenerIds: number[] = [];
  private readonly _streamListenerIds: number[] = [];
  private readonly _libraryListenerIds: number[] = [];

  componentDidMount() {
    this._init();

    {
      let id;
      id = LibraryStreamEvent.addSelectFirstStreamListener(this._init.bind(this));
      this._libraryListenerIds.push(id);
    }

    {
      let id;
      id = SystemStreamEvent.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEvent.addUpdateStreamListener(()=>{
        this._loadStreams();
      });
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEvent.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);
    }

    {
      let id;
      id = StreamEvent.addSelectStreamListener(()=>{
        this.setState({selectedStream: null});
      });
      this._streamListenerIds.push(id);

      id = StreamEvent.addUpdateStreamListener(()=>{
        this._loadStreams();
      });
      this._streamListenerIds.push(id);

      id = StreamEvent.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._streamListenerIds.push(id);
    }

    IssueEvent.onReadIssue(this, this._loadStreams.bind(this));
    IssueEvent.onReadIssues(this, this._loadStreams.bind(this));
    IssueEvent.onMarkIssue(this, this._loadStreams.bind(this));
    IssueEvent.addArchiveIssueListener(this, this._loadStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this._loadStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this._loadStreams.bind(this));
  }

  componentWillUnmount() {
    LibraryStreamEvent.removeListeners(this._libraryListenerIds);
    StreamEvent.removeListeners(this._streamListenerIds);
    SystemStreamEvent.removeListeners(this._systemStreamListenerIds);
    IssueEvent.offAll(this);
  }

  async _init() {
    await this._loadStreams();
    const firstStream = this.state.streams[0];
    this._handleClick(firstStream);
  }

  async _loadStreams() {
    const streams = await LibraryStreamRepo.findAllStreams();
    this.setState({streams: streams});
  }

  _handleClick(stream) {
    this.setState({selectedStream: stream});
    LibraryStreamEvent.emitSelectStream(stream.name);

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
          IssueRepo.readAllFromLibrary(stream.name);
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
