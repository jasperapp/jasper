import {shell} from 'electron';
import React from 'react';
import {StreamEmitter} from '../StreamEmitter';
import {SystemStreamEmitter} from '../SystemStreamEmitter';
import {StreamCenter} from '../StreamCenter';
import {SystemStreamCenter} from '../SystemStreamCenter';
import {DateConverter} from '../../Util/DateConverter';
import {VersionEvent} from '../Event/VersionEvent';
import {VersionType} from '../Repository/VersionRepo';

interface State {
  lastStream: any;
  lastDate: Date;
  newVersion: VersionType;
}

export class FooterComponent extends React.Component<any, State> {
  state: State = {lastStream: null, lastDate: null, newVersion: null};
  private readonly _streamListenerId: number[] = [];
  private readonly _systemStreamListenerId: number[] = [];

  componentDidMount() {
    {
      let id = SystemStreamEmitter.addUpdateStreamListener(this._updateTime.bind(this, 'system'));
      this._systemStreamListenerId.push(id);
    }

    {
      let id = StreamEmitter.addUpdateStreamListener(this._updateTime.bind(this, 'stream'));
      this._streamListenerId.push(id);
    }

    VersionEvent.onNewVersion(this, (newVersion) => this.setState({newVersion}));
  }

  componentWillUnmount(): void {
    SystemStreamEmitter.removeListeners(this._systemStreamListenerId);
    StreamEmitter.removeListeners(this._streamListenerId);
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
