const path = require('path');
const {notarize} = require('electron-notarize');

const appleId = "TODO";
const appleIdPassword = "TODO";
const ascProvider = 'G3Z4F76FBZ';
const appPath = path.resolve('./out/mac/Jasper.app');
const appBundleId = 'io.jasperapp';

async function notarizeApp() {
  console.log(`afterSign: Notarizing ${appBundleId} in ${appPath}`);
  await notarize({
    appBundleId,
    appPath,
    appleId,
    appleIdPassword,
    ascProvider,
  });
  console.log('afterSign: Notarized');
}

notarizeApp();

