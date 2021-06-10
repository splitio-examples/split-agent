import { v4 as uuidv4 } from "uuid";

export default class Session {
  constructor(splitClient, eventBus) {
    this.splitClient = splitClient;
    this.eventBus = eventBus;

    this.SESSION_LENGTH = 1000 * 60 * 30; // 30 Minutes

    this.activate();
    this.registerEvents();
  }

  // Initialization

  activate() {
    if(this.isActive()) {
      // Existing session is active
      // Do nothing
    } else if(this.isExpired()) {
      // Existing session is expired
      this.endSession();
    } else {
      // No valid session exists
      this.startNewSession();
    }
  }

  registerEvents() {
    const tracker = this;
    this.eventBus.addToDutyCycle(() => {
      tracker.checkExpired() 
    });

    this.eventBus.addOnUserAction(event => { 
      tracker.updateLastActiveTime(this.now());
    });

    window.addEventListener("beforeunload", (event) => {
      tracker.saveToStorage()
    });
  }

  // Accessors

  getSessionKey() {
    this.activate();
    return this.session.key;
  }

  getTotalSessionTime() {
    this.activate();
    return this.session.lastActiveTime - this.session.startTime;
  }

  // Interaction Triggers

  checkExpired() {
    if(this.isExpired()) {
      // Existing session is expired
      this.endSession();
    }
  }

  updateLastActiveTime(currentTime) {
    this.activate();
    this.session.lastActiveTime = currentTime;
    // this.saveToStorage();
  }

  // Session Object Management

  startNewSession() {
    this.session = {
      key: "session-" + uuidv4(),
      startTime: this.now(),
      lastActiveTime: this.now(),
    };
    this.saveToStorage();

    // Trigger Session Start Event
    this.trackSessionStart();

    return this.session;
  }

  endSession() {
    // Trigger Session End Event
    this.trackSessionEnd();
    this.removeFromStorage();
  }

  isActive(activeAt = this.now()) {
    // Session exists, and lastActiveTime was within window
    const session = this.getFromStorage();
    return session &&
      session.lastActiveTime >= activeAt - this.SESSION_LENGTH;
  }

  isExpired(activeAt = this.now()) {
    // Session exists, and lastActiveTime is outside of window
    const session = this.getFromStorage();
    return session &&
      session.lastActiveTime < activeAt - this.SESSION_LENGTH;
  }

  // Local Storage

  getFromStorage() {
    if (!this.session) {
      this.session = this.getStorageObject("split.session");
    }
    return this.session;
  }

  saveToStorage() {
    // Read before write :(
      const currentSession = this.getFromStorage("split.session");

    // A more recent session was started at some point
    if(currentSession && this.session.startTime < currentSession.startTime) {
      this.session.key = currentSession.key;
      this.session.startTime = currentSession.startTime;
    }

    // Only save if activity time is more recent
    if(!currentSession || this.session.lastActiveTime > currentSession.lastActiveTime) {
      this.setStorageObject("split.session", this.session);
    }
  }

  removeFromStorage() {
    this.session = null;
    window.localStorage.removeItem("split.session");
  }

  // Tracking

  trackSessionStart() {
    this.splitClient.track("session.start");
  }

  trackSessionEnd() {
    const properties = {
      "session.start": this.session.lastActiveTime - this.sessionStart,
      "session.end": this.session.lastActiveTime,
      "session.pages": this.session.pageViews,
    }
    this.splitClient.track("session.end", properties);
  }

  // Helpers

  now() {
    return new Date().getTime();
  }
  
  setStorageObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  
  getStorageObject(key) {
    const value = localStorage.getItem(key);
    return value && JSON.parse(value);
  }
}