import {IconNameType} from './IconNameType';

export type BaseStreamEntity = {
  id: number | null;
  name: string;
  unreadCount: number;
  defaultFilter: string;
  iconName: IconNameType;
  enabled: number;
}

export type StreamEntity = BaseStreamEntity & {
  queries: string;
  color: string;
  position: number;
  notification: number;
  created_at: string;
  updated_at: string;
  searched_at: string;
}

export type FilteredStreamEntity = BaseStreamEntity & {
  stream_id: number;
  filter: string;
  notification: number;
  color: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export type LibraryStreamEntity = BaseStreamEntity & {
}

export type SystemStreamEntity = BaseStreamEntity & {
  notification: number;
  color: string;
  position: number;
  searched_at: string;
}
