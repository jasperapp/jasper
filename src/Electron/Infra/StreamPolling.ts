import {RemoteConfig} from '../Remote';
import {Stream} from './Stream';
import {Timer} from '../../Util/Timer';
import {StreamsRepo} from '../Repository/StreamsRepo';
import {SystemStreamsRepo} from '../Repository/SystemStreamsRepo';
import {SystemStreamMe} from './SystemStream/SystemStreamMe';
import {SystemStreamTeam} from './SystemStream/SystemStreamTeam';
import {SystemStreamWatching} from './SystemStream/SystemStreamWatching';
import {SystemStreamSubscription} from './SystemStream/SystemStreamSubscription';
import {StreamIPC} from '../../IPC/StreamIPC';

type Task = {
  stream: Stream;
  priority: number;
}

class _StreamPolling {
  private queue: Task[] = [];
  private currentName: string;

  constructor() {
    StreamIPC.onStopAllStreams(async () => {
      await this.stop()
    });
    StreamIPC.onRestartAllStreams(async () => {
      await this.restart();
    });
  }

  async start() {
    await this.createSystemStreams();
    await this.createUserStreams();
    this.run();
  }

  async stop() {
    this.queue = [];
    this.currentName = null;
  }

  async restart() {
    await this.stop();
    this.start();
  }

  async refreshStream(streamId: number) {
    const {error, row} = await StreamsRepo.find(streamId);
    if (error) return console.error(error);

    const queries = JSON.parse(row.queries);
    const stream = new Stream(row.id, row.name, queries, row.searched_at);

    await this.deleteStream(streamId);
    this.push(stream, 1);
  }

  async refreshSystemStream(streamId: number, enabled: boolean) {
    await this.deleteStream(streamId);
    if (enabled) {
      const stream = await this.createSystemStream(streamId);
      this.push(stream, 1);
    }
  }

  async deleteStream(streamId: number) {
    this.queue = this.queue.filter(task => task.stream.getId() !== streamId);
  }

  getSystemStreamQueries(streamId: number): string[] {
    const task = this.queue.find(task => task.stream.getId() === streamId);
    if (!task) return [];

    return task.stream.getQueries();
  }

  private async createUserStreams() {
    const res = await StreamsRepo.all();
    for (const streamRow of res.rows) {
      const queries = JSON.parse(streamRow.queries);
      const stream = new Stream(streamRow.id, streamRow.name, queries, streamRow.searched_at);
      this.push(stream);
    }
  }

  private async createSystemStreams() {
    const res = await SystemStreamsRepo.all();
    for (const streamRow of res.rows) {
      if (!streamRow.enabled) continue;
      const stream = await this.createSystemStream(streamRow.id);
      this.push(stream);
    }
  }

  private async createSystemStream(streamId: number): Promise<Stream> {
    const {row: stream} = await SystemStreamsRepo.find(streamId);

    switch (streamId) {
      case -1:
        return new SystemStreamMe(stream.id, stream.name, stream.searched_at);
      case -2:
        return new SystemStreamTeam(stream.id, stream.name, stream.searched_at);
      case -3:
        return new SystemStreamWatching(stream.id, stream.name, stream.searched_at);
      case -4:
        return new SystemStreamSubscription(stream.id, stream.name, stream.searched_at);
      default:
        throw new Error('not found system stream');
    }
  }

  private push(stream: Stream, priority = 0) {
    const index = Math.max(this.queue.findIndex(task => task.priority === priority), 0);
    const count = this.queue.filter(task => task.priority === priority).length;
    const task = {stream, priority}
    this.queue.splice(index + count, 0, task);
  }

  private async run() {
    const interval = RemoteConfig.apiInterval * 1000;
    const currentName = this.currentName = `polling:${Date.now()}`;

    while(1) {
      if (currentName !== this.currentName) return;
      if (!this.queue.length) return;

      const {stream} = this.queue.shift();
      await stream.exec();
      this.push(stream);

      await Timer.sleep(interval);
    }
  }
}

export const StreamPolling = new _StreamPolling();
