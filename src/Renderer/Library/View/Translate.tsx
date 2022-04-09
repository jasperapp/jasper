import React from 'react';
import {Text} from './Text';
import styled from 'styled-components';

type MessageCatalog = {
  prefSetup: {
    side: {
      selectGitHubHost: string;
      accessToken: string;
      confirm: string;
    };
    host: {
      github: string;
      ghe: string;
      gheDesc: string;
      https: string;
      importData: {
        button: string;
        buttonDesc: string;
        help: string;
        step1: string;
        step2: string;
        step3: string;
        step4: string;
      };
    };
    accessToken: {
      useOauth: string;
      usePat: string;
      oauth: {
        enterCode: string;
        copyCode: string;
        successCopy: string;
      },
      pat: {
        enterPat: string;
        patDesc: string;
        scopeDesc: string;
      }
    }
    confirm: {
      success: string;
      host: string;
      accessToken: string;
      pathPrefix: string;
      webHost: string;
      browser: string;
      builtin: string;
      external: string;
      https: string;
      error: {
        fail: string;
        network: string;
        scope: string;
        openGitHub: string;
        openSetting: string;
      }
    }
  };
  prefEditor: {
    title: string;
    tabs: {
      notification: string;
      browse: string;
      stream: string;
      storage: string;
      export: string;
    };
    github: {
      host: string;
      accessToken: string;
      pathPrefix: string;
      interval: string;
      webHost: string;
      https: string;
    },
    notification: {
      enable: string;
      silent: string;
      badge: string;
      sync: string;
    };
    browse: {
      browser: {
        browser: string;
        builtin: string;
        external: string;
      };
      theme: {
        theme: string;
        system: string;
        light: string;
        dark: string;
      };
      externalUrl: string;
      onlyUnread: string;
    };
    streams: {
      enable: string;
      notification: string;
      library: string;
      system: string;
      stream: string;
    };
    storage: {
      current: string;
      max: string;
    };
    export: {
      export: string;
      exportDesc: string;
      import: string;
      importDesc: string;
    };
  };
  streamMenu: {
    allRead: string;
    edit: string;
    subscribe: string;
    delete: string;
    addFilter: string;
    createStream: string;
    createProjectStream: string;
  },
  issueMenu: {
    unsubscribe: string;
    copyUrl: string;
    copyJson: string;
    openBrowser: string;
    currentAllRead: string;
    allRead: string;
  };
  streamEditor: {
    name: string;
    query: string;
    preview: string;
    help: string;
    addQuery: string;
    showDetail: string;
    color: string;
    icon: string;
    allIcons: string;
    notification: string;
    cancel: string;
    warning: string;
  };
  filterStreamEditor: {
    stream: string;
    name: string;
    filter: string;
    help: string;
    showDetail: string;
    color: string;
    icon: string;
    allIcons: string;
    notification: string;
    cancel: string;
  };
  projectStreamEditor: {
    suggestion: string;
    manual: string;
    name: string;
    url: string;
    preview: string;
    help: string;
    color: string;
    icon: string;
    allIcons: string;
    notification: string;
    showDetail: string;
    cancel: string;
  },
  libraryStreamEditor: {
    name: string;
    enable: string;
    notification: string;
    filter: string;
    cancel: string;
  };
  systemStreamEditor: {
    name: string;
    enable: string;
    notification: string;
    query: string;
    desc: string;
    cancel: string;
  };
  subscribeEditor: {
    desc: string;
    cancel: string;
  };
};

