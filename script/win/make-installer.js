const electronInstaller = require('electron-winstaller');
async function make() {
  const version = require('../../package').version;
  try {
    await electronInstaller.createWindowsInstaller({
      appDirectory: './out/win/Jasper',
      outputDirectory: './out/win/',
      loadingGif: './script/win/install.gif',
      authors: 'Ryo Maruyama',
      description: 'Jasper - A flexible and powerful issue reader for GitHub',
      setupExe: `jasper_v${version}_windows_setup.exe`,
      noMsi: true,
      exe: 'jasper.exe'
    });
  } catch (e) {
    console.log(`No dice: ${e.message}`);
  }
}

make();
