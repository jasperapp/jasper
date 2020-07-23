import {Timer} from '../../Util/Timer';
import {SystemStreamsTable} from '../DB/SystemStreamsTable';
import {SystemMeStream} from './SystemMeStream';
import {SystemTeamStream} from './SystemTeamStream';
import {SystemWatchingStream} from './SystemWatchingStream';
import {SystemSubscriptionStream} from './SystemSubscriptionStream';
import {Stream} from './Stream';

class _SystemStreamLauncher {
  private _aliveStreams: Stream[];

  constructor() {
    this._aliveStreams = [];
  }

  async startAll() {
    this.stopAll();

    const streams = await SystemStreamsTable.all();
    for (const stream of streams) {
      if (!stream.enabled) continue;

      let systemStream;
      switch (stream.id) {
        case -1: systemStream = new SystemMeStream(stream.id, stream.name, stream.searched_at); break;
        case -2: systemStream = new SystemTeamStream(stream.id, stream.name, stream.searched_at); break;
        case -3: systemStream = new SystemWatchingStream(stream.id, stream.name, stream.searched_at); break;
        case -4: systemStream = new SystemSubscriptionStream(stream.id, stream.name, stream.searched_at); break;
      }

      systemStream.start();

      this._aliveStreams.push(systemStream);
    }

    await Timer.sleep(1000);
  }

  async restartAll() {
    this.stopAll();
    await this.startAll();
  }

  stopAll() {
    for (const stream of this._aliveStreams) {
      stream.stop();
    }
    this._aliveStreams = [];
  }

  getStreamQueries(streamId) {
    const stream = this._aliveStreams.find((stream)=> stream.id === streamId);

    // if stream is not enabled, aliveStreams does not have the target stream.
    if (!stream) return [];

    return stream.getQueries();
  }
}

export const SystemStreamLauncher = new _SystemStreamLauncher();
