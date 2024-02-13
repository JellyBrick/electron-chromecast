import { Cast } from './cast';

export const chrome = {
  cast: Cast, // eslint-disable-line
};

export const requestHandler = (receiverList) => new Promise((resolve) => {
  resolve(receiverList[0]);
});

export const castSetting = {
  devMode: false,
};

export const castConsole = {
  log: (...args) => {
    if (!castSetting.devMode) return;
    console.log(...args); // eslint-disable-line
  },
  info: (...args) => {
    if (!castSetting.devMode) return;
    console.info(...args); // eslint-disable-line
  },
  warn: (...args) => {
    if (!castSetting.devMode) return;
    console.warn(...args); // eslint-disable-line
  },
  error: (...args) => {
    if (!castSetting.devMode) return;
    console.error(...args); // eslint-disable-line
  },
};

/**
 * @param {{
 *   chrome: {},
 *   castSetting: {},
 *   castConsole: {},
 *   requestHandler: (receiverList) => Promise<{}>,
 * }} obj
 */
export const injectChromeCompatToObject = (obj) => {
  /* eslint-disable no-param-reassign */
  obj.chrome = chrome;
  obj.castSetting = castSetting;
  obj.castConsole = castConsole;
  obj.requestHandler = requestHandler;
  /* eslint-enable no-param-reassign */
};
