import Stream from './Stream';
import StreamsTable from '../DB/StreamsTable';
import DateConverter from '../Util/DateConverter'

export class StreamLauncher {
  private _aliveStreams: Stream[];

  constructor() {
    this._aliveStreams = [];
  }

  async startAll() {
    const streamRows = await StreamsTable.all();
    for (const streamRow of streamRows) {
      const queries = JSON.parse(streamRow.queries);
      const stream = new Stream(streamRow.id, streamRow.name, queries, streamRow.searched_at);

      const updatedAt = DateConverter.utcToUnix(streamRow.updated_at);
      const diffMilliSec = Date.now() - updatedAt;
      const firstImmediate = diffMilliSec < 3000;

      stream.start(firstImmediate);
      this._aliveStreams.push(stream);
    }
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
}

export default new StreamLauncher();
