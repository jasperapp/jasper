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

function fail() {
  // remove splash
  const splash = document.querySelector('#splash');
  splash.parentNode.removeChild(splash);

  // display fail content
  const failContent = document.querySelector('#failContent');
  failContent.style.display = null;
  document.querySelector('#openGitHub').onclick = () => {
    require('electron').ipcRenderer.send('open-github')
    failContent.style.display = 'none';
  };
}

if (location.hash === '#service-already') {
  window.addEventListener('DOMContentLoaded', start);
} else {
  require('electron').ipcRenderer.on('service-ready', start);
  require('electron').ipcRenderer.on('service-fail', fail);
}

// load theme
{
  require('electron').ipcRenderer.on('load-theme-main', (event, css)=> {
    document.querySelector('head style#theme-main').textContent = css;
  });
}
