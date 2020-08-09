import React from 'react';
import ReactDOM from 'react-dom';
import {clipboard} from 'electron';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {LibraryStreamEvent} from '../../../Event/LibraryStreamEvent';
import {SystemStreamEvent} from '../../../Event/SystemStreamEvent';
import {StreamEvent} from '../../../Event/StreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {GARepo} from '../../../Repository/GARepo';
import {FilteredStreamRepo} from '../../../Repository/FilteredStreamRepo';
import {StreamPolling} from '../../../Infra/StreamPolling';
import {BaseStreamEntity, FilteredStreamEntity, StreamEntity} from '../../../Type/StreamEntity';
import {SideSection} from '../../../Component/SideSection';
import {SideSectionTitle} from '../../../Component/SideSectionTitle';
import styled from 'styled-components';
import {View} from '../../../Component/Core/View';
import {ClickView} from '../../../Component/Core/ClickView';
import {Icon} from '../../../Component/Core/Icon';
import {StreamRow} from '../../../Component/StreamRow';
import {ContextMenuType} from '../../../Component/Core/ContextMenu';
import {StreamEditorFragment} from './StreamEditorFragment';
import {FilteredStreamEditorFragment} from './FilteredStreamEditorFragment';

type Props = {
}

type State = {
  streams: StreamEntity[];
  filteredStreams: FilteredStreamEntity[];
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
    selectedStream: null,
    selectedFilteredStream: null,
    streamEditorShow: false,
    editingStream: null,
    filteredStreamEditorShow: false,
    editingFilteredStream: null,
    editingFilteredParentStream: null,
  };

  private stopLoadStream = false;

  componentDidMount() {
    this.loadStreams();

    LibraryStreamEvent.onSelectStream(this, () => {
      this.setState({selectedStream: null, selectedFilteredStream: null});
    });

    SystemStreamEvent.onUpdateStream(this, this.loadStreams.bind(this));
    SystemStreamEvent.onSelectStream(this, ()=>{
      this.setState({selectedStream: null, selectedFilteredStream: null});
    });
    SystemStreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

    StreamEvent.onUpdateStream(this, this.loadStreams.bind(this));
    StreamEvent.onSelectStream(this, (stream, filteredStream)=>{
      if (filteredStream) {
        this.setState({selectedStream: null, selectedFilteredStream: filteredStream});
      } else {
        this.setState({selectedStream: stream, selectedFilteredStream: null});
      }
    });
    StreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

    IssueEvent.onReadIssue(this, this.loadStreams.bind(this));
    IssueEvent.onReadIssues(this, this.loadStreams.bind(this));
    IssueEvent.addArchiveIssueListener(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this.loadStreams.bind(this));

    this.setupSorting();
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    LibraryStreamEvent.offAll(this);
    IssueEvent.offAll(this);
    SystemStreamEvent.offAll(this);
  }

  private setupSorting() {
    // hack: dom operation

    const rootEl = ReactDOM.findDOMNode(this);
    let bound;
    let mouseState = null;
    let targetEl, hoverEl, underEl;
    let diffX, diffY;

    rootEl.addEventListener('click', ()=>{
      mouseState = null;
    });

    rootEl.addEventListener('mousedown', (evt)=>{
      // ドラッグ -> 画面外に持っていく -> ドラッグ解除 -> 画面内に戻る -> ドラッグ解除
      // この手順を踏むと、mousedownが発生してしまうので、以下の条件で想定外の処理をブロックする。
      if (mouseState !== null && mouseState !== 'up') return;

      // only left click
      if (evt.button !== 0 || evt.ctrlKey) return;

      let target = evt.target;
      while (1) {
        if (target === rootEl) return;
        if (target.classList.contains('nav-group-item')) break;
        target = target.parentElement;
      }

      targetEl = target;
      bound = rootEl.getBoundingClientRect();
      diffX = evt.offsetX;
      diffY = evt.offsetY;

      mouseState = 'down';
    });

    rootEl.addEventListener('mousemove', (evt)=>{
      if (mouseState === 'down') {
        hoverEl = targetEl.cloneNode(true);
        hoverEl.classList.add('sorting-hover');
        rootEl.appendChild(hoverEl);
        targetEl.classList.add('sorting-target');
        mouseState = 'move';
        this.stopLoadStream = true;
      }

      if (mouseState !== 'move') return;

      hoverEl.style.top = `${evt.clientY - bound.top - diffY}px`;
      hoverEl.style.left = `${evt.clientX - bound.left - diffX}px`;

      if (underEl) underEl.classList.remove('sorting-under');
      underEl = document.elementsFromPoint(evt.clientX, evt.clientY).find((el)=> {
        return hoverEl !== el && el.classList.contains('nav-group-item')
      });
      if (!underEl) {
        underEl = document.elementsFromPoint(evt.clientX, evt.clientY).find((el)=> {
          return hoverEl !== el && el.classList.contains('nav-group-title');
        });
      }
      if (underEl) underEl.classList.add('sorting-under');
    });

    rootEl.addEventListener('mouseup', async (evt)=>{
      if (mouseState === 'move') {
        targetEl.classList.remove('sorting-target');
        evt.preventDefault();
        mouseState = 'up';
      }

      if (mouseState !== 'up') return;

      if (hoverEl) rootEl.removeChild(hoverEl);
      hoverEl = null;

      if (underEl) {
        // build new position order of streams
        const streamInfoList = [];
        if (underEl.classList.contains('nav-group-title')) {
          streamInfoList.push({
            type: targetEl.dataset.streamType,
            id: targetEl.dataset.streamId
          });
        }

        for (const streamEl of Array.from(rootEl.querySelectorAll('.nav-group-item'))) {
          if (streamEl === targetEl) continue;

          streamInfoList.push({
            type: (streamEl as HTMLElement).dataset.streamType,
            id: (streamEl as HTMLElement).dataset.streamId
          });

          if (streamEl === underEl) {
            streamInfoList.push({type: targetEl.dataset.streamType, id: targetEl.dataset.streamId});
          }
        }

        console.log(streamInfoList);

        // assign new position to stream
        const streams = this.state.streams;
        const filteredStreams = this.state.filteredStreams;
        for (let i = 0; i < streamInfoList.length; i++) {
          const streamId = parseInt(streamInfoList[i].id, 10);
          const streamType = streamInfoList[i].type;
          if (streamType === 'stream') {
            const stream = streams.find((stream)=> stream.id === streamId);
            stream.position = i;
          } else if (streamType === 'filteredStream') {
            const stream = filteredStreams.find((stream)=> stream.id === streamId);
            stream.position = i;
          }
        }
        streams.sort((a, b)=> a.position - b.position);
        filteredStreams.sort((a, b)=> a.position - b.position);
        this.setState({streams, filteredStreams});

        // update stream position in db
        await StreamRepo.updatePosition(streams);
        await FilteredStreamRepo.updatePosition(filteredStreams);
        underEl.classList.remove('sorting-under');
        underEl = null;
      }

      this.stopLoadStream = false;
      this.loadStreams();
    });
  }

  private async loadStreams() {
    if (this.stopLoadStream) return;

    const {error, streams} = await StreamRepo.getAllStreams();
    if (error) return console.error(error);

    const res = await FilteredStreamRepo.getAllFilteredStreams();
    if (res.error) return console.error(error);

    this.setState({streams, filteredStreams: res.filteredStreams});
  }

  // private async deleteStream(stream) {
  //   const {error} = await StreamRepo.deleteStream(stream.id);
  //   if (error) return console.error(error);
  //
  //   await StreamPolling.deleteStream(stream.id);
  //   StreamEvent.emitRestartAllStreams();
  // }

  // private handleClickWithStream(stream: StreamEntity) {
  //   StreamEvent.emitSelectStream(stream);
  //   this.setState({selectedStream: stream, selectedFilteredStream: null});
  //
  //   GARepo.eventStreamRead();
  // }

  // private handleClickWithFilteredStream(filteredStream: FilteredStreamEntity, stream: StreamEntity) {
  //   StreamEvent.emitSelectStream(stream, filteredStream);
  //   this.setState({selectedStream: null, selectedFilteredStream: filteredStream});
  //   GARepo.eventFilteredStreamRead();
  // }

  // private handleOpenStreamSetting() {
  //   StreamEvent.emitOpenStreamSetting();
  // }

  // private async handleContextMenuWithStream(stream, evt) {
    // evt.preventDefault();
    // const showCopyStream = evt.altKey;
    //
    // // hack: dom operation
    // const currentTarget = evt.currentTarget;
    // currentTarget.classList.add('focus');
    //
    // const menu = new Menu();
    //
    // menu.append(new MenuItem({
    //   label: 'Mark All as Read',
    //   click: async ()=>{
    //     if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
    //       // const {error} = await IssueRepo.readAll(stream.id);
    //       const {error} = await IssueRepo.updateReadAll(stream.id, stream.defaultFilter);
    //       if (error) return console.error(error);
    //       IssueEvent.emitReadAllIssues(stream.id);
    //       GARepo.eventStreamReadAll();
    //     }
    //   }
    // }));

    // if (showCopyStream) menu.append(new MenuItem({ type: 'separator' }));

    // menu.append(new MenuItem({
    //   label: 'Edit',
    //   click: ()=> {
    //     StreamEvent.emitOpenStreamSetting(stream);
    //   }
    // }));

    // if (showCopyStream) {
    //   menu.append(new MenuItem({
    //     label: 'Copy as URL',
    //     click: () => {
    //       const name = encodeURIComponent(stream.name);
    //       const queries = encodeURIComponent(stream.queries);
    //       const color = encodeURIComponent(stream.color);
    //       const notification = encodeURIComponent(stream.notification);
    //       const url = `jasperapp://stream?name=${name}&queries=${queries}&color=${color}&notification=${notification}`;
    //       electron.clipboard.writeText(url);
    //     }
    //   }));
    // }

    // menu.append(new MenuItem({ type: 'separator' }));
    //
    // menu.append(new MenuItem({
    //   label: 'Delete',
    //   click: async ()=>{
    //     if (confirm(`Do you delete "${stream.name}"?`)) {
    //       await this.deleteStream(stream);
    //       GARepo.eventStreamDelete();
    //     }
    //   }
    // }));

  //   menu.append(new MenuItem({ type: 'separator' }));
  //
  //   menu.append(new MenuItem({
  //     label: 'Create Filter',
  //     click: ()=> {
  //       StreamEvent.emitOpenFilteredStreamSetting(stream);
  //     }
  //   }));
  //
  //
  //   menu.popup({
  //     window: remote.getCurrentWindow(),
  //     callback: () => {
  //       // hack: dom operation
  //       currentTarget.classList.remove('focus');
  //     }
  //   });
  // }

  // private async handleContextMenuWithFilteredStream(filteredStream: FilteredStreamEntity, stream: StreamEntity, evt) {
  //   evt.preventDefault();
  //
  //   // hack: dom operation
  //   const currentTarget = evt.currentTarget;
  //   currentTarget.classList.add('focus');
  //
  //   const menu = new Menu();
  //
  //   // menu.append(new MenuItem({
  //   //   label: 'Mark All as Read',
  //   //   click: async ()=>{
  //   //     if (confirm(`Would you like to mark "${filteredStream.name}" all as read?`)) {
  //   //       // const {error} = await IssueRepo.readAll(stream.id, filteredStream.filter);
  //   //       const {error} = await IssueRepo.updateReadAll(filteredStream.stream_id, filteredStream.defaultFilter, filteredStream.filter);
  //   //       if (error) return console.error(error);
  //   //       IssueEvent.emitReadAllIssues(stream.id);
  //   //       GARepo.eventFilteredStreamReadAll();
  //   //     }
  //   //   }
  //   // }));
  //
  //   // menu.append(new MenuItem({
  //   //   label: 'Edit',
  //   //   click: ()=> {
  //   //     StreamEvent.emitOpenFilteredStreamSetting(stream, filteredStream.filter, filteredStream);
  //   //   }
  //   // }));
  //
  //   // menu.append(new MenuItem({ type: 'separator' }));
  //
  //   // menu.append(new MenuItem({
  //   //   label: 'Delete',
  //   //   click: async ()=>{
  //   //     if (confirm(`Do you delete "${filteredStream.name}"?`)) {
  //   //       const {error} = await FilteredStreamRepo.deleteFilteredStream(filteredStream.id);
  //   //       if (error) return console.error(error);
  //   //       StreamEvent.emitRestartAllStreams();
  //   //       GARepo.eventFilteredStreamDelete();
  //   //     }
  //   //   }
  //   // }));
  //
  //   // menu.popup({
  //   //   window: remote.getCurrentWindow(),
  //   //   callback: () => {
  //   //     // hack: dom operation
  //   //     currentTarget.classList.remove('focus');
  //   //   }
  //   // });
  // }

  private async handleSelectStream(stream: BaseStreamEntity) {
    if (stream.type === 'stream') {
      StreamEvent.emitSelectStream(stream);
      this.setState({selectedStream: stream as StreamEntity, selectedFilteredStream: null});
    } else if (stream.type === 'filteredStream') {
      const filteredStream = stream as FilteredStreamEntity;
      const parentStream = this.state.streams.find(s => s.id === filteredStream.stream_id);
      StreamEvent.emitSelectStream(parentStream, filteredStream);
      this.setState({selectedStream: null, selectedFilteredStream: filteredStream});
    }
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

      StreamEvent.emitRestartAllStreams();
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
      StreamEvent.emitRestartAllStreams();
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
      StreamEvent.emitRestartAllStreams();
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
  private handleCopyAsURL(stream: StreamEntity) {
    const name = encodeURIComponent(stream.name);
    const queries = encodeURIComponent(stream.queries);
    const color = encodeURIComponent(stream.color);
    const notification = encodeURIComponent(stream.notification);
    const url = `jasperapp://stream?name=${name}&queries=${queries}&color=${color}&notification=${notification}`;
    clipboard.writeText(url);
  }

  // private renderStreamNodes() {
  //   const streams = this.state.streams;
  //   const filteredStreams = this.state.filteredStreams;
  //   const mixedStreams = [...streams, ...filteredStreams].sort((a, b) => a.position - b.position);
  //
  //   return mixedStreams.map((stream) => {
  //     if (stream.filter) { // make node of filteredStream
  //       const filteredStream = stream;
  //       const originalStream = streams.find((stream) => stream.id === filteredStream.stream_id);
  //       const selected = this.state.selectedFilteredStream && this.state.selectedFilteredStream.id === filteredStream.id ? 'active' : '';
  //       const unread = filteredStream.unreadCount > 0 ? 'is-unread' : '';
  //       const style = {color: null};
  //       if (filteredStream.color) style.color = filteredStream.color;
  //
  //       return (
  //         <a key={'filtered-stream-' + filteredStream.id}
  //            title={filteredStream.name}
  //            data-stream-id={filteredStream.id}
  //            data-stream-type={'filteredStream'}
  //            className={`nav-group-item filtered-stream ${selected} ${unread}`}
  //            onClick={this.handleClickWithFilteredStream.bind(this, filteredStream, originalStream)}
  //            onContextMenu={this.handleContextMenuWithFilteredStream.bind(this, filteredStream, originalStream)}>
  //
  //           <span className="icon icon-flow-cascade" style={style}/>
  //           <span className="stream-name">{filteredStream.name}</span>
  //           <span className="stream-unread-count">{filteredStream.unreadCount}</span>
  //         </a>
  //       )
  //     } else { // make node of stream
  //       const selected = this.state.selectedStream && this.state.selectedStream.id === stream.id ? 'active' : '';
  //       const unread = stream.unreadCount > 0 ? 'is-unread' : '';
  //       const style = {color: null};
  //       if (stream.color) style.color = stream.color;
  //
  //       return (
  //         <a key={'stream-' + stream.id}
  //            title={stream.name}
  //            data-stream-id={stream.id}
  //            data-stream-type={'stream'}
  //            className={`nav-group-item ${selected} ${unread}`}
  //            onClick={this.handleClickWithStream.bind(this, stream)}
  //            onContextMenu={this.handleContextMenuWithStream.bind(this, stream)}>
  //
  //           <span className="icon icon-github" style={style}/>
  //           <span className="stream-name">{stream.name}</span>
  //           <span className="stream-unread-count">{stream.unreadCount}</span>
  //         </a>
  //       );
  //     }
  //   });
  // }

  render() {
    return (
      <SideSection>
        <Label>
          <SideSectionTitle>STREAMS</SideSectionTitle>
          <ClickView onClick={() => this.handleStreamEditorOpenAsCreate()}>
            <Icon name='plus' title='create stream'/>
          </ClickView>
        </Label>

        {/*{this.renderStreamNodes()}*/}
        {this.renderStreams()}

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
    const streams = this.state.streams;
    const filteredStreams = this.state.filteredStreams;
    const allStreams: BaseStreamEntity[] = [...streams, ...filteredStreams].sort((a, b) => a.position - b.position);

    return allStreams.map((stream, index) => {
      const menus: ContextMenuType[] = [
        {label: 'Mark All as Read', handler: () => this.handleReadAll(stream)},
        {label: 'Edit', handler: () => this.handleEditorOpenAsUpdate(stream)},
        {type: 'separator'},
        {label: 'Delete', handler: () => this.handleDelete(stream)},
        {type: 'separator'},
        {label: 'Create Stream', handler: () => this.handleStreamEditorOpenAsCreate()},
    ];

      if (stream.type === 'stream') {
        menus.push({label: 'Create Filter', handler: () => this.handleFilteredStreamEditorOpenAsCreate(stream as StreamEntity)});
      }

      const selected = this.state.selectedStream === stream || this.state.selectedFilteredStream === stream;
      return (
        <StreamRow
          key={index}
          stream={stream}
          onClick={() => this.handleSelectStream(stream)}
          contextMenuRows={menus}
          selected={selected}
        />
      );
    });
  }
}

const Label = styled(View)`
  flex-direction: row;
`;
