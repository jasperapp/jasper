import {ThemeNameEntity} from '../Type/ThemeNameEntity';

type ThemeEntity = {
  bg: {
    primary: string;
    primarySoft: string;
    primaryHover: string;
    secondary: string;
    third: string;
  };
  accent: {
    normal: string;
    // soft: string;
    // deep: string;
  },
  issue: {
    read: string;
    unread: string;
  },
  contextMenu: {
    shadow: string;
  };
  border: {
    normal: string;
    bold: string;
  };
  text: {
    normal: string;
    soft: string;
    tiny: string;
    link: string;
  };
  icon: {
    normal: string;
    soft: string;
  };
  button: {
    normal: {
      bg: string;
      border: string;
    };
    primary: {
      bg: '#2488FF';
      border: '#238AF7';
    };
  };
  iconButton: {
    hover: string;
  };
}

const lightTheme: ThemeEntity = {
  bg: {
    primary: '#ffffff',
    primarySoft: '#eeeeee',
    primaryHover: '#DCDFE188',
    secondary: '#F5F5F4',
    third: '#F1F3F4',
  },
  accent: {
    normal: '#2984ff',
  },
  issue: {
    read: '#eeeeee',
    unread: '#ffffff',
  },
  contextMenu: {
    shadow: '0 0 8px 4px #00000010',
  },
  border: {
    normal: '#dddddd',
    bold: '#888888',
  },
  text: {
    normal: '#444444',
    soft: '#666666',
    tiny: '#888888',
    link: '#0000ff',
  },
  icon: {
    normal: '#737475',
    soft: '#888888',
  },
  button: {
    normal: {
      bg: '#FAFBFC',
      border: '#D9DBDB',
    },
    primary: {
      bg: '#2488FF',
      border: '#238AF7',
    }
  },
  iconButton: {
    hover: '#00000011',
  },
};

const darkTheme: ThemeEntity = {
  bg: {
    primary: '#222222',
    primarySoft: '#333333',
    primaryHover: '#55555588',
    secondary: '#2a2a2a',
    third: '#2e2e2e',
  },
  accent: {
    normal: '#0058D0',
  },
  issue: {
    read: '#222222',
    // unread: '#151d33',
    unread: '#383838',
  },
  contextMenu: {
    shadow: '0 0 8px 4px #111111aa',
  },
  border: {
    normal: '#444444',
    bold: '#999999',
  },
  text: {
    normal: '#d0d0d0',
    soft: '#bbbbbb',
    tiny: '#999999',
    link: '#2a92ff',
  },
  icon: {
    normal: '#bbbbbb',
    soft: '#999999',
  },
  button: {
    normal: {
      bg: '#262626', //
      border: '#484848', //
    },
    primary: {
      bg: '#2488FF',
      border: '#238AF7',
    }
  },
  iconButton: {
    hover: '#ffffff44',
  },
};

let currentThemeName: ThemeNameEntity = 'light';

export function setAppThemeName(themeName: ThemeNameEntity) {
  currentThemeName = themeName;
}

export function appTheme(): ThemeEntity {
  return currentThemeName === 'light' ? lightTheme : darkTheme;
}
