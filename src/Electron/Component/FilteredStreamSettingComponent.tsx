import React from 'react';
import ReactDOM from 'react-dom';
import {StreamEmitter} from '../StreamEmitter';
import {StreamCenter} from '../StreamCenter';
import {RemoteGA as GA} from '../Remote';

interface State {
  queries: string[];
}

export default class FilteredStreamSettingComponent extends React.Component<any, State> {
  state: State = {queries: []};
  private readonly _streamListenerIds: number[] = [];
  private _stream: any = null;
  private _filteredStream: any = null;
  private _originalHeight: string = null;

  componentDidMount() {
    {
      let id;
      id = StreamEmitter.addOpenFilteredStreamSettingListener(this._show.bind(this));
      this._streamListenerIds.push(id);
    }

    const dialog = ReactDOM.findDOMNode(this);
    this._originalHeight = window.getComputedStyle(dialog).height;
    dialog.addEventListener('close', ()=>{
      StreamEmitter.emitCloseFilteredStreamSetting(this._stream);
    });
  }

  componentWillUnmount() {
    StreamEmitter.removeListeners(this._streamListenerIds);
  }

  _show(stream, filter, filteredStream) {
    this._stream = stream;
    this._filteredStream = filteredStream;
    const dialog = ReactDOM.findDOMNode(this);
    if (filteredStream) {
      dialog.querySelector('#nameInput').value = filteredStream.name;
      dialog.querySelector('#filterInput').value = filteredStream.filter;
      dialog.querySelector('#notificationInput').checked = filteredStream.notification === 1;
      dialog.querySelector('#colorInput').value = filteredStream.color;
      dialog.querySelector('.icon-flow-cascade').style.color = filteredStream.color;
    } else {
      dialog.querySelector('#nameInput').value = `- My Filter`;
      dialog.querySelector('#filterInput').value = filter;
      dialog.querySelector('#notificationInput').checked = stream.notification === 1;
      dialog.querySelector('#colorInput').value = stream.color;
      dialog.querySelector('.icon-flow-cascade').style.color = stream.color;
    }

    dialog.querySelector('#streamName').textContent = stream.name;
    const queries = JSON.parse(stream.queries);
    this._updateHeight(queries.length);
    this.setState({queries});

    dialog.showModal();
  }

  _updateHeight(queryCount) {
    const dialog = ReactDOM.findDOMNode(this);
    const addHeight = Math.max(36 * (queryCount - 1), 0); // 36px is height of query input
    dialog.style.height = `calc(${this._originalHeight} + ${addHeight}px)`;
  }

  _handleCancel() {
    const dialog = ReactDOM.findDOMNode(this);
    dialog.close();
  }

  async _handleOK() {
    const name = ReactDOM.findDOMNode(this).querySelector('#nameInput').value;
    const filter = ReactDOM.findDOMNode(this).querySelector('#filterInput').value;
    const notification = ReactDOM.findDOMNode(this).querySelector('#notificationInput').checked ? 1 : 0;
    const color = ReactDOM.findDOMNode(this).querySelector('#colorInput').value;

    if (color && !color.match(/^#[0-9A-Fa-f]{3,6}$/)) {
      return;
    }

    if (name && filter) {
      const dialog = ReactDOM.findDOMNode(this);
      dialog.close();

      if (this._filteredStream) {
        StreamCenter.rewriteFilteredStream(this._filteredStream.id, name, filter, notification, color);
      } else {
        await StreamCenter.createFilteredStream(this._stream, name, filter, notification, color);
        GA.eventFilteredStreamCreate();
      }
    }
  }

  _handleColor() {
    // hack: dom operation
    const color = ReactDOM.findDOMNode(this).querySelector('#colorInput').value;
    const icon = ReactDOM.findDOMNode(this).querySelector('.icon-flow-cascade');
    icon.style.color = color;
  }

  _handleColorPalette(evt) {
    // hack: dom operation
    const color = evt.target.title.toLowerCase();
    ReactDOM.findDOMNode(this).querySelector('#colorInput').value = color;
    this._handleColor();
  }

  _handleHelp() {
    const shell = require('electron').shell;
    shell.openExternal('https://jasperapp.io/doc.html#filter');
  }

  render() {
    const queryNodes = this.state.queries.map((query, index) => {
      return <div key={index}>{query}</div>;
    });

    return (
      <dialog className="stream-setting filtered-stream-setting">
        <div className="window">
          <div className="window-content">

            <div>
              <div className="form-group from-stream">
                <label><span>Stream: </span><span id="streamName"/></label>
                {queryNodes}
              </div>

              <div className="form-group" title="filter name">
                <label>Filter Name</label>
                <input id="nameInput" className="form-control" placeholder="filtered stream name"/>
              </div>

              <div className="form-group" title="filter query">
                <label>Filter <span className="help-link" onClick={this._handleHelp.bind(this)}>help</span></label>
                <input id="filterInput" className="form-control" placeholder="is:pr author:octocat"/>
              </div>

              <div className="form-group" title="stream icon color">
                <span>
                  <label>Color</label>
                  <span className="color-palette" title="#b60205" style={{background: '#b60205'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#d93f0b" style={{background: '#d93f0b'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#fbca04" style={{background: '#fbca04'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#0e8a16" style={{background: '#0e8a16'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#006b75" style={{background: '#006b75'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#1d76db" style={{background: '#1d76db'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#0052cc" style={{background: '#0052cc'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#5319e7" style={{background: '#5319e7'}} onClick={this._handleColorPalette.bind(this)}/>

                  <span className="color-palette" title="#e3807f" style={{background: '#e3807f'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#F8A891" style={{background: '#F8A891'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#FAE380" style={{background: '#FAE380'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#7CD688" style={{background: '#7CD688'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#7ED4DB" style={{background: '#7ED4DB'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#8EC4F5" style={{background: '#8EC4F5'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#8AB3EE" style={{background: '#8AB3EE'}} onClick={this._handleColorPalette.bind(this)}/>
                  <span className="color-palette" title="#AC8EF6" style={{background: '#AC8EF6'}} onClick={this._handleColorPalette.bind(this)}/>
                </span>
                <input id="colorInput" className="form-control" placeholder="#aabbcc" onKeyUp={this._handleColor.bind(this)}/>
                <span className="icon icon-flow-cascade"/>
              </div>

              <div className="form-actions split-buttons">
                <label>
                  <input type="checkbox" id="notificationInput"/> Notification
                </label>
                <span className="flex-stretch"/>
                <button className="btn btn-form btn-default" onClick={this._handleCancel.bind(this)}>Cancel</button>
                <button className="btn btn-form btn-primary" onClick={this._handleOK.bind(this)}>OK</button>
              </div>
            </div>
          </div>

          <footer className="toolbar toolbar-footer"/>
        </div>
      </dialog>
    );
  }
}
