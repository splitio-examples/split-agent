export default class ClickTracker {
  constructor(splitClient, tracked=[]) {
    this.splitClient = splitClient;
    this.tracked = tracked || [];

    this.RAGE_MIN_CLICKS = 5; // 5 clicks
    this.RAGE_COOLDOWN = 300; // Less than 300 ms apart

    this.registerEvents();
  }

  // Initialize

  registerEvents() {
    const tracker = this;
    // Capture clicks
    window.addEventListener("click", (event) => {
      tracker.trackClick(event);
    })
  }

  // Trackers

  trackClick(clickEvent) {
    const rage = this.isRageClick(clickEvent);
    if(rage || this.isTrackedElement(clickEvent)) {
      const target = clickEvent.target || clickEvent.srcElement;
      const properties = {
        "click.target": target,
        "click.rage": rage
      };
      this.splitClient.track("click", properties);
    }
  }

  // Internal Methods

  isTrackedElement(clickEvent) {
    const target = clickEvent.target || clickEvent.srcElement;
    if(this.tracked.find((selector) => target.matches(selector))) {
      return true;
    } else {
      return true;
    }
  }

  isRageClick(clickEvent, currentTime = this.now()) {
    const target = clickEvent.target || clickEvent.srcElement;
    if(this.lastClick && this.lastClick.target === target && currentTime - this.lastClick.time < this.RAGE_COOLDOWN) {
      const delay = currentTime - this.lastClick.time;
      // Some rage, update state
      this.lastClick = {
        target: target,
        count: this.lastClick.count + 1,
        time: currentTime,
        triggered: false,
      };

      if(!this.lastClick.triggered && this.lastClick.count >= this.RAGE_MIN_CLICKS) {
        // Rage confirmed
        return true;
      }
    } else {
      // No rage, reset state
      this.lastClick = {
        target: target,
        count: 1,
        time: currentTime,
        triggered: false,
      };
    }
    return false;
  }

  // Helpers

  now() {
    return new Date().getTime();
  }
}