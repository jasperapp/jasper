import Validator from '../../Validator';

const settings = {
  host: null,
  webHost: null,
  https: null,
  accessToken: null,
  pathPrefix: null,
};

function q(query) {
  return document.querySelector(query);
}

function goStep1() {
  q('#label-step1').classList.add('active');

  q('#selectGitHub').addEventListener('click', ()=>{
    settings.host = 'api.github.com';
    settings.webHost = 'github.com';
    settings.https = true;
    goStep2();
  });

  q('#selectGHE').addEventListener('click', ()=>{
    q('#inputGHE').style.display = null;

    const inputHost = q('#inputHost');
    inputHost.addEventListener('keydown', next);
    q('#buttonHost').addEventListener('click', next);

    function next(ev) {
      if (!inputHost.value) return;
      if (ev.keyCode === 13 || ev.type === 'click') {
        let host = inputHost.value;
        const matched = host.match(new RegExp('^https?://([^/]+)'));
        if (matched) host = matched[1];

        settings.host = host;
        settings.webHost = host;
        settings.https = q('#inputHTTPS').checked;

        goStep2();
      }
    }
  });
}

function goStep2() {
  q('#label-step1').classList.remove('active');
  q('#label-step2').classList.add('active');
  q('#step1').style.display = 'none';
  q('#step2').style.display = null;

  document.querySelector('#openPersonalAccessToken').addEventListener('click', ()=>{
    const schema = settings.https ? 'https' : 'http';
    const url = `${schema}://${settings.webHost}/settings/tokens`;
    require('electron').shell.openExternal(url);
  });

  const input = q('#step2 #inputAccessToken');
  input.addEventListener('keydown', next);
  q('#buttonAccessToken').addEventListener('click', next);

  function next(ev) {
    if (!input.value) return;
    if (ev.keyCode === 13 || ev.type === 'click') {
      settings.accessToken = input.value;
      goStep3();
    }
  }
}

function goStep3() {
  q('#step2').style.display = 'none';
  q('#step3').style.display = null;
  q('#label-step2').classList.remove('active');
  q('#label-step3').classList.add('active');

  if (settings.host === 'api.github.com') {
    q('#step3 #settingsPathPrefix').parentElement.style.display = 'none';
    q('#step3 #settingsWebHost').parentElement.style.display = 'none';
    q('#step3 #settingsHTTPS').parentElement.style.display = 'none';
  } else {
    settings.pathPrefix = '/api/v3/';
  }

  q('#step3 #settingsAccessToken').value = settings.accessToken;
  q('#step3 #settingsHost').value = settings.host;
  q('#step3 #settingsPathPrefix').value = settings.pathPrefix || '';
  q('#step3 #settingsWebHost').value = settings.webHost;
  q('#step3 #settingsHTTPS').checked = settings.https;

  q('#step3 #settingsOK').addEventListener('click', function(){
    settings.host = q('#step3 #settingsHost').value;
    settings.accessToken = q('#step3 #settingsAccessToken').value;
    settings.pathPrefix = q('#step3 #settingsPathPrefix').value || '';
    settings.webHost = q('#step3 #settingsWebHost').value;
    settings.https = q('#step3 #settingsHTTPS').checked;

    if (!Validator.validateSetup(settings)) return;

    connectionTest(settings);
  });
}

async function connectionTest(settings) {
  const electron = require('electron');
  const remote = electron.remote;
  const ipcRenderer = electron.ipcRenderer;

  q('#spinner').style.display = null;
  q('#connection').textContent = 'connecting...';
  q('#connectionTestFail').style.display = 'none';
  q('#openGitHub').onclick = () => ipcRenderer.send('open-github-for-setup', settings);

  // on connection-test-result
  ipcRenderer.once('connection-test-result', async (_ev, {error, res}: {error: Error, res: any}) => {
    q('#spinner').style.display = 'none';
    if (error) {
      q('#connection').textContent = 'Error';
      q('#connectionTestFail').style.display = 'block';
      console.log(error);
      return;
    }

    q('#connection').textContent = `Hello ${res.body.login}`;
    const Timer = remote.require('./Util/Timer.js').default;
    await Timer.sleep(1000);
    ipcRenderer.send('apply-settings', settings);
  });

  // on close-github-for-setup
  ipcRenderer.once('close-github-for-setup', () => connectionTest(settings));

  // send connection-test
  ipcRenderer.send('connection-test', settings);
}

goStep1();
