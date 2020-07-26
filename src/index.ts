import {app} from 'electron';
import {AppWindow} from './Main/Window/AppWindow';
import {IPCSetup} from './Main/IPCSetup';

async function index() {
  await app.whenReady();
  await AppWindow.init();
  await IPCSetup.setup(AppWindow.getWindow());
}

index();
