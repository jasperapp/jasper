import {Validator} from '../../Validator';
import {GARepo} from '../../Repository/GARepo';

GARepo.eventPrefOpen();

function q(selector) {
  return document.querySelector(selector);
}

let currentConfig;

function getConfig() {
  return {
    github: currentConfig.github,
    general: {
      browser: q('#configBrowser').value,
      notification: q('#configNotification').checked,
      notificationSilent: q('#configNotificationSilent').checked,
      onlyUnreadIssue: q('#configOnlyUnreadIssue').checked,
      badge: q('#configBadge').checked,
      alwaysOpenExternalUrlInExternalBrowser: q('#configAlwaysOpenExternalUrlInExternalBrowser').checked
    },
    database: {
      max: parseInt(q('#configDatabaseMax').value || '100000', 10)
    }
  };
}

{
  // wait for web fonts
  (document as any).fonts.ready.then(()=>{
    require('electron').ipcRenderer.send('fonts-ready');
  });

  // load current config
  require('electron').ipcRenderer.on('current-config', (_event, config)=> {
    currentConfig = config;
    q('#configBrowser').value = config.general.browser;
    q('#configNotification').checked = config.general.notification;
    q('#configNotificationSilent').checked = config.general.notificationSilent;
    q('#configOnlyUnreadIssue').checked = config.general.onlyUnreadIssue;
    q('#configBadge').checked = config.general.badge;
    q('#configAlwaysOpenExternalUrlInExternalBrowser').checked = config.general.alwaysOpenExternalUrlInExternalBrowser;
    q('#configDatabaseMax').value = config.database.max;
  });

  const setCurrentRecords = async function(){
    const DB = require('electron').remote.require('./DB/DB').DB;
    const tmp = await DB.selectSingle('select count(1) as c from issues');
    q('#databaseCurrent').value = tmp.c;
  };
  setCurrentRecords();

  // output new config
  window.addEventListener('beforeunload', (evt)=>{
    const config = getConfig();
    if (Validator.validatePreferences(config)) {
      require('electron').ipcRenderer.send('apply-config', config);
      GARepo.eventPrefClose();
    } else {
      evt.returnValue = false;
    }
  });

  document.addEventListener('keydown', function(ev){
    // output new config
    if (ev.keyCode === 27) { // esc
      const config = getConfig();
      if (Validator.validatePreferences(config)) {
        require('electron').ipcRenderer.send('apply-config', config);
        window.close();
      }
    }
  });
}

{
  const tabItems = document.querySelectorAll('.config-tab-item');
  for (const tabItem of Array.from(tabItems)) {
    tabItem.addEventListener('click', (ev)=>{
      const tabItem = ev.currentTarget as HTMLElement;
      q('.config-tab-item.active').classList.remove('active');
      q('.config-tab-content.active').classList.remove('active');

      const tabContentId = tabItem.dataset.tabContent;
      const tabContent = q('#' + tabContentId);

      tabItem.classList.add('active');
      tabContent.classList.add('active');
    });
  }
}

{
  // save streams
  q('#saveStreams').addEventListener('click', ()=>{
    require('electron').ipcRenderer.send('save-streams');
    GARepo.eventPrefStreamsSave();
  });

  // load streams
  q('#loadStreams').addEventListener('click', ()=>{
    require('electron').ipcRenderer.send('load-streams');
    GARepo.eventPrefStreamsLoad();
  });

  // load theme main
  q('#loadThemeMain').addEventListener('click', ()=>{
    require('electron').ipcRenderer.send('load-theme-main');
    GARepo.eventPrefThemeMainLoad();
  });

  // load theme browser
  q('#loadThemeBrowser').addEventListener('click', ()=>{
    require('electron').ipcRenderer.send('load-theme-browser');
    GARepo.eventPrefThemeBrowserLoad();
  });

  // load theme default
  q('#loadThemeDefault').addEventListener('click', ()=>{
    require('electron').ipcRenderer.send('load-theme-default');
    GARepo.eventPrefThemeDefaultLoad();
  });

  // delete all data
  q('#deleteAllData').addEventListener('click', ()=>{
    if (confirm('Are you sure you want to delete all data?')) {
      require('electron').ipcRenderer.send('delete-all-data');
    }
  });
}