const enMessageCatalog: MessageCatalog = {
  prefSetup: {
    side: {
      selectGitHubHost: 'Select GitHub Host',
      accessToken: 'Access Token',
      confirm: 'Confirm',
    },
    host: {
      github: 'Use standard GitHub (github.com).',
      ghe: 'Use GitHub Enterprise.',
      gheDesc: 'Please enter your GitHub Enterprise host. (e.g. ghe.example.com)',
      https: 'Use HTTPS',
      importData: {
        button: 'Import Data',
        buttonDesc: 'Import existing Jasper data.',
        help: 'Help',
        step1: ' Export existing all data from {menu} of current Jasper',
        step2: ' Open data directory',
        step3: ' Copy existing all data to the data directory',
        step4: ' Restart Jasper',
      },
    },
    accessToken: {
      useOauth: 'Use OAuth (recommended)',
      usePat: 'Use Personal Access Token',
      oauth: {
        enterCode: 'Access {url} and enter the code.',
        copyCode: 'Copy code',
        successCopy: 'success copy.',
      },
      pat: {
        enterPat: 'Please enter your {url} of GitHub.',
        patDesc: 'GitHub → Settings → Developer settings → Personal access tokens → Generate new token',
        scopeDesc: 'Jasper requires {repo}, {user}, {notifications} and {readOrg} scopes.'
      }
    },
    confirm: {
      success: 'Hello {user}',
      host: 'API Host',
      accessToken: 'Access Token',
      pathPrefix: 'Path Prefix',
      webHost: 'Web Host',
      browser: 'Browser',
      builtin: 'Built-In Browser',
      external: 'External Browser',
      https: 'Use HTTPS',
      error: {
        fail: 'connection fail',
        network: 'Fail requesting to GitHub/GHE. Please check settings, network, VPN, ssh-proxy and more.',
        scope: 'Jasper requires {repo}, {user}, {notifications} and {readOrg} scopes. Please enable those scopes at GitHub/GHE site.',
        openGitHub: 'Open GitHub/GHE to check access',
        openSetting: 'Open Settings',
      }
    }
  },
  prefEditor: {
    title: 'Preferences',
    tabs: {
      notification: 'Notification',
      browse: 'Browse',
      stream: 'Streams',
      storage: 'Storage',
      export: 'Export',
    },
    github: {
      host: 'API Host',
      accessToken: 'Access Token',
      pathPrefix: 'Path Prefix',
      interval: 'API Interval(sec)',
      webHost: 'Web Host',
      https: 'Use HTTPS',
    },
    notification: {
      enable: 'Enable notification',
      silent: 'Silent notification',
      badge: 'Display unread count badge in dock (Mac only)',
      sync: 'Sync issues read/unread from GitHub Notification',
    },
    browse: {
      browser: {
        browser: 'Browser',
        builtin: 'Built-in Browser',
        external: 'External Browser',
      },
      theme: {
        theme: 'Theme',
        system: 'System Default',
        light: 'Light Mode',
        dark: 'Dark Mode',
      },
      externalUrl: 'Always open external URL in external browser',
      onlyUnread: 'Show only unread issues',
    },
    streams: {
      enable: 'Enabled',
      notification: 'Notification',
      library: 'LIBRARY',
      system: 'SYSTEM',
      stream: 'STREAMS',
    },
    storage: {
      current: 'Current Records',
      max: 'Maximum Records',
    },
    export: {
      export: 'Export',
      exportDesc: 'Export streams settings.',
      import: 'Import',
      importDesc: 'Import streams settings.',
    },
  },
  streamMenu: {
    allRead: 'Mark All as Read',
    edit: 'Edit',
    subscribe: 'Subscribe',
    delete: 'Delete',
    addFilter: 'Add Filter Stream',
    createStream: 'Create Stream',
    createProjectStream: 'Create Project Stream',
  },
  issueMenu: {
    unsubscribe: 'Unsubscribe',
    copyUrl: 'Copy as URL',
    copyJson: 'Copy as JSON',
    openBrowser: 'Open with Browser',
    currentAllRead: 'Mark All Current as Read',
    allRead: 'Mark All as Read',
  },
  streamEditor: {
    name: 'Name',
    query: 'Queries',
    preview: 'preview',
    help: 'help',
    addQuery: 'Add Query',
    showDetail: 'Show Details',
    color: 'Color',
    icon: 'Icon',
    allIcons: 'All Icons',
    notification: 'Notification',
    cancel: 'Cancel',
    warning: 'Warning: {isOpen} may not be the behavior you expect. Please see {link} for details.',
  },
  filterStreamEditor: {
    stream: 'Stream: {name}',
    name: 'Name',
    filter: 'Filter',
    help: 'help',
    showDetail: 'Show Details',
    color: 'Color',
    icon: 'Icon',
    allIcons: 'All Icons',
    notification: 'Notification',
    cancel: 'Cancel',
  },
  projectStreamEditor: {
    suggestion: 'Project Suggestions',
    manual: 'Enter manually',
    name: 'Name',
    url: 'Project URL',
    preview: 'preview',
    help: 'help',
    color: 'Color',
    icon: 'Icon',
    allIcons: 'All Icons',
    notification: 'Notification',
    cancel: 'Cancel',
    showDetail: 'Show Details',
  },
  libraryStreamEditor: {
    name: 'Name',
    enable: 'Enabled',
    notification: 'Notification',
    filter: 'Filter',
    cancel: 'Cancel',
  },
  systemStreamEditor: {
    name: 'Name',
    enable: 'Enabled',
    notification: 'Notification',
    query: 'Queries',
    cancel: 'Cancel',
    desc: 'If you do not use this stream, we recommend disabling it. This will speed up the update interval for other streams',
  },
  subscribeEditor: {
    desc: 'Please enter issue URL you want subscribe to.',
    cancel: 'Cancel',
  },
}

