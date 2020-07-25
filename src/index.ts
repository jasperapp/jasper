import {app} from 'electron';
import {ConfigSetup} from './Main/Setup/ConfigSetup';
import {AppWindow} from './Main/AppWindow';
import {IPCSetup} from './Main/IPCSetup';

async function index() {
  await app.whenReady();
  await AppWindow.init();
  await IPCSetup.setup();
  await ConfigSetup.exec();
  await require('./Main/App').App.start();
}

index();
