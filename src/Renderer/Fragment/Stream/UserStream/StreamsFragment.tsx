import React from 'react';
import {clipboard} from 'electron';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {GARepo} from '../../../Repository/GARepo';
import {FilteredStreamRepo} from '../../../Repository/FilteredStreamRepo';
import {StreamPolling} from '../../../Repository/Polling/StreamPolling';
import {BaseStreamEntity, FilteredStreamEntity, StreamEntity} from '../../../Type/StreamEntity';
import {SideSection} from '../../../Component/SideSection';
import {SideSectionTitle} from '../../../Component/SideSectionTitle';
import styled from 'styled-components';
import {View} from '../../../Component/Core/View';
import {ClickView} from '../../../Component/Core/ClickView';
import {Icon} from '../../../Component/Core/Icon';
import {StreamRow} from '../../../Component/StreamRow';
import {StreamEditorFragment} from './StreamEditorFragment';
import {FilteredStreamEditorFragment} from './FilteredStreamEditorFragment';
import {DraggableList} from '../../../Component/Core/DraggableList';
import {StreamIPC} from '../../../../IPC/StreamIPC';

type Props = {
}

type State = {
  streams: StreamEntity[];
  filteredStreams: FilteredStreamEntity[];
  allStreams: (StreamEntity | FilteredStreamEntity)[];
  selectedStream: StreamEntity;
  selectedFilteredStream: FilteredStreamEntity;
  streamEditorShow: boolean;
  editingStream: StreamEntity;
  filteredStreamEditorShow: boolean;
  editingFilteredStream: FilteredStreamEntity;
  editingFilteredParentStream: StreamEntity;
}

export class StreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    filteredStreams: [],
    allStreams: [],
    selectedStream: null,
    selectedFilteredStream: null,
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
      switch (stream.type) {
        case 'stream': return this.setState({selectedStream: (stream as StreamEntity), selectedFilteredStream: null});
        case 'filteredStream': return this.setState({selectedStream: null, selectedFilteredStream: (stream as FilteredStreamEntity)});
        default: return this.setState({selectedStream: null, selectedFilteredStream: null});
      }
    });
    StreamEvent.onUpdateStreamIssues(this, () => this.loadStreams());
    StreamEvent.onReloadAllStreams(this, () => this.loadStreams());

    IssueEvent.onReadIssue(this, this.loadStreams.bind(this));
    IssueEvent.onReadIssues(this, this.loadStreams.bind(this));
    IssueEvent.onArchiveIssue(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this.loadStreams.bind(this));

    StreamIPC.onSelectUserStream(index => this.handleSelectStreamByIndex(index));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadStreams() {
    if (this.streamDragging) return;

    const {error: error1, streams} = await StreamRepo.getAllStreams();
    if (error1) return console.error(error1);

    const {error: error2, filteredStreams} = await FilteredStreamRepo.getAllFilteredStreams();
    if (error2) return console.error(error2);

    const allStreams = [...streams, ...filteredStreams].sort((a, b) => a.position - b.position);

    this.setState({streams, filteredStreams, allStreams});
  }

  private async handleSelectStream(stream: BaseStreamEntity) {
    if (stream.type === 'stream') {
      StreamEvent.selectStream(stream);
      this.setState({selectedStream: stream as StreamEntity, selectedFilteredStream: null});
    } else if (stream.type === 'filteredStream') {
      StreamEvent.selectStream(stream);
      this.setState({selectedStream: null, selectedFilteredStream: stream as FilteredStreamEntity});
    }
  }

  private handleSelectStreamByIndex(index: number) {
    const stream = this.state.allStreams[index];
    if (stream) this.handleSelectStream(stream);
  }

  private async handleReadAll(stream: BaseStreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const streamId = stream.type === 'filteredStream' ? (stream as FilteredStreamEntity).stream_id : stream.id;
      const userFilter = stream.type === 'filteredStream' ? (stream as FilteredStreamEntity).filter : '';
      const defaultFilter = stream.defaultFilter;
      const {error} = await IssueRepo.updateReadAll(streamId, defaultFilter, userFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
      GARepo.eventFilteredStreamReadAll();
    }
  }

  private async handleDelete(stream: BaseStreamEntity) {
    if (confirm(`Do you delete "${stream.name}"?`)) {
      if (stream.type === 'stream') {
        const {error} = await StreamRepo.deleteStream(stream.id);
        if (error) return console.error(error);

        await StreamPolling.deleteStream(stream.id);
      } else if (stream.type === 'filteredStream') {
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

  private handleFilteredStreamEditorOpenAsUpdate(editingFilteredStream: FilteredStreamEntity) {
    const editingFilteredParentStream = this.state.streams.find(s => s.id === editingFilteredStream.stream_id);
    this.setState({filteredStreamEditorShow: true, editingFilteredParentStream, editingFilteredStream});
  }

  private handleFilteredStreamEditorClose(edited: boolean, _parentStreamId: number, _filteredStreamId: number) {
    this.setState({filteredStreamEditorShow: false, editingFilteredStream: null});
    if (edited) {
      // todo: Issuesが読み込み直すようにする
      StreamEvent.emitReloadAllStreams();
    }
  }

  private handleEditorOpenAsUpdate(stream: BaseStreamEntity) {
    if (stream.type === 'stream') {
      this.handleStreamEditorOpenAsUpdate(stream as StreamEntity);
    } else if (stream.type === 'filteredStream') {
      this.handleFilteredStreamEditorOpenAsUpdate(stream as FilteredStreamEntity);
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
    const allStreams = [...this.state.allStreams];
    const [removed] = allStreams.splice(sourceIndex, 1);
    allStreams.splice(destIndex, 0, removed);
    this.setState({allStreams});

    // ポジションを計算
    const updateStreams: StreamEntity[] = [];
    const updateFilteredStreams: FilteredStreamEntity[] = [];
    for (let i = 0; i < allStreams.length; i++) {
      const stream = allStreams[i];
      stream.position = i;
      if (stream.type === 'stream') {
        updateStreams.push(stream as StreamEntity);
      } else if (stream.type === 'filteredStream') {
        updateFilteredStreams.push(stream as FilteredStreamEntity);
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
    return this.state.allStreams.map(stream => {
      let selected = false;
      if (stream.type === 'stream' && this.state.selectedStream?.id === stream.id) {
        selected = true;
      } else if (stream.type === 'filteredStream' && this.state.selectedFilteredStream?.id === stream.id) {
        selected = true;
      }

      let onCreateFilteredStream;
      if (stream.type === 'stream') {
        onCreateFilteredStream = (stream: BaseStreamEntity) => this.handleFilteredStreamEditorOpenAsCreate(stream as StreamEntity);
      }

      return (
        <StreamRow
          key={`${stream.type}:${stream.id}`}
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
