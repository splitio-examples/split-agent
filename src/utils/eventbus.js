export default class EventBus {
  constructor() {
    this.listeners = {};
    this.dutyCycle = [];

    this.DUTY_CYCLE_LENGTH = 1000 * 30; // 30 Seconds
    this.USER_ACTIVITY_EVENTS = [
      "mousedown",
      "mousemove",
      "keypress",
      "keydown",
      "scroll",
      "touchstart",
      "click"
    ];

    if (!window.setInterval) {
      // Don't do stuff
    }

    window.setInterval(() => { this.runDutyCycle() }, this.DUTY_CYCLE_LENGTH);
  }

  runDutyCycle() {
    this.dutyCycle.forEach(operation => {
      operation();
    });
  }

  addToDutyCycle(operation) {
    this.dutyCycle.push(operation);
  }

  addOnUserAction(operation) {
    this.USER_ACTIVITY_EVENTS.forEach(name => {
      window.addEventListener(name, operation, true); 
    });
  }
}