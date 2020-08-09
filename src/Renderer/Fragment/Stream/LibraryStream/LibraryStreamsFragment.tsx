import React from 'react';
import {SystemStreamEvent} from '../../../Event/SystemStreamEvent';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {LibraryStreamRepo} from '../../../Repository/LibraryStreamRepo';
import {LibraryStreamEvent} from '../../../Event/LibraryStreamEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {GARepo} from '../../../Repository/GARepo';
import {LibraryStreamEntity} from '../../../Type/StreamEntity';
import {StreamRow} from '../../../Component/StreamRow';
import {MenuType} from '../../../Component/Core/ContextMenu';
import {SideSectionTitle} from '../../../Component/SideSectionTitle';
import {SideSection} from '../../../Component/SideSection';

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
    SystemStreamEvent.onUpdateStream(this, () => this.loadStreams());
    SystemStreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

    StreamEvent.onSelectStream(this, () => this.setState({selectedStream: null}));
    StreamEvent.onUpdateStream(this, () => this.loadStreams());
    StreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

    IssueEvent.onReadIssue(this, this.loadStreams.bind(this));
    IssueEvent.onReadIssues(this, this.loadStreams.bind(this));
    IssueEvent.onMarkIssue(this, this.loadStreams.bind(this));
    IssueEvent.addArchiveIssueListener(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this.loadStreams.bind(this));
  }

  componentWillUnmount() {
    LibraryStreamEvent.offAll(this);
    StreamEvent.offAll(this);
    SystemStreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async init() {
    await this.loadStreams();
    const firstStream = this.state.streams[0];
    this.handleClick(firstStream);
  }

  private async loadStreams() {
    const {error, libraryStreams} = await LibraryStreamRepo.getAllLibraryStreams();
    if (error) return console.error(error);
    this.setState({streams: libraryStreams});
  }

  private handleClick(stream: LibraryStreamEntity) {
    this.setState({selectedStream: stream});
    LibraryStreamEvent.emitSelectStream(stream.name);

    GARepo.eventLibraryStreamRead(stream.name);
  }

  private async handleMarkAllRead(stream: LibraryStreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(null, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssuesFromLibrary(stream.name);
      GARepo.eventLibraryStreamReadAll(stream.name);
    }
  }

  render() {
    return (
      <SideSection>
        <SideSectionTitle>LIBRARY</SideSectionTitle>
        {this.renderStreams()}
      </SideSection>
    );
  }

  private renderStreams() {
    return this.state.streams.map((stream, index) => {
      const menus: MenuType[] = [
        {label: 'Mark All as Read', handler: () => this.handleMarkAllRead(stream)},
      ];

      return (
        <StreamRow
          stream={stream}
          contextMenuRows={menus}
          selected={this.state.selectedStream?.name === stream.name}
          onClick={() => this.handleClick(stream)}
          key={index}
        />
      );
    });
  }
}