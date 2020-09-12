import {ThemeNameEntity} from '../Type/ThemeNameEntity';

const lightTheme = {
  // bg
  bg: {
    primary: '#ffffff',
    primarySoft: '#eeeeee',
    primaryHover: '#DCDFE188',
    secondary: '#F5F5F4',
  },
  // bg: '#ffffff',
  // bgSide: '#F5F5F4',
  // // bgSide: '#E6E9ED',
  // bgSideSelect: '#DCDFE1',
  // bgHover: '#DCDFE188',
  // bgSoft: '#eeeeee',
  tab: {
    bg: '#FCFCFC',
    boxShadow: '1px 1px 0px 0px #44444429',
    active: '#ffffff',
  },
  // bgHover: '#cbdae5',

  // border
  border: {
    normal: '#dddddd',
    bold: '#888888',
  },
  // borderColor: '#dddddd',
  // borderBold: '#888888',

  // text
  text: {
    normal: '#444444',
    soft: '#666666',
    tiny: '#888888',
  },
  // textColor: '#444444',
  // textSoftColor: '#666666',
  textTinyColor: '#888888',

  // icon
  iconColor: '#737475',
  iconSoftColor: '#888888',
  iconTinyColor: '#aaaaaa',

  // text input
  textInputReadOnly: '#eeeeee',

  // button
  button: {
    normal: {
      // bg: 'linear-gradient(to bottom, #fcfcfc 0%, #f1f1f1 100%)',
      // border: '#c2c0c2 #c2c0c2 #a19fa1 #c2c0c2',
      bg: '#FAFBFC',
      border: '#D9DBDB',
    },
    primary: {
      // bg: 'linear-gradient(to bottom, #6eb4f7 0%, #1a82fb 100%)',
      // border: '#388df8',
      bg: '#2488FF',
      border: '#238AF7',
    }
  },

  // icon button
  iconButton: {
    hover: '#00000011',
  },

  // context menu
  contextMenuColor: '#F5F5F4',

  // issue
  issuesBg: '#fafafa',
  issueReadBgColor: '#EEEEEE',

  // browser
  // browserToolbarColor: '#D3D1D3',
  browserAddressBarColor: '#F1F3F4',
};

let currentThemeName: ThemeNameEntity = 'light';

export function setAppThemeName(themeName: ThemeNameEntity) {
  currentThemeName = themeName;
}

export function appTheme() {
  return currentThemeName === 'light' ? lightTheme : lightTheme;
}
