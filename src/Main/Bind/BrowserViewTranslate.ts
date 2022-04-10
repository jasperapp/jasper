import {app} from 'electron';
import {UserPrefBind} from './UserPrefBind';
import {UserPrefEntity} from '../../Renderer/Library/Type/UserPrefEntity';

type MessageCatalog = {
  url: {
    open: string;
    copy: string;
  },
  text: {
    copy: string;
    cut: string;
    paste: string;
  },
  search: string;
};

const enMessageCatalog: MessageCatalog = {
  url: {
    open: 'Open URL',
    copy: 'Copy URL',
  },
  text: {
    copy: 'Copy',
    cut: 'Cut',
    paste: 'Paste'
  },
  search: 'Search text in dictionary',
};

const jaMessageCatalog: MessageCatalog = {
  url: {
    open: 'URLを開く',
    copy: 'URLをコピー',
  },
  text: {
    copy: 'コピー',
    cut: '切り取り',
    paste: '貼り付け'
  },
  search: '辞書で探す',
};

export function browserViewMc(): MessageCatalog {
  const json = UserPrefBind.read();
  const pref = JSON.parse(json) as UserPrefEntity[];
  let lang = pref[0]?.general.lang;
  if (lang == null || lang === 'system') {
    lang = app.getLocale() === 'ja' ? 'ja' : 'en';
  }

  return lang === 'ja' ? jaMessageCatalog : enMessageCatalog;
}
