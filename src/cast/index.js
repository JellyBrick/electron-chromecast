import { Browser } from '@astronautlabs/mdns';

import ApiConfig from './_Classes/ApiConfig';
import Error from './_Classes/Error';
import Image from './_Classes/Image';
import Receiver from './_Classes/Receiver';
import ReceiverDisplayStatus from './_Classes/ReceiverDisplayStatus';
import SenderApplication from './_Classes/SenderApplication';
import Session from './_Classes/Session';
import SessionRequest from './_Classes/SessionRequest';
import Volume from './_Classes/Volume';
import Media from './media';

const browser = new Browser('_googlecast._tcp');

// DEV: Global config variables
let globalApiConfig;
/**
 * @type {Receiver[]}
 */
let receiverList = [];
const receiverListeners = [];
/**
 * @type {Session[]}
 */
const sessions = [];
const uniqBy = (arr, predicate) => {
  const cb = typeof predicate === 'function' ? predicate : (o) => o[predicate];

  return [...arr.reduce((map, item) => {
    const key = (item === null || item === undefined) ?
      item : cb(item);

    map.has(key) || map.set(key, item);

    return map;
  }, new Map()).values()];
};


browser.on(
  'serviceUp',
  /**
   * @param {import('@astronautlabs/mdns').Service} service
   */
  (service) => {
    const receiver = new chrome.cast.Receiver(service.txt.id, service.txt.fn);

    receiver.ipAddress = service.addresses[0];
    receiver.service_fullname = service.fullname;
    receiver.port = service.port;
    receiverList.push(receiver);
    receiverList = uniqBy(receiverList, (it) => it.service_fullname);
    /**
     Service object
     {
     interfaceIndex: 4,
     name: 'somehost',
     networkInterface: 'en0',
     type: {name: 'http', protocol: 'tcp', subtypes: []},
     replyDomain: 'local.',
     fullname: 'somehost._http._tcp.local.',
     host: 'somehost.local.',
     port: 4321,
     addresses: [ '10.1.1.50', 'fe80::21f:5bff:fecd:ce64' ]
     }
     **/
    // DEV: Notify listeners that we found cast devices
    if (globalApiConfig) globalApiConfig.receiverListener(chrome.cast.ReceiverAvailability.AVAILABLE);
  },
).on(
  'serviceDown',
  /**
   * @param {import('@astronautlabs/mdns').Service} service
   */
  (service) => {
    const downReceiver = new chrome.cast.Receiver(service.fullname, service.name);
    downReceiver.ipAddress = service.addresses[0];

    receiverList = receiverList.filter((receiver) =>
      receiver.ipAddress !== downReceiver.ipAddress &&
      receiver.friendlyName !== downReceiver.friendlyName
    );
    // DEV: If we have run out of receivers, notify listeners that there are none available
    if (receiverList.length === 0) globalApiConfig.receiverListener(chrome.cast.ReceiverAvailability.UNAVAILABLE);
  },
).start();

