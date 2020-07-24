import React from 'react';
import ReactDOM from 'react-dom';
import electron from 'electron';
import {StreamEmitter} from '../StreamEmitter';
import {StreamCenter} from '../StreamCenter';
import {GARepo} from '../Repository/GARepo';
import {Config} from '../Config';

interface State {
  queries: string[];
}

export class StreamSettingComponent extends React.Component<any, State> {
  state: State = {queries: []};
  private _stream: any = null;
  private readonly _streamListenerIds: number[] = [];
  private _originalHeight: string = null;

  componentDidMount() {
    {
      let id;
      id = StreamEmitter.addOpenStreamSettingListener(this._show.bind(this));
      this._streamListenerIds.push(id);
    }

    electron.ipcRenderer.on('create-new-stream', (_ev, stream)=>{
      this._show(stream, true);
    });

    const dialog = ReactDOM.findDOMNode(this);
    this._originalHeight = window.getComputedStyle(dialog).height;

    dialog.addEventListener('close', ()=>{
      StreamEmitter.emitCloseStreamSetting(this._stream);
    });
  }

  componentWillUnmount() {
    StreamEmitter.removeListeners(this._streamListenerIds);
  }

  _show(stream, asNewStream = false) {
    this._stream = stream;
    const dialog = ReactDOM.findDOMNode(this);
    let queries;
    if (stream) {
      queries = JSON.parse(stream.queries);
      dialog.querySelector('#nameInput').value = stream.name;
      dialog.querySelector('#notificationInput').checked = stream.notification === 1;
      dialog.querySelector('#colorInput').value = stream.color;
      dialog.querySelector('.icon-github').style.color = stream.color;
    } else {
      queries = [''];
      dialog.querySelector('#nameInput').value = '';
      dialog.querySelector('#notificationInput').checked = true;
      dialog.querySelector('#colorInput').value = '';
      dialog.querySelector('.icon-github').style.color = null;
    }

    if (asNewStream) this._stream = null;

    this.setState({queries});
    this._updateHeight(queries.length);
    dialog.showModal();
  }

  _updateHeight(queryCount) {
    const dialog = ReactDOM.findDOMNode(this);
    const addHeight = Math.max(36 * (queryCount - 1), 0); // 36px is height of query input
    dialog.style.height = `calc(${this._originalHeight} + ${addHeight}px)`;
  }

  _handleCancel() {
    this.setState({queries: []});
    const dialog = ReactDOM.findDOMNode(this);
    dialog.close();
  }

  async _handleOK() {
    const name = ReactDOM.findDOMNode(this).querySelector('#nameInput').value;
    const notification = ReactDOM.findDOMNode(this).querySelector('#notificationInput').checked ? 1 : 0;
    const color = ReactDOM.findDOMNode(this).querySelector('#colorInput').value;

    // pick up queries from each DOMs
    const queries = [];
    {
      let index = 0;
      while (1) {
        const el = ReactDOM.findDOMNode(this).querySelector(`#queryInput${index}`);
        if (el && el.value) {
          queries.push(el.value);
        } else {
          break;
        }
        index++;
      }
    }

    if (color && !color.match(/^#[0-9A-Fa-f]{3,6}$/)) {
      return;
    }

    if (name && queries.length) {
      this.setState({queries: []});
      const dialog = ReactDOM.findDOMNode(this);
      dialog.close();

      if (this._stream) {
        StreamCenter.rewriteStream(this._stream.id, name, queries, notification, color);
      } else {
        await StreamCenter.createStream(name, queries, notification, color);
        GARepo.eventStreamCreate(queries.length);
      }
    }
  }

  _handleHelp() {
    electron.shell.openExternal('https://jasperapp.io/doc.html#stream');
  }

  _handlePreview() {
    const query = ReactDOM.findDOMNode(this).querySelector('#queryInput0').value;
    if (!query) return;

    const apiHost = Config.getConfig().github.host;
    let webHost = null;
    if (apiHost === 'api.github.com') {
      webHost = 'github.com';
    } else {
      webHost = apiHost;
    }

    const url = `https://${webHost}/search?s=updated&o=desc&type=Issues&q=${encodeURIComponent(query)}`;
    const proxy = window.open(url, 'github-search-preview', 'width=1024px,height=600px');
    proxy.focus();
  }

  _handleColor() {
    // hack: dom operation
    const color = ReactDOM.findDOMNode(this).querySelector('#colorInput').value;
    const icon = ReactDOM.findDOMNode(this).querySelector('.icon-github');
    icon.style.color = color;
  }

  _handleColorPalette(evt) {
    // hack: dom operation
    const color = evt.target.title.toLowerCase();
    ReactDOM.findDOMNode(this).querySelector('#colorInput').value = color;
    this._handleColor();
  }

  _handleAddQuery() {
    const queries = this.state.queries;
    queries.push('');
    this.setState({queries});
    this._updateHeight(queries.length);
  }

  render() {
    const queryNodes = this.state.queries.map((query, index) => {
      return <input key={index} id={`queryInput${index}`} className="form-control"
                    defaultValue={query}
                    placeholder="is:pr author:octocat"/>;
    });

    return (
      <dialog className="stream-setting">
        <div className="window">
          <div className="window-content">

            <div>
              <div className="form-group" title="stream name">
                <label>Name</label>
                <input id="nameInput" className="form-control" placeholder="stream name"/>
              </div>

              <div className="form-group queries" title="stream query">
                <div className="queries-section">
                  <label>Query <span className="help-link" onClick={this._handleHelp.bind(this)}>help</span></label>
                  <span className="flex-stretch"/>
                  <span className="icon icon-plus" onClick={this._handleAddQuery.bind(this)}/>
                </div>
                {queryNodes}
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
                <span className="icon icon-github"/>
              </div>

              <div className="form-group" title="stream notification">
                <label>
                  <input type="checkbox" id="notificationInput"/> Notification
                </label>
              </div>

              <div className="form-actions split-buttons">
                <button className="btn btn-form btn-default" onClick={this._handlePreview.bind(this)}>Preview</button>
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
