import React from 'react';
import {SystemStreamId, SystemStreamRepo} from '../../../Repository/SystemStreamRepo';
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
import {BaseStreamEntity} from '../../../Library/Type/StreamEntity';

type Props = {
}

type State = {
  streams: BaseStreamEntity[];
  selectedStream: BaseStreamEntity;
  showSubscribeEditor: boolean;
  showEditor: boolean;
  editingStream: BaseStreamEntity;
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

    StreamIPC.onSelectSystemStreamMe(() => this.handleSelectStreamById(SystemStreamId.me));
    StreamIPC.onSelectSystemStreamTeam(() => this.handleSelectStreamById(SystemStreamId.team));
    StreamIPC.onSelectSystemStreamWatching(() => this.handleSelectStreamById(SystemStreamId.watching));
    StreamIPC.onSelectSystemStreamSubscription(() => this.handleSelectStreamById(SystemStreamId.subscription));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadStreams() {
    const {error, systemStreams} = await SystemStreamRepo.getAllSystemStreams();
    if (error) return console.error(error);
    this.setState({streams: systemStreams});
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

  private async handleReadAll(stream: BaseStreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(stream.id, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
      GARepo.eventSystemStreamReadAll(stream.name);
    }
  }

  private async handleEditorOpen(stream: BaseStreamEntity) {
    this.setState({showEditor: true, editingStream: stream});
  }

  private async handleEditorClose(edited: boolean, systemStreamId?: number) {
    this.setState({showEditor: false, editingStream: null});

    if (edited) {
      await StreamPolling.refreshSystemStream(systemStreamId);
      StreamEvent.emitReloadAllStreams();
    }
  }

  private async handleSubscribeEditorOpen() {
    this.setState({showSubscribeEditor: true});
  }

  private async handleSubscribeEditorClose(newSubscribe: boolean) {
    this.setState({showSubscribeEditor: false});
    if (newSubscribe) {
      await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
      StreamEvent.emitReloadAllStreams();
      await this.loadStreams();

      const stream = this.state.streams.find((stream)=> stream.id === SystemStreamId.subscription);
      this.handleSelectStream(stream);
    }
  }

  render() {
    return (
      <SideSection>
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
      if (stream.id === SystemStreamId.subscription) {
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
