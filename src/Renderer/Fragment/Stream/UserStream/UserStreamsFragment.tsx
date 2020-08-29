import React from 'react';
import {clipboard} from 'electron';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {GARepo} from '../../../Repository/GARepo';
import {StreamPolling} from '../../../Repository/Polling/StreamPolling';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {SideSection} from '../SideSection';
import {SideSectionTitle} from '../SideSectionTitle';
import styled from 'styled-components';
import {View} from '../../../Library/View/View';
import {ClickView} from '../../../Library/View/ClickView';
import {Icon} from '../../../Library/View/Icon';
import {StreamRow} from '../StreamRow';
import {StreamEditorFragment} from './StreamEditorFragment';
import {FilterStreamEditorFragment} from './FilterStreamEditorFragment';
import {DraggableList} from '../../../Library/View/DraggableList';
import {StreamIPC} from '../../../../IPC/StreamIPC';
import {StreamRepo} from '../../../Repository/StreamRepo';

type Props = {
}

type State = {
  streams: StreamEntity[];
  selectedStream: StreamEntity;
  streamEditorShow: boolean;
  editingStream: StreamEntity;
  filterStreamEditorShow: boolean;
  editingFilterStream: StreamEntity;
  editingUserStream: StreamEntity;
  initialFilterForCreateFilterStream: string;
}