const jaMessageCatalog: MessageCatalog = {
  prefSetup: {
    side: {
      selectGitHubHost: 'GitHubのホストを選択',
      accessToken: 'アクセストークン',
      confirm: '確認',
    },
    host: {
      github: '標準のGitHub (github.com)を使用します',
      ghe: 'GitHub Enterpriseを使用します',
      gheDesc: 'GitHubエンタープライズのホストを入力してください（例 ghe.example.com）',
      https: 'HTTPSを使用',
      importData: {
        button: 'データの読み込み',
        buttonDesc: '現在使っているJasperのデータを読み込む',
        help: 'ヘルプ',
        step1: ' 現在使っているJasperの全てのデータを{menu}から保存する',
        step2: ' データディレクトリを開く',
        step3: ' 保存したデータをそのディレクトリに移動する',
        step4: ' Jasperを再起動する',
      },
    },
    accessToken: {
      useOauth: 'OAuthを使用（推奨）',
      usePat: 'Personal Access Tokenを使用',
      oauth: {
        enterCode: '{url} にアクセスしてコードを以下の入力してください',
        copyCode: 'コードをコピー',
        successCopy: 'コピー成功',
      },
      pat: {
        enterPat: 'あなたのGitHubの{url}を入力してください',
        patDesc: 'GitHub → Settings → Developer settings → Personal access tokens → Generate new token',
        scopeDesc: 'Jasperには{repo}、{user}、{notifications}、{readOrg}のスコープが必要です。'
      },
    },
    confirm: {
      success: 'こんにちは{user}',
      host: 'APIホスト',
      accessToken: 'アクセストークン',
      pathPrefix: 'パス プレフィックス',
      webHost: 'Webホスト',
      browser: 'ブラウザ',
      builtin: '組み込みブラウザ',
      external: '外部ブラウザ',
      https: 'HTTPSを使う',
      error: {
        fail: '接続失敗',
        network: 'GitHub/GHEへの接続が失敗しました。設定内容、ネットワーク、VPN、SSHプロキシなどを確認してください。',
        scope: 'Jasperには{repo}、{user}、{notifications}、{readOrg}のスコープが必要です。それらのスコープをGitHub/GHE上で有効にしてください。',
        openGitHub: 'アクセスを確認するためにGitHub/GHEを開く',
        openSetting: '設定画面を開く',
      },
    },
  },
  prefEditor: {
    title: '設定',
    tabs: {
      notification: '通知',
      browse: '閲覧',
      stream: 'ストリーム',
      storage: 'ストレージ',
      export: 'エクスポート',
    },
    github: {
      host: 'APIホスト',
      accessToken: 'アクセストークン',
      pathPrefix: 'パス プレフィックス',
      interval: 'API間隔（秒）',
      webHost: 'Webホスト',
      https: 'HTTPSを使う',
    },
    notification: {
      enable: '通知を使用',
      silent: 'サイレント通知',
      badge: 'ドックに未読のバッジを表示する（Macのみ）',
      sync: 'Issuesの未読/既読をGitHub Notificationと同期',
    },
    browse: {
      browser: {
        browser: 'ブラウザ',
        builtin: '組み込みブラウザ',
        external: '外部ブラウザ',
      },
      theme: {
        theme: 'テーマ',
        system: 'システムデフォルト',
        light: 'ライトモード',
        dark: 'ダークモード',
      },
      externalUrl: '外部URLを常に外部ブラウザで開く',
      onlyUnread: '未読のIssuesのみを表示',
    },
    streams: {
      enable: 'Enabled',
      notification: 'Notification',
      library: 'ライブラリ',
      system: 'システム',
      stream: 'ストリーム',
    },
    storage: {
      current: '現在のレコード数',
      max: '最大のレコード数',
    },
    export: {
      export: '保存',
      exportDesc: 'ストリームの設定を保存',
      import: '読み込み',
      importDesc: 'ストリームの設定を読み込む',
    },
  },
  streamMenu: {
    allRead: '全て既読にする',
    edit: '編集',
    subscribe: 'サブスクライブ',
    delete: '削除',
    addFilter: 'フィルターストリームを追加',
    createStream: 'ストリームを作成',
    createProjectStream: 'プロジェクトストリームを作成',
  },
  issueMenu: {
    unsubscribe: 'サブスクライブを解除',
    copyUrl: 'URLをコピー',
    copyJson: 'JSONをコピー',
    openBrowser: 'ブラウザで開く',
    currentAllRead: '現在のIssuesを既読にする',
    allRead: '全て既読にする',
  },
  streamEditor: {
    name: '名前',
    query: 'クエリ',
    preview: 'プレビュー',
    help: 'ヘルプ',
    addQuery: 'クエリを追加',
    showDetail: '詳細を表示',
    color: 'カラー',
    icon: 'アイコン',
    allIcons: '全アイコン',
    notification: '通知',
    cancel: 'キャンセル',
    warning: '警告: {isOpen}は期待通りに動かない可能性があります。詳細は{link}を参照してください。',
  },
  filterStreamEditor: {
    stream: 'ストリーム: {name}',
    name: '名前',
    filter: 'フィルター',
    help: 'ヘルプ',
    showDetail: '詳細を表示',
    color: 'カラー',
    icon: 'アイコン',
    allIcons: '全アイコン',
    notification: '通知',
    cancel: 'キャンセル',
  },
  projectStreamEditor: {
    suggestion: 'プロジェクトの提案',
    manual: '手動で入力',
    name: '名前',
    url: 'プロジェクトのURL',
    preview: 'プレビュー',
    help: 'ヘルプ',
    color: 'カラー',
    icon: 'アイコン',
    allIcons: '全アイコン',
    notification: '通知',
    cancel: 'キャンセル',
    showDetail: '詳細を表示',
  },
  libraryStreamEditor: {
    name: '名前',
    enable: '有効',
    notification: '通知',
    filter: 'フィルター',
    cancel: 'キャンセル',
  },
  systemStreamEditor: {
    name: '名前',
    enable: '有効',
    notification: '通知',
    query: 'クエリー',
    cancel: 'キャンセル',
    desc: 'このストリームを使わない場合、無効にすることを推奨します。無効にすると他のストリームの更新間隔が早くなります。',
  },
  subscribeEditor: {
    desc: 'サブスクライブするIssueのURLを入力してください。',
    cancel: 'キャンセル',
  },
}

