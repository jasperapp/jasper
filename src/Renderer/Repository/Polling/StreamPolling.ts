import {StreamClient} from './StreamClient/StreamClient';
import {TimerUtil} from '../../Library/Util/TimerUtil';
import {SystemStreamMeClient} from './StreamClient/SystemStreamMeClient';
import {SystemStreamTeamClient} from './StreamClient/SystemStreamTeamClient';
import {SystemStreamWatchingClient} from './StreamClient/SystemStreamWatchingClient';
import {SystemStreamSubscriptionClient} from './StreamClient/SystemStreamSubscriptionClient';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {UserPrefRepo} from '../UserPrefRepo';
import {IssueRepo} from '../IssueRepo';
import {StreamEvent} from '../../Event/StreamEvent';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamId, StreamRepo} from '../StreamRepo';

type Task = {
  stream: StreamClient;
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
    await this.createStreams();
    this.run();
  }

  async stop() {
    this.queue = [];
    this.currentName = null;
  }

  async restart() {
    await this.stop();
    this.start();
    StreamEvent.emitReloadAllStreams();
  }

  async refreshStream(streamId: number) {
    await this.deleteStream(streamId);

    const res = await StreamRepo.getStream(streamId);
    if (res.error) return console.error(res.error);

    if (res.stream.enabled) {
      const stream = await this.createStreamClient(res.stream);
      this.push(stream, 1);
    }
  }

  async deleteStream(streamId: number) {
    this.queue = this.queue.filter(task => task.stream.getId() !== streamId);
  }

  getStreamQueries(streamId: number): string[] {
    const task = this.queue.find(task => task.stream.getId() === streamId);
    if (!task) return [];

    return task.stream.getQueries();
  }

  private async createStreams() {
    const {error, streams} = await StreamRepo.getAllStreams(['custom', 'system']);
    if (error) return;

    for (const streamEntity of streams) {
      if (!streamEntity.enabled) continue;
      const streamClient = await this.createStreamClient(streamEntity);
      this.push(streamClient);
    }
  }

  private async createStreamClient(streamEntity: StreamEntity): Promise<StreamClient> {
    switch (streamEntity.id) {
      case StreamId.me:
        return new SystemStreamMeClient(streamEntity.id, streamEntity.name, streamEntity.searched_at);
      case StreamId.team:
        return new SystemStreamTeamClient(streamEntity.id, streamEntity.name, streamEntity.searched_at);
      case StreamId.watching:
        return new SystemStreamWatchingClient(streamEntity.id, streamEntity.name, streamEntity.searched_at);
      case StreamId.subscription:
        return new SystemStreamSubscriptionClient(streamEntity.id, streamEntity.name, streamEntity.searched_at);
      default:
        return new StreamClient(streamEntity.id, streamEntity.name, streamEntity.queries, streamEntity.searched_at);
    }
  }

  private push(stream: StreamClient, priority = 0) {
    const index = Math.max(this.queue.findIndex(task => task.priority === priority), 0);
    const count = this.queue.filter(task => task.priority === priority).length;
    const task = {stream, priority}
    this.queue.splice(index + count, 0, task);
  }

  private async run() {
    const interval = UserPrefRepo.getPref().github.interval * 1000;
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
      const {error, count} = await IssueRepo.getTotalUnreadCount();
      if (error) return console.error(error);
      StreamIPC.setUnreadCount(count, UserPrefRepo.getPref().general.badge);

      await TimerUtil.sleep(interval);
    }
  }
}

export const StreamPolling = new _StreamPolling();
