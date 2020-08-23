import {IconNameType} from './IconNameType';

export type BaseStreamEntity = {
  type: 'stream' | 'filteredStream' | 'libraryStream' | 'systemStream';
  id: number | null;
  name: string;
  queryStreamId: number | null;
  queries: string;
  defaultFilter: string;
  filter: string;
  iconName: IconNameType;
  enabled: number;
  color: string;
  notification: number;
  position: number;
  searched_at: string;
  unreadCount: number;
}

export type StreamEntity = BaseStreamEntity & {
  type: 'stream';
}

export type FilteredStreamEntity = BaseStreamEntity & {
  type: 'filteredStream';
}

export type LibraryStreamEntity = BaseStreamEntity & {
  type: 'libraryStream';
}

export type SystemStreamEntity = BaseStreamEntity & {
  type: 'systemStream';
}