type Props = {
  onMessage: (mc: MessageCatalog) => string;
  lang?: 'ja' | 'en';
  values?: {[key: string]: string | number | React.ReactNode};
  style?: React.CSSProperties;
  className?: string;
};

export const Translate: React.FC<Props> = (props) => {
  const message = props.onMessage(mc(props.lang));

  if (props.values != null) {
    const msgTokens = message.split(/({.*?})/); // `foo {url1} bar {url2}` => [foo, {url1}, bar, {url2}]
    const children = msgTokens.map((msgToken, index) => {
      if (msgToken.startsWith('{')) {
        const key = msgToken.replace(/[{}]/g, '');
        const value = props.values[key];
        if (value == null) return msgToken;
        if (typeof value === 'string' || typeof value === 'number') {
          return value.toString();
        } else {
          return <span key={index}>{value}</span>;
        }
      } else {
        return msgToken;
      }
    });
    return <StyledText style={props.style} className={props.className}>{children}</StyledText>
  } else {
    return <StyledText style={props.style} className={props.className}>{message}</StyledText>;
  }
}

export function mc(lang?: 'ja' | 'en'): MessageCatalog {
  if (lang == null) {
    lang = navigator.language === 'ja' ? 'ja' : 'en';
  }

  return lang === 'ja' ? jaMessageCatalog : enMessageCatalog;
}

const StyledText = styled(Text)`
  color: inherit;
  font-size: inherit;
`;
