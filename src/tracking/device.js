import { v4 as uuidv4 } from "uuid";
const useragent = require("useragent");

const UNAVAILABLE = "unavailable";

let device = null;

export function deviceKey() {
  if (!device) {
    device = window.localStorage.getItem("split.deviceKey");
    if (!device) {
      device = "device-" + uuidv4();
      window.localStorage.setItem("split.deviceKey", device);
    }
  }
  return device;
}

/**
 * Build context related properties for events
 */
export function loadContextProperties() {
  const userAgentProperties = getUserAgentProperties();
  return {
    connectionType: getConnectionType(),
    url: getUrl(),
    ...userAgentProperties
  };
}

/**
 * Get information about the system's connections ('wifi', 'cellular', etc)
 * More Information: https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API
 * */
function getConnectionType() {
  const connection =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  return connection ? connection.effectiveType : UNAVAILABLE;
}

/**
 * Get the current page URL
 */
function getUrl() {
  return document.location.href;
}

function getUserAgentProperties() {
  const userAgentString = navigator ? navigator.userAgent : UNAVAILABLE;
  const agent = useragent.parse(userAgentString);
  return {
    user_agent: userAgentString,
    "user_agent.browser.family": agent.family,
    "user_agent.browser.major": agent.major,
    "user_agent.browser.minor": agent.minor,
    "user_agent.browser.patch": agent.patch,
    "user_agent.os.family": agent.os.family,
    "user_agent.os.major": agent.os.major,
    "user_agent.os.minor": agent.os.minor,
    "user_agent.os.patch": agent.os.patch,
    "user_agent.device.family": agent.device.family,
    "user_agent.device.major": agent.device.major,
    "user_agent.device.minor": agent.device.minor,
    "user_agent.device.patch": agent.device.patch
  };
}
