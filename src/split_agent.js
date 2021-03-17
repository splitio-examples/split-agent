import SplitWrapper from "./split/split_wrapper";
import PageViewTracker from "./tracking/page_view";
import ErrorTracker from "./tracking/error";
import EngagementPingTracker from "./tracking/engagement";
import SessionTracker from "./tracking/session";
import ClickTracker from "./tracking/click";
import EventBus from "./utils/eventbus";
import { loadContextProperties, deviceKey } from "./tracking/device";

export default class SplitAgent {
  constructor(apiKey) {
    this.splitWrapper = new SplitWrapper(apiKey);
    this.eventBus = new EventBus();
    
    this.sessionTracker = new SessionTracker(this.splitWrapper, this.eventBus);
    this.pageTracker = new PageViewTracker(this.splitWrapper, this.eventBus);
    this.errorTracker = new ErrorTracker(this.splitWrapper, this.eventBus);
    this.engagementTracker = new EngagementPingTracker(this.splitWrapper, this.eventBus);
    this.clickTracker = new ClickTracker(this.splitWrapper, this.eventBus);

    this.splitWrapper.setIdentities({
      session: this.sessionTracker.getSessionKey(),
      device: deviceKey(),
    });
    this.splitWrapper.setProperties(this.getDefaultProperties());
  }

  endSession() {
    this.sessionTracker.endSession()
  }

  getDefaultProperties() {
    const contextProperties = loadContextProperties();
    return {
      currentTime: new Date().getTime(),
      ...contextProperties
    };
  }

  // Split Wrapper Methods

  async blockUntilReady() {
    this.splitWrapper.blockUntilReady();
  }

  getIdentities() {
    return this.splitWrapper.getIdentities();
  }

  addIdentities(identityMap) {
    this.splitWrapper.addIdentities(identityMap);
  }

  addIdentity(trafficType, key) {
    this.splitWrapper.addIdentity(trafficType, key);
  }

  removeIdentity(trafficType) {
    this.splitWrapper.removeIdentity(trafficType);
  }

  getTreatment(splitName, properties = {}) {
    return this.splitWrapper.getTreatment(splitName, properties);
  }

  async getTreatmentWhenReady(splitName) {
    return this.splitWrapper.getTreatmentWhenReady(splitName);
  }

  track(eventType, properties = {}) {
    this.splitWrapper.track(eventType, properties);
  }

  addProperty(key, value) {
    const properties = {
      ...this.splitWrapper.privateProperties
    };
    properties[key] = value;
    this.splitWrapper.setPrivateProperties(properties);
  }

  setProperties(properties) {
    this.splitWrapper.setPrivateProperties(properties);
  }

  destroy() {
    this.splitWrapper.destroy();
  }
}