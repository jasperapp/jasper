import {StreamClient} from './StreamClient/StreamClient';
import {TimerUtil} from '../../Library/Util/TimerUtil';
import {SystemStreamMeClient} from './StreamClient/SystemStreamMeClient';
import {SystemStreamTeamClient} from './StreamClient/SystemStreamTeamClient';
import {SystemStreamWatchingClient} from './StreamClient/SystemStreamWatchingClient';
import {SystemStreamSubscriptionClient} from './StreamClient/SystemStreamSubscriptionClient';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {UserPrefRepo} from '../UserPrefRepo';
import {StreamEvent} from '../../Event/StreamEvent';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamId, StreamRepo} from '../StreamRepo';

type Task = {
  streamClient: StreamClient;
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
    await this.createStreamClients();
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

    const {error, stream} = await StreamRepo.getStream(streamId);
    if (error) return console.error(error);
    if (stream.type !== 'UserStream' && stream.type !== 'SystemStream') return console.error(`stream is not userStream and systemStream. streamId = ${streamId}`);

    if (stream.enabled) {
      const streamClient = await this.createStreamClient(stream);
      this.push(streamClient, 1);
    }
  }

  async deleteStream(streamId: number) {
    this.queue = this.queue.filter(task => task.streamClient.getId() !== streamId);
  }

  getStreamQueries(streamId: number): string[] {
    const task = this.queue.find(task => task.streamClient.getId() === streamId);
    if (!task) return [];

    return task.streamClient.getQueries();
  }

  private async createStreamClients() {
    const {error, streams} = await StreamRepo.getAllStreams(['UserStream', 'SystemStream']);
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

  private push(streamClient: StreamClient, priority = 0) {
    const index = Math.max(this.queue.findIndex(task => task.priority === priority), 0);
    const count = this.queue.filter(task => task.priority === priority).length;
    const task = {streamClient, priority}
    this.queue.splice(index + count, 0, task);
  }

  private async run() {
    const interval = UserPrefRepo.getPref().github.interval * 1000;
    const currentName = this.currentName = `polling:${Date.now()}`;

    while(1) {
      if (currentName !== this.currentName) return;
      if (!this.queue.length) return;

      // exec stream
      const {streamClient} = this.queue.shift();
      await streamClient.exec();
      this.push(streamClient);

      // wait interval
      await TimerUtil.sleep(interval);
    }
  }
}

export const StreamPolling = new _StreamPolling();
