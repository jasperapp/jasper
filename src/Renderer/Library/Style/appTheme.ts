const lightTheme = {
  // bg
  bg: '#ffffff',
  bgSide: '#F5F5F4',
  bgSideSelect: '#DCDFE1',

  // border
  borderColor: '#dddddd',
  borderBold: '#888888',

  // text
  textColor: '#444444',
  textSoftColor: '#666666',
  textTinyColor: '#888888',

  // icon
  iconColor: '#737475',
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
  contextMenuHover: '#4391F7',

  // issue
  issuesBg: '#FAFAFA',
  issueReadBgColor: '#EEEEEE',

  // browser
  // browserToolbarColor: '#D3D1D3',
  browserAddressBarColor: '#F1F3F4',
};

export function appTheme() {
  return lightTheme;
}