export class UserStreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    selectedStream: null,
    streamEditorShow: false,
    editingStream: null,
    filterStreamEditorShow: false,
    editingFilterStream: null,
    editingUserStream: null,
    initialFilterForCreateFilterStream: '',
  };

  private streamDragging = false;

  componentDidMount() {
    this.loadStreams();

    StreamEvent.onSelectStream(this, (stream) => {
      const selectedStream = this.state.streams.find(s => s.id === stream.id);
      this.setState({selectedStream});
    });
    StreamEvent.onUpdateStreamIssues(this, () => this.loadStreams());
    StreamEvent.onReloadAllStreams(this, () => this.loadStreams());
    StreamEvent.onCreateFilterStream(this, (streamId, filter) => {
      const stream = this.state.streams.find(s => s.id === streamId);
      this.handleFilterStreamEditorOpenAsCreate(stream, filter);
    });

    IssueEvent.onUpdateIssues(this, () => this.loadStreams());
    IssueEvent.onReadAllIssues(this, () => this.loadStreams());

    StreamIPC.onSelectUserStream(index => this.handleSelectStreamByIndex(index));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadStreams() {
    if (this.streamDragging) return;

    const {error, streams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream']);
    if (error) return console.error(error);
    this.setState({streams});
  }

  private async handleSelectStream(stream: StreamEntity) {
    this.setState({selectedStream: stream});
    StreamEvent.emitSelectStream(stream);
  }

  private handleSelectStreamByIndex(index: number) {
    const stream = this.state.streams[index];
    if (stream) this.handleSelectStream(stream);
  }

  private async handleReadAll(stream: StreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(stream.queryStreamId, stream.defaultFilter, stream.userFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
      GARepo.eventFilterStreamReadAll();
    }
  }

  private async handleDelete(stream: StreamEntity) {
    if (confirm(`Do you delete "${stream.name}"?`)) {
      const {error} = await StreamRepo.deleteStream(stream.id);
      if (error) return console.error(error);

      StreamEvent.emitReloadAllStreams();
    }
  }

  private handleStreamEditorOpenAsCreate() {
    this.setState({streamEditorShow: true, editingStream: null});
  }

  private handleStreamEditorOpenAsUpdate(editingStream: StreamEntity) {
    this.setState({streamEditorShow: true, editingStream});
  }

  private async handleStreamEditorClose(edited: boolean, streamId: number) {
    this.setState({streamEditorShow: false, editingStream: null});
    if (edited) {
      await StreamPolling.refreshStream(streamId);
      StreamEvent.emitReloadAllStreams();
    }
  }

  private handleFilterStreamEditorOpenAsCreate(editingUserStream: StreamEntity, filter: string = '') {
    this.setState({filterStreamEditorShow: true, editingUserStream, editingFilterStream: null, initialFilterForCreateFilterStream: filter});
  }

  private handleFilterStreamEditorOpenAsUpdate(editingFilterStream: StreamEntity) {
    const editingUserStream = this.state.streams.find(s => s.id === editingFilterStream.queryStreamId);
    this.setState({filterStreamEditorShow: true, editingUserStream, editingFilterStream, initialFilterForCreateFilterStream: ''});
  }

  private handleFilterStreamEditorClose(edited: boolean, _userStreamId: number, _filterStreamId: number) {
    this.setState({filterStreamEditorShow: false, editingFilterStream: null});
    if (edited) {
      // todo: Issuesが読み込み直すようにする
      StreamEvent.emitReloadAllStreams();
    }
  }

  private handleEditorOpenAsUpdate(stream: StreamEntity) {
    if (stream.type === 'UserStream') {
      this.handleStreamEditorOpenAsUpdate(stream as StreamEntity);
    } else if (stream.type === 'FilterStream') {
      this.handleFilterStreamEditorOpenAsUpdate(stream);
    }
  }

  // @ts-ignore
  // noinspection JSUnusedLocalSymbols
  private handleCopyAsURL(stream: StreamEntity) {
    const name = encodeURIComponent(stream.name);
    const queries = encodeURIComponent(JSON.stringify(stream.queries));
    const color = encodeURIComponent(stream.color);
    const notification = encodeURIComponent(stream.notification);
    const url = `jasperapp://stream?name=${name}&queries=${queries}&color=${color}&notification=${notification}`;
    clipboard.writeText(url);
  }

  private handleDragStart() {
    this.streamDragging = true;
  }

  private handleDragCancel() {
    this.streamDragging = false;
    this.loadStreams();
  }

  private async handleDragEnd(sourceIndex: number, destIndex: number) {
    // ドラッグの結果を使って並び替え
    const streams = [...this.state.streams];
    const [removed] = streams.splice(sourceIndex, 1);
    streams.splice(destIndex, 0, removed);
    this.setState({streams});

    // ポジションを更新
    streams.forEach((s, index) => s.position = index);
    const result = await StreamRepo.updatePositions(streams);
    this.streamDragging = false;
    if (result.error) return console.error(result.error);

    await this.loadStreams();
  }

  render() {
    return (
      <SideSection>
        <Label>
          <SideSectionTitle>STREAMS</SideSectionTitle>
          <ClickView onClick={() => this.handleStreamEditorOpenAsCreate()}>
            <Icon name='plus' title='create stream'/>
          </ClickView>
        </Label>

        <DraggableList
          nodes={this.renderStreams()}
          onDragStart={() => this.handleDragStart()}
          onDragCancel={() => this.handleDragCancel()}
          onDragEnd={(sourceIndex, destIndex) => this.handleDragEnd(sourceIndex, destIndex)}
        />

        <StreamEditorFragment
          show={this.state.streamEditorShow}
          onClose={(edited, streamId) => this.handleStreamEditorClose(edited, streamId)}
          editingStream={this.state.editingStream}
        />

        <FilterStreamEditorFragment
          show={this.state.filterStreamEditorShow}
          onClose={(edited, streamId, filterStreamId) => this.handleFilterStreamEditorClose(edited, streamId, filterStreamId)}
          editingUserStream={this.state.editingUserStream}
          editingFilterStream={this.state.editingFilterStream}
          initialFilter={this.state.initialFilterForCreateFilterStream}
        />
      </SideSection>
    );
  }

  private renderStreams() {
    return this.state.streams.map(stream => {
      const selected = stream.id === this.state.selectedStream?.id;

      let onCreateFilterStream;
      if (stream.type === 'UserStream') {
        onCreateFilterStream = (stream: StreamEntity) => this.handleFilterStreamEditorOpenAsCreate(stream);
      }

      return (
        <StreamRow
          key={stream.id}
          stream={stream}
          onSelect={stream => this.handleSelectStream(stream)}
          onReadAll={stream => this.handleReadAll(stream)}
          onEdit={stream => this.handleEditorOpenAsUpdate(stream)}
          onDelete={stream => this.handleDelete(stream)}
          onCreateStream={() => this.handleStreamEditorOpenAsCreate()}
          onCreateFilterStream={onCreateFilterStream}
          selected={selected}
        />
      );
    });
  }
}

const Label = styled(View)`
  flex-direction: row;
`;
