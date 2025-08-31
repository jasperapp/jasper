const path = require('path');
const {notarize} = require('electron-notarize');
const account = require(`${process.env.HOME}/.apple/notarize-account.json`);

const teamId = 'G3Z4F76FBZ';
const appPath = path.resolve('./out/release-app/Jasper.app');
const appBundleId = 'io.jasperapp';

async function notarizeApp() {
  console.log(`afterSign: Notarizing ${appBundleId} in ${appPath}`);
  await notarize({
    appBundleId,
    appPath,
    appleId: account.id,
    appleIdPassword: account.password,
    teamId,
    tool: 'notarytool',
  });
  console.log('afterSign: Notarized');
}

notarizeApp();
