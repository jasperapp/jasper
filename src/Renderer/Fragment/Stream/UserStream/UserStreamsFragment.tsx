import React from 'react';
import {clipboard} from 'electron';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {StreamPolling} from '../../../Repository/Polling/StreamPolling';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {SideSection} from '../SideSection';
import {SideSectionTitle} from '../SideSectionTitle';
import styled from 'styled-components';
import {View} from '../../../Library/View/View';
import {StreamRow} from '../../../Library/View/StreamRow';
import {StreamEditorFragment} from './StreamEditorFragment';
import {FilterStreamEditorFragment} from './FilterStreamEditorFragment';
import {DraggableList} from '../../../Library/View/DraggableList';
import {StreamIPC} from '../../../../IPC/StreamIPC';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {space} from '../../../Library/Style/layout';
import {ProjectStreamEditorFragment} from './ProjectStreamEditorFragment';
import {ContextMenu, ContextMenuType} from '../../../Library/View/ContextMenu';
import {IconButton} from '../../../Library/View/IconButton';

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

  projectStreamEditorShow: boolean;
  editingProjectStream: StreamEntity;

  contextMenuShow: boolean;
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

    projectStreamEditorShow: false,
    editingProjectStream: null,

    contextMenuShow: false,
  };

  private streamDragging = false;
  private contextMenus: ContextMenuType[] = [];
  private contextMenuPos: {top: number; left: number};

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
    StreamEvent.onCreateFilterStream(this, (streamId, filter) => {
      const stream = this.state.streams.find(s => s.id === streamId);
      this.handleFilterStreamEditorOpenAsCreate(stream, filter);
    });
    StreamEvent.onFinishFirstSearching(this, (streamId) => {
      if (this.state.streams.find(s => s.id === streamId)) this.loadStreams();
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

    const {error, streams: allStreams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream', 'ProjectStream']);
    if (error) return console.error(error);
    const streams = allStreams.filter(s => s.enabled);
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

  private handleContextMenu(ev: React.MouseEvent) {
    this.contextMenus = [
      {label: 'Add Stream', icon: 'github', handler: () => this.handleStreamEditorOpenAsCreate()},
      {label: 'Add Filter Stream', subLabel: 'top-level', icon: 'file-tree', handler: () => this.handleFilterStreamEditorOpenAsCreate(null, '')},
      {label: 'Add Project Stream', icon: 'rocket-launch-outline', handler: () => this.handleProjectStreamEditorOpenAsCreate()},
    ];
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({contextMenuShow: true});
  }

  private async handleReadAll(stream: StreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(stream.queryStreamId, stream.defaultFilter, stream.userFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
    }
  }

  private async handleDelete(stream: StreamEntity) {
    if (confirm(`Do you delete "${stream.name}"?`)) {
      const {error} = await StreamRepo.deleteStream(stream.id);
      if (error) return console.error(error);

      await StreamPolling.deleteStream(stream.id);
      StreamEvent.emitReloadAllStreams();
    }
  }

  // user stream editor
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

  // filter stream editor
  private handleFilterStreamEditorOpenAsCreate(editingUserStream: StreamEntity | null, filter: string = '') {
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

  // project stream editor
  private handleProjectStreamEditorOpenAsCreate() {
    this.setState({projectStreamEditorShow: true, editingProjectStream: null});
  }

  private handleProjectStreamEditorOpenAsUpdate(editingStream: StreamEntity) {
    this.setState({projectStreamEditorShow: true, editingProjectStream: editingStream});
  }

  private async handleProjectStreamEditorClose(edited: boolean, streamId: number) {
    this.setState({projectStreamEditorShow: false, editingProjectStream: null});
    if (edited) {
      await StreamPolling.refreshStream(streamId);
      StreamEvent.emitReloadAllStreams();
    }
  }

  private handleEditorOpenAsUpdate(stream: StreamEntity) {
    if (stream.type === 'UserStream') {
      this.handleStreamEditorOpenAsUpdate(stream);
    } else if (stream.type === 'FilterStream') {
      this.handleFilterStreamEditorOpenAsUpdate(stream);
    } else if (stream.type === 'ProjectStream') {
      this.handleProjectStreamEditorOpenAsUpdate(stream);
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
          <IconButton name='dots-vertical' title='create stream' onClick={(ev) => this.handleContextMenu(ev)} style={{marginRight: space.tiny}}/>
        </Label>

        <DraggableList
          nodes={this.renderStreams()}
          onDragStart={() => this.handleDragStart()}
          onDragCancel={() => this.handleDragCancel()}
          onDragEnd={(sourceIndex, destIndex) => this.handleDragEnd(sourceIndex, destIndex)}
        />

        <ContextMenu
          show={this.state.contextMenuShow}
          onClose={() => this.setState({contextMenuShow: false})}
          pos={this.contextMenuPos}
          menus={this.contextMenus}
          hideBrowserView={false}
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

        <ProjectStreamEditorFragment
          show={this.state.projectStreamEditorShow}
          onClose={(edited, streamId) => this.handleProjectStreamEditorClose(edited, streamId)}
          editingStream={this.state.editingProjectStream}
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
          // onCreateStream={() => this.handleStreamEditorOpenAsCreate()}
          onCreateFilterStream={onCreateFilterStream}
          // onCreateProjectStream={() => this.handleProjectStreamEditorOpenAsCreate()}
          selected={selected}
          skipHandlerSameCheck={true}
        />
      );
    });
  }
}

const Label = styled(View)`
  flex-direction: row;
  align-items: center;
`;
