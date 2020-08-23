import React from 'react';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {SystemStreamEditorFragment} from './SystemStreamEditorFragment'
import {GARepo} from '../../../Repository/GARepo';
import {StreamPolling} from '../../../Repository/Polling/StreamPolling';
import {StreamRow} from '../StreamRow';
import {SideSection} from '../SideSection';
import {SideSectionTitle} from '../SideSectionTitle';
import {SubscribeEditorFragment} from './SubscribeEditorFragment';
import {StreamIPC} from '../../../../IPC/StreamIPC';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {StreamId, StreamRepo} from '../../../Repository/StreamRepo';

type Props = {
}

type State = {
  streams: StreamEntity[];
  selectedStream: StreamEntity;
  showSubscribeEditor: boolean;
  showEditor: boolean;
  editingStream: StreamEntity;
}

export class SystemStreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    selectedStream: null,
    showSubscribeEditor: false,
    showEditor: false,
    editingStream: null,
  };

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

    StreamIPC.onSelectSystemStreamMe(() => this.handleSelectStreamById(StreamId.me));
    StreamIPC.onSelectSystemStreamTeam(() => this.handleSelectStreamById(StreamId.team));
    StreamIPC.onSelectSystemStreamWatching(() => this.handleSelectStreamById(StreamId.watching));
    StreamIPC.onSelectSystemStreamSubscription(() => this.handleSelectStreamById(StreamId.subscription));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadStreams() {
    const {error, streams} = await StreamRepo.getAllStreams(['systemStream']);
    if (error) return console.error(error);
    this.setState({streams});
  }

  private handleSelectStream(stream) {
    StreamEvent.emitSelectStream(stream);
    this.setState({selectedStream: stream});
    GARepo.eventSystemStreamRead(stream.name);
  }

  private handleSelectStreamById(systemStreamId: number) {
    const stream = this.state.streams.find(s => s.id === systemStreamId);
    if (stream) this.handleSelectStream(stream);
  }

  private async handleReadAll(stream: StreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(stream.id, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
      GARepo.eventSystemStreamReadAll(stream.name);
    }
  }

  private async handleEditorOpen(stream: StreamEntity) {
    this.setState({showEditor: true, editingStream: stream});
  }

  private async handleEditorClose(edited: boolean, streamId?: number) {
    this.setState({showEditor: false, editingStream: null});

    if (edited) {
      await StreamPolling.refreshStream(streamId);
      StreamEvent.emitReloadAllStreams();
    }
  }

  private async handleSubscribeEditorOpen() {
    this.setState({showSubscribeEditor: true});
  }

  private async handleSubscribeEditorClose(newSubscribe: boolean) {
    this.setState({showSubscribeEditor: false});
    if (newSubscribe) {
      await StreamPolling.refreshStream(StreamId.subscription);
      StreamEvent.emitReloadAllStreams();
      await this.loadStreams();

      const stream = this.state.streams.find((stream)=> stream.id === StreamId.subscription);
      this.handleSelectStream(stream);
    }
  }

  render() {
    const minHeight = this.state.streams.length ? 'fit-content' : 135;

    return (
      <SideSection style={{minHeight}}>
        <SideSectionTitle>SYSTEM</SideSectionTitle>
        {this.renderStreams()}

      <SystemStreamEditorFragment
        show={this.state.showEditor}
        stream={this.state.editingStream}
        onClose={(edited, systemStreamId) => this.handleEditorClose(edited, systemStreamId)}
      />

      <SubscribeEditorFragment
        show={this.state.showSubscribeEditor}
        onClose={(newSubscribe) => this.handleSubscribeEditorClose(newSubscribe)}
      />
    </SideSection>
    );
  }

  private renderStreams() {
    return this.state.streams.map((stream, index) => {
      let onSubscribe;
      if (stream.id === StreamId.subscription) {
        onSubscribe = () => this.handleSubscribeEditorOpen();
      }

      return (
        <StreamRow
          stream={stream}
          selected={this.state.selectedStream?.id === stream.id}
          onSelect={stream => this.handleSelectStream(stream)}
          onReadAll={stream => this.handleReadAll(stream)}
          onEdit={stream => this.handleEditorOpen(stream)}
          onSubscribe={onSubscribe}
          key={index}
        />
      );
    });
  }
}