export const Cast = class {
  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.AutoJoinPolicy
  static AutoJoinPolicy = {
    TAB_AND_ORIGIN_SCOPED: 'TAB_AND_ORIGIN_SCOPED',
    ORIGIN_SCOPED: 'ORIGIN_SCOPED',
    PAGE_SCOPED: 'PAGE_SCOPED',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.Capability
  static Capability = {
    VIDEO_OUT: 'VIDEO_OUT',
    VIDEO_IN: 'VIDEO_IN',
    AUDIO_OUT: 'AUDIO_OUT',
    AUDIO_IN: 'AUDIO_IN',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.DefaultActionPolicy
  static DefaultActionPolicy = {
    CREATE_SESSION: 'CREATE_SESSION',
    CAST_THIS_TAB: 'CAST_THIS_TAB',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.ErrorCode
  static ErrorCode = {
    CANCEL: 'CANCEL',
    TIMEOUT: 'TIMEOUT',
    API_NOT_INITIALIZED: 'API_NOT_INITIALIZED',
    INVALID_PARAMETER: 'INVALID_PARAMETER',
    EXTENSION_NOT_COMPATIBLE: 'EXTENSION_NOT_COMPATIBLE',
    EXTENSION_MISSING: 'EXTENSION_MISSING',
    RECEIVER_UNAVAILABLE: 'RECEIVER_UNAVAILABLE',
    SESSION_ERROR: 'SESSION_ERROR',
    CHANNEL_ERROR: 'CHANNEL_ERROR',
    LOAD_MEDIA_FAILED: 'LOAD_MEDIA_FAILED',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.isAvailable
  static isAvailable = true;

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.ReceiverAction
  static ReceiverAction = {
    CAST: 'CAST',
    STOP: 'STOP',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast.html#.ReceiverActionListener
  static ReceiverActionListener = class {};

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.ReceiverAvailability
  static ReceiverAvailability = {
    AVAILABLE: 'AVAILABLE',
    UNAVAILABLE: 'UNAVAILABLE',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.ReceiverType
  static ReceiverType = {
    CAST: 'CAST',
    HANGOUT: 'HANGOUT',
    CUSTOM: 'CUSTOM',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.SenderPlatform
  static SenderPlatform = {
    CHROME: 'CHROME',
    IOS: 'IOS',
    ANDROID: 'ANDROID',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.SessionStatus
  static SessionStatus = {
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
    STOPPED: 'STOPPED',
  };

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.VERSION
  static VERSION = [1, 2];

  static addReceiverActionListener = (listener) => {
    // TODO: https://developers.google.com/cast/docs/reference/chrome/chrome.cast.html#.addReceiverActionListener
    receiverListeners.push(listener);
  }

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.initialize
  static initialize = (apiConfig, successCallback, errorCallback) => {
    if (globalApiConfig) {
      // DEV: The chromecast API has already been initialzed
      errorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.INVALID_PARAMETER));
      return;
    }
    globalApiConfig = apiConfig;

    if (receiverList.length > 0) {
      globalApiConfig.receiverListener(chrome.cast.ReceiverAvailability.AVAILABLE);
    } else {
      globalApiConfig.receiverListener(chrome.cast.ReceiverAvailability.UNAVAILABLE);
    }
    successCallback();
  }

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.logMessage
  static logMessage = (message) => {
    castConsole.info('CAST MSG:', message); // eslint-disable-line
  }

  static removeReceiverActionListener = (listener) => {
    // TODO: https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.removeReceiverActionListener
    castConsole.log(listener);
  }

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.requestSession
  static requestSession = (successCallback, errorCallback, opt_sessionRequest) => { // eslint-disable-line
    // TODO: Utilize passed in opt_sessionRequest if present, remove disable line
    const id = sessions.length;

    if (receiverList.length === 0) {
      errorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.RECEIVER_UNAVAILABLE));
    } else {
      requestHandler(receiverList)
        .then((chosenDevice) => {
          const createSession = () => {
            const session = new chrome.cast.Session(
              id,
              globalApiConfig.sessionRequest.appId,
              chosenDevice.friendlyName,
              [],
              chosenDevice,
              successCallback
            );
            sessions.push(session);
          };
          // If we already have a session, terminate the old one and then start
          // the new one
          if (sessions.length && sessions[sessions.length - 1].status !== chrome.cast.SessionStatus.STOPPED) {
            sessions[sessions.length - 1].stop(() => {
              setTimeout(createSession, 0);
            }, () => {});
          } else {
            createSession();
          }
        })
        .catch((message) => {
          if (message === Cast.ReceiverAction.STOP && sessions.length) {
            sessions[sessions.length - 1].stop(() => {}, () => {});
          }
          return errorCallback(new chrome.cast.Error(chrome.cast.ErrorCode.CANCEL));
        });
    }
  }

  static requestSessionById = (sessionId) => {
    // TODO: https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.requestSessionById
    castConsole.log('Get Session', sessionId);
  }

  static setCustomReceivers = (receivers, successCallback, errorCallback) => {
    // TODO: https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.setCustomReceivers
    castConsole.log(receivers, successCallback, errorCallback);
  }

  static setReceiverDisplayStatus = (receiver, successCallback, errorCallback) => {
    // TODO: https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.setReceiverDisplayStatus
    castConsole.log(receiver, successCallback, errorCallback);
  }

  // https://developers.google.com/cast/docs/reference/chrome/chrome.cast#.unescape
  static unescape = (escaped) => unescape(escaped);
}

// Static Classes
Cast.ApiConfig = ApiConfig;
Cast.Error = Error;
Cast.Image = Image;
Cast.Receiver = Receiver;
Cast.ReceiverDisplayStatus = ReceiverDisplayStatus;
Cast.SenderApplication = SenderApplication;
Cast.Session = Session;
Cast.SessionRequest = SessionRequest;
Cast.Volume = Volume;

// Extensions
Cast.media = Media;
Cast.timeout = {};
