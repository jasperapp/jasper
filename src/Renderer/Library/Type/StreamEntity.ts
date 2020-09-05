import {IconNameType} from './IconNameType';

export type StreamRow = {
  id: number;
  type: 'LibraryStream' | 'SystemStream' | 'UserStream' | 'FilterStream' | 'ProjectStream';
  name: string;
  query_stream_id: number;
  queries: string;
  default_filter: string;
  user_filter: string;
  position: number;
  notification: number;
  icon: string;
  color: string;
  enabled: number;
  searched_at: string;
}

export type StreamEntity = {
  id: number | null;
  type: StreamRow['type'];
  name: string;
  queryStreamId: number | null;
  queries: string[];
  defaultFilter: string;
  userFilter: string;
  iconName: IconNameType;
  enabled: number;
  color: string;
  notification: number;
  position: number;
  searchedAt: string;
  unreadCount: number;
}

