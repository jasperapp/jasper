function start() {
  'use strict';

  require('process').on('unhandledRejection', function(reason, p){
    const Logger = require('electron').remote.require('color-logger').default;
    Logger.e(`[browser] Unhandled Rejection at: ${p}`);
    Logger.e(`[browser] reason: ${reason}`);
  });

  require('../Component/AppComponent');

  {
    const splash = document.querySelector('#splash');
    splash.parentNode.removeChild(splash);
  }

  location.hash = 'service-already';
}

if (location.hash === '#service-already') {
  window.addEventListener('DOMContentLoaded', start);
} else {
  require('electron').ipcRenderer.on('service-ready', start);
}

// load theme
{
  require('electron').ipcRenderer.on('load-theme-main', (event, css)=> {
    document.querySelector('head style#theme-main').textContent = css;
  });
}
