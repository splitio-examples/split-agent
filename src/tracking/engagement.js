export default class EngagementTracker {
  constructor(splitClient, eventBus) {
    this.splitClient = splitClient;
    this.eventBus = eventBus;

    this.MINIMUM_IDLE_THRESHOLD = 1000 * 60; // 1 Minute

    this.reset();
    this.registerEvents();
  }

  // Initialization

  reset(currentTime = this.now()) {
    this.siteInstanceStartTime = currentTime;

    // Window Visibility
    if(!this.isVisible()) {
      this.unfocusTime = currentTime;
    }
    this.totalUnfocusedTime = 0;

    // User Idle
    this.lastActiveTime = currentTime;
    this.totalIdleTime = 0;
  }

  registerEvents() {
    const tracker = this;
    this.eventBus.addToDutyCycle(() => {
      tracker.trackEngagementPing();
    });

    this.eventBus.addOnUserAction(event => { 
      tracker.userActive(this.now());
    });

    this.eventBus.addEventListener("visibilitychange", event => {
      tracker.changeVisibility(this.now());
    });

    this.eventBus.addEventListener("beforeunload", event => {
      tracker.trackEngagement(this.now());
    });
  }

  // Accessors

  getTotalElapsedTime(currentTime) {
    return currentTime - this.siteInstanceStartTime;
  }

  getTotalUnfocusedTime(currentTime) {
    let totalUnfocusedTime = this.totalUnfocusedTime;
    if(!this.isVisible()) {
      totalUnfocusedTime += currentTime - this.unfocusTime;
    }
    return totalUnfocusedTime;
  }

  getTotalIdleTime(currentTime) {
    let totalIdleTime = this.totalIdleTime;
    const idleTime = currentTime - this.lastActiveTime;
    if(idleTime >= this.MINIMUM_IDLE_THRESHOLD) {
      // User has been idle for longer than threshold
      totalIdleTime += idleTime;
    }
    return totalIdleTime;
  }

  state(currentTime) {
    return {
      elapsedTotal: this.getTotalElapsedTime(currentTime),
      unfocusedTotal: this.getTotalUnfocusedTime(currentTime),
      idleTotal: this.getTotalIdleTime(currentTime),
    };
  }

  stateChange(priorState, currentState = state()) {
    if(priorState == null) {
      priorState = {
        elapsedTotal: 0,
        unfocusedTotal: 0,
        idleTotal: 0,
      };
    }
    return {
      elapsed: currentState.elapsedTotal - priorState.elapsedTotal,
      unfocused: currentState.unfocusedTotal - priorState.unfocusedTotal,
      idle: currentState.idleTotal - priorState.idleTotal,
      ...currentState,
    };
  }

  // Window Visibility

  isVisible() {
    return document.visibilityState === "visible";
  }

  changeVisibility(changeTime) {
    if(this.isVisible()) {
      if(this.unfocusTime) {
        this.totalUnfocusedTime += changeTime - this.unfocusTime;
        this.unfocusTime = null;
      }
    } else {
      this.unfocusTime = changeTime;
    }
    // Fire Change Visibility Event
  }

  // User Idle

  userActive(actionTime) {
    const idleTime = actionTime - this.lastActiveTime;
    if(idleTime >= this.MINIMUM_IDLE_THRESHOLD) {
      // User has been idle for longer than threshold
      this.totalIdleTime += idleTime;
    }
    this.lastActiveTime = actionTime;
  }

  // Trackers

  trackEngagement(currentTime) {
    const currentState = this.state(currentTime);

    const properties = {
      "time.elapsed.total": currentState.elapsedTotal,
      "time.unfocused.total": currentState.unfocusedTotal,
      "time.idle.total": currentState.idleTotal,
      "time.visible.total": currentState.elapsedTotal - currentState.unfocusedTotal,
      "time.active.total": currentState.elapsedTotal - currentState.idleTotal,
    };
    this.splitClient.track("engagement", properties);
  }

  trackEngagementPing(currentTime = this.now()) {
    const currentState = this.state(currentTime);
    const stateChange = this.stateChange(this.siteState, currentState);
    this.siteState = currentState;

    const properties = {
      "time.elapsed": stateChange.elapsed,
      "time.unfocused": stateChange.unfocused,
      "time.idle": stateChange.idle,
      "time.visible": stateChange.elapsed - stateChange.unfocused,
      "time.active": stateChange.elapsed - stateChange.idle,
    };
    this.splitClient.track("session.ping", properties);
  }

  // Helpers
  
  now() {
    return new Date().getTime();
  }
}
