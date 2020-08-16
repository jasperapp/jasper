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
  queries: string;
  position: number;
  created_at: string;
  updated_at: string;
  searched_at: string;
}

export type FilteredStreamEntity = BaseStreamEntity & {
  stream_id: number;
  filter: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type LibraryStreamEntity = BaseStreamEntity & {
}

export type SystemStreamEntity = BaseStreamEntity & {
  position: number;
  searched_at: string;
}
