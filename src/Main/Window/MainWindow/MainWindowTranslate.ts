import {app} from 'electron';
import {UserPrefBind} from '../../Bind/UserPrefBind';
import {UserPrefEntity} from '../../../Renderer/Library/Type/UserPrefEntity';

type MessageCatalog = {
  app: {
    title: string;
    about: string;
    update: string;
    preference: string;
    export: string;
    supporter: string;
    hide: string;
    hideOther: string;
    show: string;
    quit: string;
  };
  edit: {
    title: string;
    undo: string;
    redo: string;
    cut: string;
    copy: string;
    paste: string;
    pasteStyle: string;
    selectAll: string;
  };
  view: {
    title: string;
    jump: string;
    recently: string;
    pane: {
      single: string;
      two: string;
      three: string;
    };
    fullScreen: string;
  };
  streams: {
    title: string;
    notification: string;
    select: {
      title: string;
      next: string;
      prev: string;
      top1: string;
      top2: string;
      top3: string;
      top4: string;
      top5: string;
    };
  };
  issues: {
    title: string;
    reload: string;
    select: {
      title: string;
      next: string;
      prev: string;
      nextUnread: string;
      prevUnread: string;
    };
    state: {
      title: string;
      read: string;
      bookmark: string;
      archive: string;
    };
    filter: {
      title: string;
      author: string;
      assignee: string;
      unread: string;
      open: string;
      bookmark: string;
    };
  };
  browser: {
    title: string;
    reload: string;
    back: string;
    forward: string;
    scroll: {
      title: string;
      down: string;
      up: string;
      longDown: string;
      longUp: string;
    };
    search: string;
    location: string;
    open: string;
  };
  window: {
    title: string;
    zoom: {
      in: string;
      out: string;
      reset: string;
    };
    close: string;
    minimize: string;
    front: string;
  };
  help: {
    title: string;
    handbook: string;
    feedback: string;
  };
};

