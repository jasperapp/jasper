import {app} from 'electron';
import {ConfigSetup} from './Main/ConfigSetup';
import {AppWindow} from './Main/AppWindow';

async function index() {
  await app.whenReady();
  await AppWindow.init();
  await ConfigSetup.start();
  await require('./Main/App').App.start();
}

index();
