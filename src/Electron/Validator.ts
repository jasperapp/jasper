class _Validator {
  validateSetup(config) {
    // validate host
    if (!config.host) return false;

    // validate token
    if (!config.accessToken) return false;
    if (!config.accessToken.match(/^[0-9a-z]+$/)) return false;

    // validate path prefix
    if (config.host !== 'api.github.com' && !config.pathPrefix) return false;
    if (config.host === 'api.github.com' && config.pathPrefix) return false;

    // validate web host
    if (!config.webHost) return false;
    if (config.host === 'api.github.com' && config.webHost !== 'github.com') return false;

    return true;
  }

  validatePreferences(config) {
    if (!this.validateSetup(config.github)) return false;

    // validate interval
    if (!config.github.interval) return false;
    if (config.github.interval < 10) return false;

    // database
    if (!config.database.max) return false;
    if (config.database.max > 1000000) return false;

    return true;
  }
}

export const Validator = new _Validator();
