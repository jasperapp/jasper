import {IconNameType} from './IconNameType';

export type StreamEntity = {
  id: number | null;
  name: string;
  queryStreamId: number | null;
  queries: string;
  defaultFilter: string;
  userFilter: string;
  iconName: IconNameType;
  enabled: number;
  color: string;
  notification: number;
  position: number;
  searched_at: string;
  unreadCount: number;
}
