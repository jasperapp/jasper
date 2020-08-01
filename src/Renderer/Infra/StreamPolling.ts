import {Stream} from './Stream';
import {TimerUtil} from '../Util/TimerUtil';
import {StreamRepo} from '../Repository/StreamRepo';
import {SystemStreamId, SystemStreamRepo} from '../Repository/SystemStreamRepo';
import {SystemStreamMe} from './SystemStream/SystemStreamMe';
import {SystemStreamTeam} from './SystemStream/SystemStreamTeam';
import {SystemStreamWatching} from './SystemStream/SystemStreamWatching';
import {SystemStreamSubscription} from './SystemStream/SystemStreamSubscription';
import {StreamIPC} from '../../IPC/StreamIPC';
import {ConfigRepo} from '../Repository/ConfigRepo';
import {IssueRepo} from '../Repository/IssueRepo';
import {StreamEvent} from '../Event/StreamEvent';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {SystemStreamEntity} from '../Type/SystemStreamEntity';

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
    StreamEvent.emitRestartAllStreams();
    SystemStreamEvent.emitRestartAllStreams();
  }

  async refreshStream(streamId: number) {
    const res = await StreamRepo.getStream(streamId);
    if (res.error) return console.error(res.error);

    const queries = JSON.parse(res.stream.queries);
    const stream = new Stream(res.stream.id, res.stream.name, queries, res.stream.searched_at);

    await this.deleteStream(streamId);
    this.push(stream, 1);
  }

  async refreshSystemStream(streamId: number) {
    await this.deleteStream(streamId);

    const res = await SystemStreamRepo.getSystemStream(streamId);
    if (res.error) return console.error(res.error);
    if (res.systemStream.enabled) {
      const stream = await this.createSystemStream(res.systemStream);
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
    const res = await StreamRepo.getAllStreams();
    if (res.error) return;
    for (const streamEntity of res.streams) {
      const queries = JSON.parse(streamEntity.queries);
      const stream = new Stream(streamEntity.id, streamEntity.name, queries, streamEntity.searched_at);
      this.push(stream);
    }
  }

  private async createSystemStreams() {
    const {error, systemStreams} = await SystemStreamRepo.getAllSystemStreams();
    if (error) return console.error(error);

    for (const streamStreamEntity of systemStreams) {
      if (!streamStreamEntity.enabled) continue;
      const stream = await this.createSystemStream(streamStreamEntity);
      this.push(stream);
    }
  }

  private async createSystemStream(systemStreamEntity: SystemStreamEntity): Promise<Stream> {
    switch (systemStreamEntity.id) {
      case SystemStreamId.me:
        return new SystemStreamMe(systemStreamEntity.id, systemStreamEntity.name, systemStreamEntity.searched_at);
      case SystemStreamId.team:
        return new SystemStreamTeam(systemStreamEntity.id, systemStreamEntity.name, systemStreamEntity.searched_at);
      case SystemStreamId.watching:
        return new SystemStreamWatching(systemStreamEntity.id, systemStreamEntity.name, systemStreamEntity.searched_at);
      case SystemStreamId.subscription:
        return new SystemStreamSubscription(systemStreamEntity.id, systemStreamEntity.name, systemStreamEntity.searched_at);
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
    const interval = ConfigRepo.getConfig().github.interval * 1000;
    const currentName = this.currentName = `polling:${Date.now()}`;

    while(1) {
      if (currentName !== this.currentName) return;
      if (!this.queue.length) return;

      // exec stream
      const {stream} = this.queue.shift();
      await stream.exec();
      this.push(stream);

      // todo: 未読にしたとき、既読にしたときなど、別のタイミングでも更新が必要
      // unread count
      const {count} = await IssueRepo.unreadCount();
      StreamIPC.setUnreadCount(count, ConfigRepo.getConfig().general.badge);

      await TimerUtil.sleep(interval);
    }
  }
}

export const StreamPolling = new _StreamPolling();
