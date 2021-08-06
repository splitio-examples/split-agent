import {finder} from '@medv/finder'

export default class ClickTracker {
  constructor(splitClient, tracked=[]) {
    this.splitClient = splitClient;
    this.tracked = tracked;

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
    const target = finder(clickEvent.target);
    const rage = this.isRageClick(clickEvent);
    if(rage || this.isTrackedElement(target)) {
      const properties = {
        "click.target": target,
        "click.rage": rage
      };
      this.splitClient.track("click", properties);
    }
  }

  // Internal Methods

  isTrackedElement(target) {
    return true;
    if(this.tracked.find((selector) => target.matches(selector))) {
      return true;
    } else {
      return true;
    }
  }

  isRageClick(clickEvent, currentTime = this.now()) {
    if(this.lastClick && this.lastClick.target === clickEvent.target && currentTime - this.lastClick.time < this.RAGE_COOLDOWN) {
      const delay = currentTime - this.lastClick.time;

      var rage = false;
      if(!this.lastClick.triggered && this.lastClick.count >= this.RAGE_MIN_CLICKS) {
        // Rage confirmed
        rage = true;
      }
      console.log(rage)

      // Some rage, update state
      this.lastClick = {
        target: clickEvent.target,
        count: this.lastClick.count + 1,
        time: currentTime,
        triggered: rage || this.lastClick.triggered,
        delay: delay
      };

      if(rage) {
        const rage_event = new CustomEvent('split.rage_click', this.lastClick);
        document.dispatchEvent(rage_event);
      }

      return rage;
    } else {
      // No rage, reset state
      this.lastClick = {
        target: clickEvent.target,
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
