import {ipcRenderer} from 'electron';
import {StreamEntity} from '../../Renderer/Library/Type/StreamEntity';
import {StreamIPCChannels} from './StreamIPC.channel';

declare global {
  interface IPC {
    stream: {
      setUnreadCount: (unreadCount: number, badge: boolean) => Promise<void>;
      exportStreams: (streams: StreamEntity[]) => Promise<void>,
      importStreams: () => Promise<any>,
    },
  }
}

export const streamIPCExpose = {
  ipc: {
    stream: {
      setUnreadCount: (unreadCount: number, badge: boolean) => {
        return ipcRenderer.invoke(StreamIPCChannels.unreadCount, unreadCount, badge);
      },

      exportStreams: (streams: StreamEntity[]) => {
        return ipcRenderer.invoke(StreamIPCChannels.exportStreams, streams);
      },

      importStreams: () => {
        return ipcRenderer.invoke(StreamIPCChannels.importStreams);
      },
    }
  }
}
