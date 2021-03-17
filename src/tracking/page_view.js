import { registerEventListener } from '../utils/eventbus'

export default class PageViewTracker {
  constructor(splitClient, eventBus) {
    this.splitClient = splitClient;
    this.eventBus = eventBus;

    if (this.supportsPageTiming()) {
      if (this.checkLoaded()) {
        this.trackPageView();
      } else {
        this.registerEvents();
      }
    } else {
      console.log("Browser does not support page view tracking");
    }
  }

  // Initialize

  registerEvents() {
    const tracker = this;

    // Defer, because we should wait until the handlers finish to allow customer logic run first.
    this.eventBus.addEventListener("load", () => {
      setTimeout(() => {
        tracker.trackPageView()
      }, 0);
    });

    // If there's an unload, calculate what's possible and send.
    this.eventBus.addEventListener("unload", () => {
      tracker.trackPageView()
    });
  }

  supportsPageTiming() {
    return (
      window.addEventListener &&
      ((navigator && navigator.sendBeacon) ||
        (XMLHttpRequest && typeof XDomainRequest !== "undefined"))
    );
  }

  checkLoaded() {
    return document.readyState === "complete";
  }

  // Tracking

  trackPageView() {
    const properties = this.loadNavigationTimingProperties();
    this.splitClient.track("page_view", properties);
  }

  /**
   * Build navigation timing related properties for events
   */
  loadNavigationTimingProperties() {
    const pageNav = this.getNavEntry();

    if (!pageNav) {
      return {};
    } else {
      return {
        "nav.timing.page_load": this.calculatePageLoadTime(pageNav),
        "nav.timing.first_byte": this.calculateTimeToFirstByte(pageNav),
        "nav.timing.dom_interactive": this.calculateTimeToDomInteractive(pageNav)
      };
    }
  }

  /**
   * Utility function for retrieving the navigation performance entry. There are two levels of the Navigation Timing API we need to handle.
   * Use the level 2, if not available, fallback. If none is available, return false so we can short circuit there.
   */
  getNavEntry() {
    if (!window.performance) return false; // We're in a dark place.

    return performance.getEntriesByType // If no entries we'll get undefined.
      ? performance.getEntriesByType("navigation")[0] // lvl2
      : performance.timing; // lvl1.
  }

  /**
   * Page Load Time
   * How long did it took for my page to be loaded? (including images, etc. Basically everything that's part of the first load)
   */
  calculatePageLoadTime(navEntry) {
    if (navEntry.duration > 0) {
      // Nav timing lvl 2
      return navEntry.duration;
    } else if (navEntry.navigationStart > 0 && navEntry.loadEventEnd > 0) {
      // Nav timing lvl 1
      return navEntry.loadEventEnd - navEntry.navigationStart;
    } else {
      return false;
    }
  }

  /**
   * Time to First Byte
   * We will check the difference from the point in time where the request for the document was issued and
   * when the response started arriving (the first byte!).
   */
  calculateTimeToFirstByte(navEntry) {
    if (navEntry.requestStart && navEntry.responseStart) {
      // Works for both levels of the Navigation Timing API.
      return navEntry.responseStart - navEntry.requestStart;
    } else {
      return null;
    }
  }

  /**
   * Time to Dom Interactive
   * This is the time when the browser finished parsing the html.
   * https://varvy.com/pagespeed/critical-render-path.html
   */
  calculateTimeToDomInteractive(navEntry) {
    if (
      navEntry.domInteractive > 0 &&
      navEntry.fetchStart > 0 &&
      navEntry.fetchStart % 1 === 0
    ) {
      // Performance entry is a regular timestamp, thus we are using Nav timing api lvl 1.
      return navEntry.domInteractive - navEntry.fetchStart;
    } else if (navEntry.domInteractive > 0) {
      // Performance entry is DOMHighResTimestamp, thus we have Nav timing api lvl 2
      return navEntry.domInteractive;
    } else {
      return null;
    }
  }
}