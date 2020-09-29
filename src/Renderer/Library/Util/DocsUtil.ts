import {PlatformUtil} from './PlatformUtil';

class _DocsUtil {
  getTopURL(lang: 'ja' | 'en' | 'auto' = 'auto'): string {
    if (lang === 'auto') lang = PlatformUtil.isJa() ? 'ja' : 'en';
    switch (lang) {
      case 'ja':
        return 'https://docs.jasperapp.io/v/ja/';
      case 'en':
        return 'https://docs.jasperapp.io/';
    }
  }

  getStreamURL(lang: 'ja' | 'en' | 'auto' = 'auto'): string {
    if (lang === 'auto') lang = PlatformUtil.isJa() ? 'ja' : 'en';
    switch (lang) {
      case 'ja':
        return 'https://docs.jasperapp.io/v/ja/reference/stream';
      case 'en':
        return 'https://docs.jasperapp.io/reference/stream';
    }
  }

  getFilterStreamURL(lang: 'ja' | 'en' | 'auto' = 'auto'): string {
    if (lang === 'auto') lang = PlatformUtil.isJa() ? 'ja' : 'en';
    switch (lang) {
      case 'ja':
        return 'https://docs.jasperapp.io/v/ja/reference/filter-stream';
      case 'en':
        return 'https://docs.jasperapp.io/reference/filter-stream';
    }
  }

  getProjectStreamURL(lang: 'ja' | 'en' | 'auto' = 'auto'): string {
    if (lang === 'auto') lang = PlatformUtil.isJa() ? 'ja' : 'en';
    switch (lang) {
      case 'ja':
        return 'https://docs.jasperapp.io/v/ja/reference/project-stream';
      case 'en':
        return 'https://docs.jasperapp.io/reference/project-stream';
    }
  }

  getOpenIssueURL(lang: 'ja' | 'en' | 'auto' = 'auto'): string {
    if (lang === 'auto') lang = PlatformUtil.isJa() ? 'ja' : 'en';
    switch (lang) {
      case 'ja':
        return 'https://docs.jasperapp.io/v/ja/usecase/query#open-issue';
      case 'en':
        return 'https://docs.jasperapp.io/usecase/query#open-issue';
    }
  }
}

export const DocsUtil = new _DocsUtil();
