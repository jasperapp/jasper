const path = require('path');
const {notarize} = require('electron-notarize');
const account = require(`${process.env.HOME}/.apple/notarize-account.json`);

const ascProvider = 'G3Z4F76FBZ';
const appPath = path.resolve('./out/mac/Jasper.app');
const appBundleId = 'io.jasperapp';

async function notarizeApp() {
  console.log(`afterSign: Notarizing ${appBundleId} in ${appPath}`);
  await notarize({
    appBundleId,
    appPath,
    appleId: account.id,
    appleIdPassword: account.password,
    ascProvider,
  });
  console.log('afterSign: Notarized');
}

notarizeApp();

