import React from 'react';
import {clipboard} from 'electron';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {GARepo} from '../../../Repository/GARepo';
import {FilteredStreamRepo} from '../../../Repository/FilteredStreamRepo';
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
import {FilteredStreamEditorFragment} from './FilteredStreamEditorFragment';
import {DraggableList} from '../../../Library/View/DraggableList';
import {StreamIPC} from '../../../../IPC/StreamIPC';

type Props = {
}

type State = {
  streams: StreamEntity[];
  selectedStream: StreamEntity;
  streamEditorShow: boolean;
  editingStream: StreamEntity;
  filteredStreamEditorShow: boolean;
  editingFilteredStream: StreamEntity;
  editingFilteredParentStream: StreamEntity;
}

export class StreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    selectedStream: null,
    streamEditorShow: false,
    editingStream: null,
    filteredStreamEditorShow: false,
    editingFilteredStream: null,
    editingFilteredParentStream: null,
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

    IssueEvent.onUpdateIssues(this, () => this.loadStreams());
    IssueEvent.onReadAllIssues(this, () => this.loadStreams());

    StreamIPC.onSelectUserStream(index => this.handleSelectStreamByIndex(index));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  // todo: 移動する？
  private isUserStream(stream: StreamEntity) {
    return stream.id === stream.queryStreamId;
  }

  // todo: 移動する？
  private isSubStream(stream: StreamEntity) {
    return !!stream.filter;
  }

  private async loadStreams() {
    if (this.streamDragging) return;

    const {error: error1, streams} = await StreamRepo.getAllStreams();
    if (error1) return console.error(error1);

    const {error: error2, filteredStreams} = await FilteredStreamRepo.getAllFilteredStreams();
    if (error2) return console.error(error2);

    const allStreams = [...streams, ...filteredStreams].sort((a, b) => a.position - b.position);

    this.setState({streams: allStreams});
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
      const {error} = await IssueRepo.updateReadAll(stream.queryStreamId, stream.defaultFilter, stream.filter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
      GARepo.eventFilteredStreamReadAll();
    }
  }

  private async handleDelete(stream: StreamEntity) {
    if (confirm(`Do you delete "${stream.name}"?`)) {
      if (this.isUserStream(stream)) {
        const {error} = await StreamRepo.deleteStream(stream.id);
        if (error) return console.error(error);
        await StreamPolling.deleteStream(stream.id);
      } else if (this.isSubStream(stream)) {
        const {error} = await FilteredStreamRepo.deleteFilteredStream(stream.id);
        if (error) return console.error(error);
      }

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

  private handleFilteredStreamEditorOpenAsCreate(editingFilteredParentStream: StreamEntity) {
    this.setState({filteredStreamEditorShow: true, editingFilteredParentStream, editingFilteredStream: null});
  }

  private handleFilteredStreamEditorOpenAsUpdate(editingFilteredStream: StreamEntity) {
    const editingFilteredParentStream = this.state.streams.find(s => s.id === editingFilteredStream.queryStreamId);
    this.setState({filteredStreamEditorShow: true, editingFilteredParentStream, editingFilteredStream});
  }

  private handleFilteredStreamEditorClose(edited: boolean, _parentStreamId: number, _filteredStreamId: number) {
    this.setState({filteredStreamEditorShow: false, editingFilteredStream: null});
    if (edited) {
      // todo: Issuesが読み込み直すようにする
      StreamEvent.emitReloadAllStreams();
    }
  }

  private handleEditorOpenAsUpdate(stream: StreamEntity) {
    if (this.isUserStream(stream)) {
      this.handleStreamEditorOpenAsUpdate(stream as StreamEntity);
    } else if (this.isSubStream(stream)) {
      this.handleFilteredStreamEditorOpenAsUpdate(stream);
    }
  }

  // @ts-ignore
  // noinspection JSUnusedLocalSymbols
  private handleCopyAsURL(stream: StreamEntity) {
    const name = encodeURIComponent(stream.name);
    const queries = encodeURIComponent(stream.queries);
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

    // ポジションを計算
    const updateStreams: StreamEntity[] = [];
    const updateFilteredStreams: StreamEntity[] = [];
    for (let i = 0; i < streams.length; i++) {
      const stream = streams[i];
      stream.position = i;
      if (this.isUserStream(stream)) {
        updateStreams.push(stream as StreamEntity);
      } else if (this.isSubStream(stream)) {
        updateFilteredStreams.push(stream);
      }
    }

    // ポジションを更新
    // noinspection ES6MissingAwait
    const promises = [
      StreamRepo.updatePositions(updateStreams),
      FilteredStreamRepo.updatePositions(updateFilteredStreams),
    ];
    const results = await Promise.all(promises);
    this.streamDragging = false;

    // エラー取得
    const error = results.find(res => res.error)?.error;
    if (error) return console.error(error);

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

        <FilteredStreamEditorFragment
          show={this.state.filteredStreamEditorShow}
          onClose={(edited, streamId, filteredStreamId) => this.handleFilteredStreamEditorClose(edited, streamId, filteredStreamId)}
          editingFilteredParentStream={this.state.editingFilteredParentStream}
          editingFilteredStream={this.state.editingFilteredStream}
        />
      </SideSection>
    );
  }

  private renderStreams() {
    return this.state.streams.map(stream => {
      const selected = stream.id === this.state.selectedStream?.id;

      let onCreateFilteredStream;
      if (this.isUserStream(stream)) {
        onCreateFilteredStream = (stream: StreamEntity) => this.handleFilteredStreamEditorOpenAsCreate(stream);
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
          onCreateFilteredStream={onCreateFilteredStream}
          selected={selected}
        />
      );
    });
  }
}

const Label = styled(View)`
  flex-direction: row;
`;
