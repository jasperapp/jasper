import React from 'react';
import {Text} from './Text';

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
    },
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
      builtin: 'Use Built-In Browser',
      external: 'Use External Browser',
      https: 'Use HTTPS',
      error: {
        fail: 'connection fail',
        network: 'Fail requesting to GitHub/GHE. Please check settings, network, VPN, ssh-proxy and more.',
        scope: 'Jasper requires {repo}, {user}, {notifications} and {readOrg} scopes. Please enable those scopes at GitHub/GHE site.',
        openGitHub: 'Open GitHub/GHE to check access',
        openSetting: 'Open Settings',
      }
    }
  }
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
      }
    },
    confirm: {
      success: 'こんにちは{user}',
      host: 'APIホスト',
      accessToken: 'アクセストークン',
      pathPrefix: 'パス プレフィックス',
      webHost: 'Webホスト',
      browser: 'ブラウザ',
      builtin: '組み込みブラウザを使う',
      external: '外部ブラウザを使う',
      https: 'HTTPSを使う',
      error: {
        fail: '接続失敗',
        network: 'GitHub/GHEへの接続が失敗しました。設定内容、ネットワーク、VPN、SSHプロキシなどを確認してください。',
        scope: 'Jasperには{repo}、{user}、{notifications}、{readOrg}のスコープが必要です。それらのスコープをGitHub/GHE上で有効にしてください。',
        openGitHub: 'アクセスを確認するためにGitHub/GHEを開く',
        openSetting: '設定画面を開く',
      }
    }
  }
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
    return <Text style={props.style} className={props.className}>{children}</Text>
  } else {
    return <Text style={props.style} className={props.className}>{message}</Text>;
  }
}
export function mc(lang?: 'ja' | 'en'): MessageCatalog {
  if (lang == null) {
    lang = navigator.language === 'ja' ? 'ja' : 'en';
  }

  return lang === 'ja' ? jaMessageCatalog : enMessageCatalog;
}
