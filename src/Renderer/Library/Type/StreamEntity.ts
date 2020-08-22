import {IconNameType} from './IconNameType';

export type BaseStreamEntity = {
  type: 'stream' | 'filteredStream' | 'libraryStream' | 'systemStream';
  id: number | null;
  name: string;
  unreadCount: number;
  defaultFilter: string;
  iconName: IconNameType;
  enabled: number;
  color?: string;
  notification?: number;
}

export type StreamEntity = BaseStreamEntity & {
  queryStreamId: number | null;
  filter: string;
  queries: string;
  position: number;
  searched_at: string;
}

export type FilteredStreamEntity = BaseStreamEntity & {
  stream_id: number;
  queryStreamId: number | null;
  filter: string;
  position: number;
  searched_at: string;
}

export type LibraryStreamEntity = BaseStreamEntity & {
  queryStreamId: number | null;
  queries: string;
  filter: string;
  position: number;
  searched_at: string;
}

export type SystemStreamEntity = BaseStreamEntity & {
  queryStreamId: number | null;
  filter: string;
  position: number;
  searched_at: string;
}
