import React from 'react';
import {StreamIPCChannels} from '../../../../IPC/StreamIPC/StreamIPC.channel';
import {IssueEvent} from '../../../Event/IssueEvent';
import {StreamEvent} from '../../../Event/StreamEvent';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {StreamRow} from '../../../Library/View/StreamRow';
import {mc, rep, Translate} from '../../../Library/View/Translate';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {StreamId, StreamRepo} from '../../../Repository/StreamRepo';
import {SideSection} from '../SideSection';
import {SideSectionTitle} from '../SideSectionTitle';
import {LibraryStreamEditorFragment} from './LibraryStreamEditorFragment';

type Props = {
}

type State = {
  streams: StreamEntity[];
  selectedStream: StreamEntity;
  showEditor: boolean;
  editingStream: StreamEntity;
}

export class LibraryStreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    selectedStream: null,
    showEditor: false,
    editingStream: null,
  };

  selectStream(streamId: number) {
    const stream = this.state.streams.find(s => s.id === streamId);
    if (stream) this.handleSelectStream(stream);
  }

  getStreamIds(): {streamIds: number[]; selectedStreamId: number} {
    return {
      streamIds: this.state.streams.map(s => s.id),
      selectedStreamId: this.state.selectedStream?.id,
    };
  }

  componentDidMount() {
    this.loadStreams();

    StreamEvent.onSelectStream(this, (stream) => {
      const selectedStream = this.state.streams.find(s => s.id === stream.id);
      this.setState({selectedStream});
    });
    StreamEvent.onUpdateStreamIssues(this, () => this.loadStreams());
    StreamEvent.onReloadAllStreams(this, () => this.loadStreams());

    IssueEvent.onUpdateIssues(this, () => this.loadStreams());
    IssueEvent.onReadAllIssues(this, () => this.loadStreams());

    window.ipc.on(StreamIPCChannels.selectLibraryStreamInbox, () => this.handleSelectStreamById(StreamId.inbox));
    window.ipc.on(StreamIPCChannels.selectLibraryStreamUnread, () => this.handleSelectStreamById(StreamId.unread));
    window.ipc.on(StreamIPCChannels.selectLibraryStreamOpen, () => this.handleSelectStreamById(StreamId.open));
    window.ipc.on(StreamIPCChannels.selectLibraryStreamMark, () => this.handleSelectStreamById(StreamId.mark));
    window.ipc.on(StreamIPCChannels.selectLibraryStreamArchived, () => this.handleSelectStreamById(StreamId.archived));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadStreams() {
    const {error, streams: allStreams} = await StreamRepo.getAllStreams(['LibraryStream']);
    if (error) return console.error(error);
    const streams = allStreams.filter(s => s.enabled);
    this.setState({streams});
  }

  private handleSelectStream(stream: StreamEntity) {
    this.setState({selectedStream: stream});
    StreamEvent.emitSelectStream(stream);
  }

  private handleSelectStreamById(libraryStreamId: number) {
    const stream = this.state.streams.find(s => s.id === libraryStreamId);
    if (stream) this.handleSelectStream(stream);
  }

  private async handleReadAll(stream: StreamEntity) {
    const msg = rep(mc().systemStream.confirm.allRead, {name: stream.name}).join('');
    if (confirm(msg)) {
      const {error} = await IssueRepo.updateReadAll(null, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
    }
  }

  private async handleEditorOpen(stream: StreamEntity) {
    this.setState({showEditor: true, editingStream: stream});
  }

  private async handleEditorClose(edited: boolean, _streamId?: number) {
    this.setState({showEditor: false, editingStream: null});

    if (edited) {
      StreamEvent.emitReloadAllStreams();
    }
  }

  render() {
    if (!this.state.streams.length) return null;

    return (
      <SideSection>
        <SideSectionTitle><Translate onMessage={mc => mc.libraryStream.title}/></SideSectionTitle>
        {this.renderStreams()}

        <LibraryStreamEditorFragment
          show={this.state.showEditor}
          stream={this.state.editingStream}
          onClose={(edited, systemStreamId) => this.handleEditorClose(edited, systemStreamId)}
        />
      </SideSection>
    );
  }

  private renderStreams() {
    return this.state.streams.map(stream => {
      return (
        <StreamRow
          stream={stream}
          selected={this.state.selectedStream?.id === stream.id}
          onSelect={stream => this.handleSelectStream(stream)}
          onReadAll={stream => this.handleReadAll(stream)}
          onEdit={stream => this.handleEditorOpen(stream)}
          key={stream.id}
          skipHandlerSameCheck={true}
        />
      );
    });
  }
}
