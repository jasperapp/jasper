import electron from 'electron';
import React from 'react';
import os from 'os';
import StreamEmitter from '../StreamEmitter';
import SystemStreamEmitter from '../SystemStreamEmitter';
import StreamCenter from '../StreamCenter';
import SystemStreamCenter from '../SystemStreamCenter';

const remote = electron.remote;
const shell = electron.shell;
const DateConverter = remote.require('./Util/DateConverter.js').default;

export default class FooterComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {lastStream: null, lastDate: null, newVersion: null};
    this._streamListenerId = [];
    this._systemStreamListenerId = [];
  }

  componentDidMount() {
    {
      let id = SystemStreamEmitter.addUpdateStreamListener(this._updateTime.bind(this, 'system'));
      this._systemStreamListenerId.push(id);
    }

    {
      let id = StreamEmitter.addUpdateStreamListener(this._updateTime.bind(this, 'stream'));
      this._streamListenerId.push(id);
    }

    electron.ipcRenderer.on('update-version', (ev, message)=> {
      this.setState({newVersion: message});
    });
  }

  async _updateTime(type, streamId) {
    let stream;
    switch (type) {
      case 'system':
        stream = await SystemStreamCenter.findStream(streamId);
        break;
      case 'stream':
        stream = await StreamCenter.findStream(streamId);
        break;
      default:
        throw new Error(`unknown stream type: ${type}`);
    }

    this.setState({lastStream: stream, lastDate: new Date()})
  }

  _handleNewVersion() {
    shell.openExternal(this.state.newVersion.url);
  }

  render() {
    let lastStreamMessage;
    let hoverMessage;
    if (this.state.lastStream) {
      const lastDate = DateConverter.localToString(this.state.lastDate);
      lastStreamMessage = `Latest Connection: ${lastDate.split(' ')[1]}`;
      hoverMessage = `"${this.state.lastStream.name}" stream connection at ${lastDate}`;
    }

    let newVersion = '';
    if (this.state.newVersion) {
      newVersion = 'New Version'
    }

    return <footer className="toolbar toolbar-footer">
      <span className="flex-stretch"/>
      <span title={hoverMessage}>{lastStreamMessage}</span>
      <span className={`new-version-available ${newVersion? '': 'hidden'}`} onClick={this._handleNewVersion.bind(this)}>{newVersion}</span>
    </footer>
  }
}
