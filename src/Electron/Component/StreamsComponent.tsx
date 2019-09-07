import React from 'react';
import ReactDOM from 'react-dom';
import electron from 'electron';
import StreamCenter from '../StreamCenter';
import LibraryStreamEmitter from '../LibraryStreamEmitter';
import SystemStreamEmitter from '../SystemStreamEmitter';
import StreamEmitter from '../StreamEmitter';
import IssueEmitter from '../IssueEmitter';
import IssueCenter from '../IssueCenter';
import {RemoteGA as GA} from '../Remote';

const remote = electron.remote;
const MenuItem = remote.MenuItem;
const Menu = remote.Menu;

interface State {
  streams: any[];
  filteredStreams: any[];
  selectedStream: any;
  selectedFilteredStream: any;
}

export default class StreamsComponent extends React.Component<any, State> {
  state: State = {streams: [], filteredStreams: [], selectedStream: null, selectedFilteredStream: null};
  private readonly _systemStreamListenerIds: number[] = [];
  private readonly _streamListenerIds: number[] = [];
  private readonly _libraryStreamListenerIds: number[] = [];
  private readonly _issueListenerIds: number[] = [];
  private _stopLoadStream = false;

  componentDidMount() {
    this._loadStreams();

    {
      let id;
      id = LibraryStreamEmitter.addSelectStreamListener(()=>{
        this.setState({selectedStream: null, selectedFilteredStream: null});
      });
      this._libraryStreamListenerIds.push(id);
    }

    {
      let id;
      id = SystemStreamEmitter.addUpdateStreamListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEmitter.addSelectStreamListener(()=>{
        this.setState({selectedStream: null, selectedFilteredStream: null});
      });
      this._systemStreamListenerIds.push(id);

      id = SystemStreamEmitter.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._systemStreamListenerIds.push(id);
    }

    {
      let id;
      id = StreamEmitter.addUpdateStreamListener(this._loadStreams.bind(this));
      this._streamListenerIds.push(id);

      id = StreamEmitter.addSelectStreamListener((stream, filteredStream)=>{
        if (filteredStream) {
          this.setState({selectedStream: null, selectedFilteredStream: filteredStream});
        } else {
          this.setState({selectedStream: stream, selectedFilteredStream: null});
        }
      });
      this._streamListenerIds.push(id);

      id = StreamEmitter.addRestartAllStreamsListener(this._loadStreams.bind(this));
      this._streamListenerIds.push(id);
    }

    {
      let id;
      id = IssueEmitter.addReadIssueListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addReadIssuesListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addArchiveIssueListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addReadAllIssuesListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);

      id = IssueEmitter.addReadAllIssuesFromLibraryListener(this._loadStreams.bind(this));
      this._issueListenerIds.push(id);
    }

