const mountAppFragment = require('../../Fragment/AppFragment').mountAppFragment;
process.once('loaded', () => {
  // @ts-ignore
  global.preload = {mountAppFragment};
});
