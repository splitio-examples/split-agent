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
  
  runOperations(eventType, event) {
    const operations = this.listeners[eventType];
    if (operations) {
      operations.forEach(operation => {
        operation(event);
      });
    }
  }

  addToDutyCycle(operation) {
    this.dutyCycle.push(operation);
  }

  addEventListener(eventType, operation, tail = false) {
    let operations = this.listeners[eventType];
    if (!operations) {
      operations = [];
      window.addEventListener(eventType, (event) => {
        this.runOperations(eventType, event);
      })
    }
    if(tail) {
      operations.push(operation);
    } else {
      operations.unshift(operation);
    }
    this.listeners[eventType] = operations;
  }

  addOnUserAction(operation) {
    this.USER_ACTIVITY_EVENTS.forEach(name => {
      this.addEventListener(name, operation, true); 
    });
  }
}