export default class ErrorTracker {
  constructor(splitClient, eventBus) {
    this.splitClient = splitClient;
    this.eventBus = eventBus;

    this.registerEvents();
  }

  // Initialize

  registerEvents() {
    const tracker = this;
    // Capture browser uncaught errors.
    this.eventBus.addEventListener("error", errorEvent => {
      tracker.trackError(errorEvent);
    });
    // Capture browser promise rejection errors.
    this.eventBus.addEventListener("unhandledrejection", errorEvent => { 
      tracker.trackError(errorEvent.reason);
    });
  }

  // Tracking

  trackError(errorEvent) {
    const properties = this.getErrorProperties(errorEvent.error);
    this.splitClient.track("error", properties);
  }

  getErrorProperties(error) {
    if (this.isString(error)) {
      return {
        "error.message": error
      }
    } else if (this.isError(error)) {
      return {
        "error.message": this.isString(error.message) ? error.message : null,
        "error.stack": this.isString(error.stack) ? error.stack : null
      }
    } else {
      return {};
    }
  }

  // Internal Methods

  isError(o) {
    return (Object.prototype.toString.call(o) === '[object Error]');
  }

  isString(s) {
    return typeof s === 'string' || s instanceof String;
  }
}