    this._setupSorting();
  }

  componentWillUnmount() {
    StreamEmitter.removeListeners(this._streamListenerIds);
    LibraryStreamEmitter.removeListeners(this._libraryStreamListenerIds);
    IssueEmitter.removeListeners(this._issueListenerIds);
    SystemStreamEmitter.removeListeners(this._systemStreamListenerIds);
  }

  _setupSorting() {
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
        this._stopLoadStream = true;
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
        await StreamCenter.updatePosition(streams);
        await StreamCenter.updatePositionForFilteredStream(filteredStreams);
        underEl.classList.remove('sorting-under');
        underEl = null;
      }

      this._stopLoadStream = false;
      this._loadStreams();
    });
  }

  async _loadStreams() {
    if (this._stopLoadStream) return;
    const streams = await StreamCenter.findAllStreams();
    const filteredStreams = await StreamCenter.findAllFilteredStreams();
    this.setState({streams, filteredStreams});
  }

  async _deleteStream(stream) {
    StreamCenter.deleteStream(stream.id);
  }

  _handleClickWithStream(stream) {
    StreamEmitter.emitSelectStream(stream);
    this.setState({selectedStream: stream, selectedFilteredStream: null});

    GA.eventStreamRead();
  }

  _handleClickWithFilteredStream(filteredStream, stream) {
    StreamEmitter.emitSelectStream(stream, filteredStream);
    this.setState({selectedStream: null, selectedFilteredStream: filteredStream});
    GA.eventFilteredStreamRead();
  }

  _handleOpenStreamSetting() {
    StreamEmitter.emitOpenStreamSetting();
  }

  async _handleContextMenuWithStream(stream, evt) {
    evt.preventDefault();
    const showCopyStream = evt.altKey;

    // hack: dom operation
    const currentTarget = evt.currentTarget;
    currentTarget.classList.add('focus');

    const menu = new Menu();

    menu.append(new MenuItem({
      label: 'Mark All as Read',
      click: ()=>{
        if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
          IssueCenter.readAll(stream.id);
          GA.eventStreamReadAll();
        }
      }
    }));

    if (showCopyStream) menu.append(new MenuItem({ type: 'separator' }));

    menu.append(new MenuItem({
      label: 'Edit',
      click: ()=> {
        StreamEmitter.emitOpenStreamSetting(stream);
      }
    }));

    if (showCopyStream) {
      menu.append(new MenuItem({
        label: 'Copy as URL',
        click: () => {
          const name = encodeURIComponent(stream.name);
          const queries = encodeURIComponent(stream.queries);
          const color = encodeURIComponent(stream.color);
          const notification = encodeURIComponent(stream.notification);
          const url = `jasperapp://stream?name=${name}&queries=${queries}&color=${color}&notification=${notification}`;
          electron.clipboard.writeText(url);
        }
      }));
    }

    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(new MenuItem({
      label: 'Delete',
      click: async ()=>{
        if (confirm(`Do you delete "${stream.name}"?`)) {
          await this._deleteStream(stream);
          GA.eventStreamDelete();
        }
      }
    }));

    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(new MenuItem({
      label: 'Create Filter',
      click: ()=> {
        StreamEmitter.emitOpenFilteredStreamSetting(stream);
      }
    }));


    menu.popup({
      window: remote.getCurrentWindow(),
      callback: () => {
        // hack: dom operation
        currentTarget.classList.remove('focus');
      }
    });
  }

  async _handleContextMenuWithFilteredStream(filteredStream, stream, evt) {
    evt.preventDefault();

    // hack: dom operation
    const currentTarget = evt.currentTarget;
    currentTarget.classList.add('focus');

    const menu = new Menu();

    menu.append(new MenuItem({
      label: 'Mark All as Read',
      click: ()=>{
        if (confirm(`Would you like to mark "${filteredStream.name}" all as read?`)) {
          IssueCenter.readAll(stream.id, filteredStream.filter);
          GA.eventFilteredStreamReadAll();
        }
      }
    }));

    menu.append(new MenuItem({
      label: 'Edit',
      click: ()=> {
        StreamEmitter.emitOpenFilteredStreamSetting(stream, filteredStream.filter, filteredStream);
      }
    }));

    menu.append(new MenuItem({ type: 'separator' }));

    menu.append(new MenuItem({
      label: 'Delete',
      click: async ()=>{
        if (confirm(`Do you delete "${filteredStream.name}"?`)) {
          await StreamCenter.deleteFilteredStream(filteredStream.id);
          GA.eventFilteredStreamDelete();
        }
      }
    }));

    menu.popup({
      window: remote.getCurrentWindow(),
      callback: () => {
        // hack: dom operation
        currentTarget.classList.remove('focus');
      }
    });
  }

  _renderStreamNodes() {
    const streams = this.state.streams;
    const filteredStreams = this.state.filteredStreams;
    const mixedStreams = [...streams, ...filteredStreams].sort((a, b) => a.position - b.position);

    return mixedStreams.map((stream) => {
      if (stream.filter) { // make node of filteredStream
        const filteredStream = stream;
        const originalStream = streams.find((stream) => stream.id === filteredStream.stream_id);
        const selected = this.state.selectedFilteredStream && this.state.selectedFilteredStream.id === filteredStream.id ? 'active' : '';
        const unread = filteredStream.unreadCount > 0 ? 'is-unread' : '';
        const style = {color: null};
        if (filteredStream.color) style.color = filteredStream.color;

        return (
          <a key={'filtered-stream-' + filteredStream.id}
             title={filteredStream.name}
             data-stream-id={filteredStream.id}
             data-stream-type={'filteredStream'}
             className={`nav-group-item filtered-stream ${selected} ${unread}`}
             onClick={this._handleClickWithFilteredStream.bind(this, filteredStream, originalStream)}
             onContextMenu={this._handleContextMenuWithFilteredStream.bind(this, filteredStream, originalStream)}>

            <span className="icon icon-flow-cascade" style={style}/>
            <span className="stream-name">{filteredStream.name}</span>
            <span className="stream-unread-count">{filteredStream.unreadCount}</span>
          </a>
        )
      } else { // make node of stream
        const selected = this.state.selectedStream && this.state.selectedStream.id === stream.id ? 'active' : '';
        const unread = stream.unreadCount > 0 ? 'is-unread' : '';
        const style = {color: null};
        if (stream.color) style.color = stream.color;

        return (
          <a key={'stream-' + stream.id}
             title={stream.name}
             data-stream-id={stream.id}
             data-stream-type={'stream'}
             className={`nav-group-item ${selected} ${unread}`}
             onClick={this._handleClickWithStream.bind(this, stream)}
             onContextMenu={this._handleContextMenuWithStream.bind(this, stream)}>

            <span className="icon icon-github" style={style}/>
            <span className="stream-name">{stream.name}</span>
            <span className="stream-unread-count">{stream.unreadCount}</span>
          </a>
        );
      }
    });
  }

  render() {
    return <nav className="nav-group sortable-nav-group">
      <h5 className="nav-group-title">
        <span>STREAMS</span>
        <span className="icon icon-plus stream-add" onClick={this._handleOpenStreamSetting.bind(this)} title="create stream"/>
      </h5>
      {this._renderStreamNodes()}
    </nav>;
  }
}
