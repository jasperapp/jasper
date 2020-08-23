import {IconNameType} from './IconNameType';

export type BaseStreamEntity = {
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
}
