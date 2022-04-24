import React from 'react';
import {Text} from './Text';
import styled from 'styled-components';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

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
      lang: {
        title: string;
        system: string;
        en: string;
        ja: string;
        restart: string;
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
  prefCover: {
    edit: string;
    delete: string;
    addNew: string;
  };
  prefNetworkError: {
    fail: string;
    check: string;
    open: string;
  };
  prefScopeError: {
    desc: string;
  };
  prefUnauthorized: {
    invalid: string;
    setting: string;
  };
  streamSetup: {
    card: {
      title: string;
      desc: string;
    };
    side: {
      loading: string;
      repo: string;
      team: string;
      project: string;
      create: string;
    };
    loading: {
      desc: string;
      label: string;
      finish: string;
    };
    repo: {
      desc: string;
      filter: string;
      recentlyOrg: string;
      recentlyRepo: string;
      watchingRepo: string;
      empty: string;
    };
    team: {
      desc: string;
      filter: string;
      empty: string;
    };
    project: {
      desc: string;
      filter: string;
      empty: string;
    };
    create: {
      desc: string;
      repo: string;
      org: string;
      team: string;
      project: string;
    };
    finish: {
      desc: string;
    };
    button: {
      next: string;
      back: string;
      create: string;
      close: string;
    };
  };
  streamRow: {
    allRead: string;
    edit: string;
    subscribe: string;
    delete: string;
    addFilter: string;
    createStream: string;
    createProjectStream: string;
  },
  issueRow: {
    unsubscribe: string;
    copyUrl: string;
    copyJson: string;
    openBrowser: string;
    currentAllRead: string;
    allRead: string;
    createFilter: string;
  };
  issueList: {
    updated: string;
    projectOpen: string;
    initialLoading: string;
  };
  issueHeader: {
    filter: {
      unread: string;
      open: string;
      bookmark: string;
    };
    edit: {
      show: string;
      close: string;
    };
    sort: {
      updated: string;
      read: string;
      created: string;
      closed: string;
      merged:string;
      due: string;
    };
  };
  userStreamEditor: {
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
    addFilter: string;
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
  userStream: {
    title: string;
    addStream: string;
    addFilter: string;
    addProject: string;
    confirm: {
      allRead: string;
      delete: string;
    };
  };
  systemStream: {
    title: string;
    confirm: {
      allRead: string;
    };
  };
  libraryStream: {
    title: string;
    confirm: {
      allRead: string;
    };
  };
  browserFrame: {
    jump: string;
    notification: string;
    layout: string;
    unread: string;
    moveStream: string;
    moveIssue: string;
    movePage: string;
    space: string;
    shift: string;
    handbook: string;
    handbookDesc: string;
  };
  jumpNavigation: {
    desc: string;
    history: string;
    stream: string;
    repository: string;
    issue: string;
  };
  exportData: {
    title: string;
    step1: string;
    step2: string;
    step3: string;
    help: string;
  };
  versionUpdate: {
    desc: string;
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
      lang: {
        title: 'Language',
        system: 'System',
        en: 'English',
        ja: '日本語',
        restart: 'Restart Jasper if you change the language',
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
  prefCover: {
    edit: 'Edit',
    delete: 'Delete',
    addNew: 'Add New',
  },
  prefNetworkError: {
    fail: 'Fail connection to GitHub/GHE.',
    check: 'Please check network, VPN, proxy and more.',
    open: 'Open GitHub/GHE',
  },
  prefScopeError: {
    desc: 'The currently used access token does not have the required scopes set in Jasper v{version}. Please set a new access token.{br}{br}If you are using a Personal Access Token, you can also add a scope to the currently used access token from the {url} page.',
  },
  prefUnauthorized: {
    invalid: 'The access token is not valid.',
    setting: 'Please set a valid access token.',
  },
  streamSetup: {
    card: {
      title: 'Creating Streams',
      desc: 'Let\'s also create streams to browse repositories, teams, and GitHub projects.',
    },
    side: {
      loading: 'Loading Data',
      repo: 'Repository Selection',
      team: 'Team Selection',
      project: 'Project Selection',
      create: 'Stream Creation',
    },
    loading: {
      desc: 'Jasper allows you to view issues and pull requests in the following order.{br}{br}- Repository and/or Organization{br}- Mention and/or Review Request to Team{br}- GitHub Project{br}- Labels, authors, and/or various other criteria{br}{br}This section will create a stream for viewing them. When you have finished loading the necessary data, please proceed.{br}',
      label: 'loading data',
      finish: 'Loading complete',
    },
    repo: {
      desc: 'Please select the repository and/or organization you wish to view in Jasper. You can change this information later.',
      filter: 'filter by name',
      recentlyOrg: 'Recently active Organizations',
      recentlyRepo: 'Recently active repositories',
      watchingRepo: 'Watched repositories (partial)',
      empty: 'No related repository and Organization found',
    },
    team: {
      desc: 'Please select the teams you wish to view in Jasper. You can change this information later.',
      filter: 'filter by name',
      empty: 'No team affiliation found',
    },
    project: {
      desc: 'Please select the GitHub projects you wish to view in Jasper. You can change this information later.',
      filter: 'filter by name',
      empty: 'No recently active GitHub projects found',
    },
    create: {
      desc: 'Creates a stream based on the selected content. The contents of the stream can be changed later.',
      repo: 'Streams associated with the repositories',
      org: 'Streams related to the organizations',
      team: 'Streams associated with the teams',
      project: 'Streams associated with the projects',
    },
    finish: {
      desc: 'Thanks for the setup🎉{br}{br}We are currently loading issues. It will take a few minutes for the initial load to complete. During that time, please use it without closing Jasper.{br}{br}For details on how to use Jasper such as Streams and keyboard shortcuts, see {handbook}.'
    },
    button: {
      next: 'Next',
      back: 'Back',
      create: 'Create streams',
      close: 'Close',
    },
  },
  streamRow: {
    allRead: 'Mark All as Read',
    edit: 'Edit',
    subscribe: 'Subscribe',
    delete: 'Delete',
    addFilter: 'Add Filter Stream',
    createStream: 'Create Stream',
    createProjectStream: 'Create Project Stream',
  },
  issueRow: {
    unsubscribe: 'Unsubscribe',
    copyUrl: 'Copy as URL',
    copyJson: 'Copy as JSON',
    openBrowser: 'Open with Browser',
    currentAllRead: 'Mark All Current as Read',
    allRead: 'Mark All as Read',
    createFilter: 'Create Filter Stream',
  },
  issueList: {
    updated: '{count} issues were updated',
    projectOpen: 'Browse "{icon}{name}" board',
    initialLoading: 'Currently initial loading...',
  },
  issueHeader: {
    filter: {
      unread: 'Filter by unread',
      open: 'Filter by open',
      bookmark: 'Filter by bookmark',
    },
    edit: {
      show: 'Show Filter Edit',
      close: 'Close Filter Edit',
    },
    sort: {
      updated: 'Sort by updated at',
      read: 'Sort by read at',
      created: 'Sort by created at',
      closed: 'Sort by closed at',
      merged: 'Sort by merged at',
      due: 'Sort by due on',
    },
  },
  userStreamEditor: {
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
    addFilter: 'Add Filter',
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
  userStream: {
    title: 'STREAMS',
    addStream: 'Add Stream',
    addFilter: 'Add Filter Stream',
    addProject: 'Add Project Stream',
    confirm: {
      allRead: 'Would you like to mark "{name}" all as read?',
      delete: 'Do you delete "{name}"?',
    },
  },
  systemStream: {
    title: 'SYSTEM',
    confirm: {
      allRead: 'Would you like to mark "{name}" all as read?',
    },
  },
  libraryStream: {
    title: 'LIBRARY',
    confirm: {
      allRead: 'Would you like to mark "{name}" all as read?',
    },
  },
  browserFrame: {
    jump: 'Jump Navigation',
    notification: 'Notification On/Off',
    layout: 'Change Pane Layout',
    unread: 'Only Unread Issue on List',
    moveStream: 'Next or Previous Stream on List',
    moveIssue: 'Next or Previous Issue on List',
    movePage: 'Page Down or Up on Browser',
    space: 'Space',
    shift: 'Shift',
    handbook: 'Jasper Handbook',
    handbookDesc: ' describes all keyboard shortcuts, streams, filter and more.',
  },
  jumpNavigation: {
    desc: 'Jump to streams and issues.',
    history: 'HISTORIES',
    stream: 'STREAMS ({count})',
    repository: 'REPOSITORIES ({count})',
    issue: 'ISSUES ({count})',
  },
  exportData: {
    title: 'Export Jasper data',
    step1: 'Open data directory',
    step2: 'Copy all {config} and {db} from the directory to user desktop',
    step3: 'Import these data when setting up Jasper on a new machine',
    help: 'Help',
  },
  versionUpdate: {
    desc: 'New Version Available!',
  },
};

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
        system: 'システム設定',
        light: 'ライトモード',
        dark: 'ダークモード',
      },
      lang: {
        title: '言語',
        system: 'システム設定',
        en: 'English',
        ja: '日本語',
        restart: '言語を変更した場合は再起動してください',
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
  prefCover: {
    edit: '編集',
    delete: '削除',
    addNew: '新規作成',
  },
  prefNetworkError: {
    fail: 'GitHub/GHEへの接続が失敗しました。',
    check: 'ネットワーク、VPN、プロキシなどを確認してください。',
    open: 'GitHub/GHEを開く',
  },
  prefScopeError: {
    desc: '現在使用しているアクセストークンにJasper v{version}で必要なスコープが設定されていません。新しいアクセストークンを設定してください。{br}{br}Personal Access Tokenを使用している場合は、{url}のページから現在使用しているアクセストークンにスコープを追加することも可能です。',
  },
  prefUnauthorized: {
    invalid: 'アクセストークンが有効ではありません。',
    setting: '有効なアクセストークンを設定してください。',
  },
  streamSetup: {
    card: {
      title: 'ストリームの作成',
      desc: 'リポジトリ、チーム、GitHubプロジェクトを閲覧するためのストリームも作成してみましょう。',
    },
    side: {
      loading: 'データの読み込み',
      repo: 'リポジトリの選択',
      team: 'チームの選択',
      project: 'プロジェクトの選択',
      create: 'ストリームの作成',
    },
    loading: {
      desc: 'Jasperでは次のようなまとまりでIssueやプルリクエストを見ることができます。{br}{br}・リポジトリやOrganization{br}・チームへのメンションやレビューリクエスト{br}・GitHubプロジェクト{br}・ラベルや作者など様々な条件{br}{br}ここではそれらを閲覧するためのストリームを作成します。必要なデータの読み込みが終わりましたら、次に進んでください。{br}',
      label: 'データを読み込み中',
      finish: 'データの読み込みが終わりました'
    },
    repo: {
      desc: 'Jasperで閲覧したいリポジトリやOrganizationを選択してください。この内容は後から変更できます。',
      filter: '名前で絞り込む',
      recentlyOrg: '最近活動したOrganization',
      recentlyRepo: '最近活動したリポジトリ',
      watchingRepo: 'ウォッチしているリポジトリ（一部）',
      empty: '関連するリポジトリやOrganizationは見つかりませんでした',
    },
    team: {
      desc: 'Jasperで閲覧したいチームを選択してください。この内容は後から変更できます。',
      filter: '名前で絞り込む',
      empty: '所属しているチームは見つかりませんでした',
    },
    project: {
      desc: 'Jasperで閲覧したいGitHubプロジェクトを選択してください。この内容は後から変更できます。',
      filter: '名前で絞り込む',
      empty: '最近活動したGitHubプロジェクトは見つかりませんでした',
    },
    create: {
      desc: '選択された内容にもとづいてストリームを作成します。ストリームの内容は後から変更できます。',
      repo: 'リポジトリに関連するストリーム',
      org: 'Organizationに関連するストリーム',
      team: 'チームに関連するストリーム',
      project: 'プロジェクトに関連するストリーム',
    },
    finish: {
      desc: 'セットアップお疲れさまでした🎉{br}{br}現在、Issueの読み込みを行っています。読み込みが完了するには数分かかります。その間はJasperを終了せずにお使いください。{br}{br}ストリームやキーボードショートカットなど、Jasperの詳しい使い方は{handbook}をお読みください。'
    },
    button: {
      next: '次へ',
      back: '戻る',
      create: 'ストリームを作成',
      close: '閉じる',
    },
  },
  streamRow: {
    allRead: '全て既読にする',
    edit: '編集',
    subscribe: 'サブスクライブ',
    delete: '削除',
    addFilter: 'フィルターストリームを追加',
    createStream: 'ストリームを作成',
    createProjectStream: 'プロジェクトストリームを作成',
  },
  issueRow: {
    unsubscribe: 'サブスクライブを解除',
    copyUrl: 'URLをコピー',
    copyJson: 'JSONをコピー',
    openBrowser: 'ブラウザで開く',
    currentAllRead: '現在のIssuesを既読にする',
    allRead: '全て既読にする',
    createFilter: 'フィルターストリームを作成',
  },
  issueList: {
    updated: '{count}件のissuesが更新されました',
    projectOpen: '「{icon}{name}」のボードを表示',
    initialLoading: '初回の読み込み中...',
  },
  issueHeader: {
    filter: {
      unread: '未読のみ表示',
      open: 'オープンのみ表示',
      bookmark: 'ブックマークのみ表示',
    },
    edit: {
      show: 'フィルターを表示',
      close: 'フィルターを非表示',
    },
    sort: {
      updated: '更新日順',
      read: '閲覧日順',
      created: '作成日順',
      closed: 'クローズ日順',
      merged: 'マージ日順',
      due: '締め切り日順',
    },
  },
  userStreamEditor: {
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
    addFilter: 'フィルターを追加',
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
  userStream: {
    title: 'ストリーム',
    addStream: 'ストリームを作成',
    addFilter: 'フィルターストリームを作成',
    addProject: 'プロジェクトストリームを作成',
    confirm: {
      allRead: '"{name}"を全て既読にしますか？',
      delete: '"{name}"を削除しますか？',
    },
  },
  systemStream: {
    title: 'システム',
    confirm: {
      allRead: '"{name}"を全て既読にしますか？',
    },
  },
  libraryStream: {
    title: 'ライブラリ',
    confirm: {
      allRead: '"{name}"を全て既読にしますか？',
    },
  },
  browserFrame: {
    jump: 'ジャンプナビゲーション',
    notification: '通知のオン・オフ',
    layout: 'レイアウトの変更',
    unread: '未読Issuesの表示',
    moveStream: 'ストリームを次・前へ移動',
    moveIssue: 'Issuesを次・前へ移動',
    movePage: 'ページを上・下へ移動',
    space: 'スペース',
    shift: 'シフト',
    handbook: 'Jasperハンドブック',
    handbookDesc: 'で全てのキーボードショートカット、ストリーム、フィルターなどを解説しています。',
  },
  jumpNavigation: {
    desc: 'ストリームやIssuesにジャンプ',
    history: '履歴',
    stream: 'ストリーム ({count})',
    repository: 'リポジトリ ({count})',
    issue: 'Issues ({count})',
  },
  exportData: {
    title: 'Jasperのデータを保存',
    step1: 'データディレクトリを開く',
    step2: '上記のディレクトリから全ての{config}と{db}をデスクトップへコピーする',
    step3: '新しいパソコンでJasperをセットアップする時にそれらのデータを読み込ませる',
    help: 'ヘルプ',
  },
  versionUpdate: {
    desc: '新しいバージョンがあります',
  },
};

type Props = {
  onMessage: (mc: MessageCatalog) => string;
  lang?: 'ja' | 'en';
  values?: {[key: string]: string | number | React.ReactNode};
  style?: React.CSSProperties;
  className?: string;
};

export const Translate: React.FC<Props> = (props) => {
  const message = props.onMessage(mc());

  return <StyledText style={props.style} className={props.className}>{rep(message, props.values ?? {})}</StyledText>
}

// 言語のmessage catalogを取得する
export function mc(): MessageCatalog {
  let lang = UserPrefRepo.getPref()?.general.lang;
  if (lang == null || lang === 'system') {
    lang = navigator.language === 'ja' ? 'ja' : 'en';
  }

  return lang === 'ja' ? jaMessageCatalog : enMessageCatalog;
}

// message内の文字列をvaluesで置き換える
export function rep(message: string, values: Props['values']): (string | JSX.Element)[] {
  const msgTokens = message.split(/({.+?})/); // `foo {url1} bar {url2}` => [foo, {url1}, bar, {url2}]
  return msgTokens.map((msgToken, index) => {
    if (msgToken.startsWith('{')) {
      const key = msgToken.replace(/[{}]/g, '');
      if (key === 'br') return <br key={index}/>;

      const value = values[key];
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
}

const StyledText = styled(Text)`
  color: inherit;
  font-size: inherit;
`;