const enMessageCatalog: MessageCatalog = {
  app: {
    title: 'Jasper',
    about: 'About Jasper',
    update: 'Update',
    preference: 'Preferences',
    export: 'Export Data',
    supporter: 'GitHub Sponsor',
    hide: 'Hide Jasper',
    hideOther: 'Hide Others',
    show: 'Show All',
    quit: 'Quit Jasper'
  },
  edit: {
    title: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    pasteStyle: 'Paste and Match Style',
    selectAll: 'Select All',
  },
  view: {
    title: 'View',
    jump: 'Jump Navigation',
    recently: 'Recently Reads',
    pane: {
      single: 'Single Pane',
      two: 'Two Pane',
      three: 'Three Pane',
    },
    fullScreen: 'Full Screen',
  },
  streams: {
    title: 'Streams',
    notification: 'Toggle Notification',
    select: {
      title: 'Select Stream',
      next: 'Next Stream',
      prev: 'Prev Stream',
      top1: '1st',
      top2: '2nd',
      top3: '3rd',
      top4: '4th',
      top5: '5th',
    },
  },
  issues: {
    title: 'Issues',
    reload: 'Reload Issues',
    select: {
      title: 'Select Issue',
      next: 'Next Issue',
      prev: 'Prev Issue',
      nextUnread: 'Next Unread Issue',
      prevUnread: 'Prev Unread Issue',
    },
    state: {
      title: 'Issue State',
      read: 'Toggle Read',
      bookmark: 'Toggle Bookmark',
      archive: 'Toggle Archive',
    },
    filter: {
      title: 'Filter Issue',
      author: 'Filter Author',
      assignee: 'Filer Assignee',
      unread: 'Filter Unread',
      open: 'Filter Open',
      bookmark: 'Filter Bookmark',
    },
  },
  browser: {
    title: 'Browser',
    reload: 'Reload',
    back: 'Back',
    forward: 'Forward',
    scroll: {
      title: 'Scroll',
      down: 'Scroll Down',
      up: 'Scroll Up',
      longDown: 'Scroll Long Down',
      longUp: 'Scroll Long Up',
    },
    search: 'Search Keyword',
    location: 'Open Location',
    open: 'Open with External',
  },
  window: {
    title: 'Window',
    zoom: {
      in: 'Zoom +',
      out: 'Zoom -',
      reset: 'Zoom Reset',
    },
    close: 'Close Window',
    minimize: 'Minimize',
    front: 'Bring All to Front',
  },
  help: {
    title: 'Help',
    handbook: 'Handbook',
    feedback: 'Feedback',
  },
};
const jaMessageCatalog: MessageCatalog = {
  app: {
    title: 'Jasper',
    about: 'Jasperについて',
    update: '更新',
    preference: '設定',
    export: 'データの保存',
    supporter: 'GitHub スポンサー',
    hide: 'Jasperを非表示',
    hideOther: '他を非表示',
    show: 'すべて表示',
    quit: 'Jasperを終了'
  },
  edit: {
    title: '編集',
    undo: '元に戻す',
    redo: 'やり直し',
    cut: '切り取り',
    copy: 'コピー',
    paste: '貼り付け',
    pasteStyle: '貼り付けてスタイルを合わせる',
    selectAll: 'すべて選択',
  },
  view: {
    title: '表示',
    jump: 'ジャンプナビゲーション',
    recently: '最近の閲覧',
    pane: {
      single: 'レイアウト1',
      two: 'レイアウト2',
      three: 'レイアウト3',
    },
    fullScreen: 'フルスクリーン',
  },
  streams: {
    title: 'ストリーム',
    notification: '通知の切り替え',
    select: {
      title: 'ストリームの選択',
      next: '次のストリーム',
      prev: '前のストリーム',
      top1: '1番目',
      top2: '2番目',
      top3: '3番目',
      top4: '4番目',
      top5: '5番目',
    },
  },
  issues: {
    title: 'Issues',
    reload: 'Issuesの再読み込み',
    select: {
      title: 'Issueの選択',
      next: '次のIssue',
      prev: '前のIssue',
      nextUnread: '次の未読Issue',
      prevUnread: '前の未読Issue',
    },
    state: {
      title: 'Issueの状態',
      read: '未読・既読の変更',
      bookmark: 'ブックマークの変更',
      archive: 'アーカイブの変更',
    },
    filter: {
      title: 'Issueのフィルター',
      author: '自分が作成したIssues',
      assignee: '自分がアサインされているIssues',
      unread: '未読のIssues',
      open: 'オープンしているIssues',
      bookmark: 'ブックマークしているIssues',
    },
  },
  browser: {
    title: 'ブラウザ',
    reload: '再読み込み',
    back: '戻る',
    forward: '進む',
    scroll: {
      title: 'スクロール',
      down: '下にスクロール',
      up: '上にスクロール',
      longDown: '下に大きくスクロール',
      longUp: '上に大きくスクロール',
    },
    search: 'キーワード検索',
    location: 'アドレスバーを開く',
    open: '外部ブラウザで開く',
  },
  window: {
    title: 'ウィンドウ',
    zoom: {
      in: 'ズームイン',
      out: 'ズームアウト',
      reset: 'ズームをリセット',
    },
    close: 'ウィンドウを閉じる',
    minimize: '最小化',
    front: 'すべてを手前に移動',
  },
  help: {
    title: 'ヘルプ',
    handbook: 'ハンドブック',
    feedback: 'フィードバック',
  },
};

export function mainWindowMc(): MessageCatalog {
  const json = UserPrefBind.read();
  const pref = JSON.parse(json) as UserPrefEntity[];
  let lang = pref[0]?.general.lang;
  if (lang == null || lang === 'system') {
    lang = app.getLocale() === 'ja' ? 'ja' : 'en';
  }

  return lang === 'ja' ? jaMessageCatalog : enMessageCatalog;
}
