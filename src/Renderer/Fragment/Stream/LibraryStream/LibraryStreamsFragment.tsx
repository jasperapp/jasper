import React from 'react';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {LibraryStreamId, LibraryStreamRepo} from '../../../Repository/LibraryStreamRepo';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {GARepo} from '../../../Repository/GARepo';
import {StreamRow} from '../StreamRow';
import {SideSectionTitle} from '../SideSectionTitle';
import {SideSection} from '../SideSection';
import {StreamIPC} from '../../../../IPC/StreamIPC';
import {BaseStreamEntity} from '../../../Library/Type/StreamEntity';

type Props = {
}

type State = {
  streams: BaseStreamEntity[];
  selectedStream: BaseStreamEntity;
}

export class LibraryStreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    selectedStream: null,
  };

  componentDidMount() {
    this.init();

    StreamEvent.onSelectLibraryFirstStream(this, () => this.init());
    StreamEvent.onSelectStream(this, (stream) => {
      const selectedStream = this.state.streams.find(s => s.id === stream.id);
      this.setState({selectedStream});
    });
    StreamEvent.onUpdateStreamIssues(this, () => this.loadStreams());
    StreamEvent.onReloadAllStreams(this, () => this.loadStreams());

    IssueEvent.onUpdateIssues(this, () => this.loadStreams());
    IssueEvent.onReadAllIssues(this, () => this.loadStreams());

    StreamIPC.onSelectLibraryStreamInbox(() => this.handleSelectStreamById(LibraryStreamId.inbox));
    StreamIPC.onSelectLibraryStreamUnread(() => this.handleSelectStreamById(LibraryStreamId.unread));
    StreamIPC.onSelectLibraryStreamOpen(() => this.handleSelectStreamById(LibraryStreamId.open));
    StreamIPC.onSelectLibraryStreamMark(() => this.handleSelectStreamById(LibraryStreamId.mark));
    StreamIPC.onSelectLibraryStreamArchived(() => this.handleSelectStreamById(LibraryStreamId.archived));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async init() {
    await this.loadStreams();
    const firstStream = this.state.streams[0];
    this.handleSelectStream(firstStream);
  }

  private async loadStreams() {
    const {error, libraryStreams} = await LibraryStreamRepo.getAllLibraryStreams();
    if (error) return console.error(error);
    this.setState({streams: libraryStreams});
  }

  private handleSelectStream(stream: BaseStreamEntity) {
    this.setState({selectedStream: stream});
    StreamEvent.emitSelectStream(stream);

    GARepo.eventLibraryStreamRead(stream.name);
  }

  private handleSelectStreamById(libraryStreamId: number) {
    const stream = this.state.streams.find(s => s.id === libraryStreamId);
    if (stream) this.handleSelectStream(stream);
  }

  private async handleReadAll(stream: BaseStreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(null, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
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
      return (
        <StreamRow
          stream={stream}
          selected={this.state.selectedStream?.name === stream.name}
          onSelect={stream => this.handleSelectStream(stream)}
          onReadAll={stream => this.handleReadAll(stream)}
          key={index}
        />
      );
    });
  }
}
