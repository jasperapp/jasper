import React from 'react';
// import electron from 'electron';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {IssueEvent} from '../../Event/IssueEvent';
import {LibraryStreamRepo} from '../../Repository/LibraryStreamRepo';
import {LibraryStreamEvent} from '../../Event/LibraryStreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {GARepo} from '../../Repository/GARepo';
import {LibraryStreamEntity} from '../../Type/StreamEntity';
import {StreamRow} from '../../Component/StreamRow';
import {MenuType} from '../../Component/ContextMenu';

// const remote = electron.remote;
// const MenuItem = remote.MenuItem;
// const Menu = remote.Menu;

type Props = {
}

type State = {
  streams: LibraryStreamEntity[];
  selectedStream: LibraryStreamEntity;
}

export class LibraryStreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    selectedStream: null,
  };

  componentDidMount() {
    this.init();

    LibraryStreamEvent.onSelectFirstStream(this, this.init.bind(this));

    SystemStreamEvent.onSelectStream(this, () => this.setState({selectedStream: null}));
    SystemStreamEvent.onUpdateStream(this, () => this.fetchStreams());
    SystemStreamEvent.onRestartAllStreams(this, this.fetchStreams.bind(this));

    StreamEvent.onSelectStream(this, () => this.setState({selectedStream: null}));
    StreamEvent.onUpdateStream(this, () => this.fetchStreams());
    StreamEvent.onRestartAllStreams(this, this.fetchStreams.bind(this));

    IssueEvent.onReadIssue(this, this.fetchStreams.bind(this));
    IssueEvent.onReadIssues(this, this.fetchStreams.bind(this));
    IssueEvent.onMarkIssue(this, this.fetchStreams.bind(this));
    IssueEvent.addArchiveIssueListener(this, this.fetchStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this.fetchStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this.fetchStreams.bind(this));
  }

  componentWillUnmount() {
    LibraryStreamEvent.offAll(this);
    StreamEvent.offAll(this);
    SystemStreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async init() {
    await this.fetchStreams();
    const firstStream = this.state.streams[0];
    this.handleClick(firstStream);
  }

  private async fetchStreams() {
    const {error, libraryStreams} = await LibraryStreamRepo.getAllLibraryStreams();
    if (error) return console.error(error);
    this.setState({streams: libraryStreams});
  }

  private handleClick(stream: LibraryStreamEntity) {
    this.setState({selectedStream: stream});
    LibraryStreamEvent.emitSelectStream(stream.name);

    GARepo.eventLibraryStreamRead(stream.name);
  }

  // private async handleContextMenu(stream: LibraryStreamEntity, evt) {
  //   evt.preventDefault();
  //
  //   // hack: dom operation
  //   const currentTarget = evt.currentTarget;
  //   currentTarget.classList.add('focus');
  //
  //   const menu = new Menu();
  //
  //   menu.append(new MenuItem({
  //     label: 'Mark All as Read',
  //     click: async ()=>{
  //       if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
  //         // const {error} = await IssueRepo.readAllFromLibrary(stream.name);
  //         const {error} = await IssueRepo.updateReadAll(null, stream.defaultFilter);
  //         if (error) return console.error(error);
  //         IssueEvent.emitReadAllIssuesFromLibrary(stream.name);
  //         GARepo.eventLibraryStreamReadAll(stream.name);
  //       }
  //     }
  //   }));
  //
  //   menu.popup({
  //     window: remote.getCurrentWindow(),
  //     callback: () => {
  //       // hack: dom operation
  //       currentTarget.classList.remove('focus');
  //     }
  //   });
  // }

  private async handleMarkAllRead(stream: LibraryStreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(null, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssuesFromLibrary(stream.name);
      GARepo.eventLibraryStreamReadAll(stream.name);
    }
  }

  render() {
    // function icon(stream) {
    //   switch (stream.name) {
    //     case 'Inbox': return 'icon-inbox';
    //     case 'Unread': return 'icon-book';
    //     case 'Marked': return 'icon-star';
    //     case 'Open': return 'icon-doc-text';
    //     case 'Archived': return 'icon-archive';
    //   }
    // }
    //
    // function name(stream) {
    //   switch (stream.name) {
    //     case 'Inbox': return 'Inbox';
    //     case 'Unread': return 'Unread';
    //     case 'Marked': return 'Star';
    //     case 'Open': return 'Open';
    //     case 'Archived': return 'Archive';
    //   }
    // }
    //
    // function title(stream) {
    //   switch (stream.name) {
    //     case 'Inbox': return 'all issues';
    //     case 'Unread': return 'unread issues';
    //     case 'Marked': return 'stared issues';
    //     case 'Open': return 'open issues';
    //     case 'Archived': return 'archived issues';
    //   }
    // }

    // const nodes = this.state.streams.map((stream)=>{
    //   const active = this.state.selectedStream && this.state.selectedStream.name === stream.name ? 'active' : '';
    //   const unread = stream.unreadCount > 0 ? 'is-unread' : '';
    //   return (
    //     <a key={stream.name} className={`nav-group-item ${active} ${unread}`}
    //      onClick={this.handleClick.bind(this, stream)}
    //      onContextMenu={this.handleContextMenu.bind(this, stream)}
    //      title={title(stream)}>
    //
    //       <span className={`icon ${icon(stream)}`}/>
    //       <span className="stream-name">{name(stream)}</span>
    //       <span className="stream-unread-count">{stream.unreadCount}</span>
    //     </a>);
    // });

    return (
    <nav className="nav-group">
      <h5 className="nav-group-title">LIBRARY</h5>
      {/*{nodes}*/}
      {this.renderStreams()}
    </nav>
    );
  }

  private renderStreams() {
    const map = {
      Inbox: {icon: 'inbox'},
      Unread: {icon: 'folder'},
      Open: {icon: 'file-document'},
      Marked: {icon: 'star', name: 'Star'},
      Archived: {icon: 'archive'},
    }

    return this.state.streams.map((stream, index) => {
      const menus: MenuType[] = [
        {handler: () => this.handleMarkAllRead(stream), label: 'Mark All as Read'}
      ];

      return (
        <StreamRow
          stream={stream}
          iconName={map[stream.name].icon}
          name={map[stream.name].name}
          contextMenuRows={menus}
          selected={this.state.selectedStream?.name === stream.name}
          onClick={() => this.handleClick(stream)}
          key={index}
        />
      );
    });
  }
}
