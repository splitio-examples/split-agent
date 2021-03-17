/* global splitio */

export default class SplitWrapper {
  // Initialization

  constructor(apikey, identities = {}, defaultProperties = {}) {
    // Factory is instantiated with a placeholder key
    // Clients will be generated for each identity
    this.factory = splitio({
      core: {
        authorizationKey: apikey,
        key: "PLACE_HOLDER"
      },
      storage: {
        type: "LOCALSTORAGE"
      }
    });
    this.manager = this.factory.manager();

    this.setIdentities(identities);
    this.setProperties(defaultProperties);
  }

  async blockUntilReady() {
    try {
      const promises = Object.values(this.clients).map(async client => client.ready())
      await Promise.all(promises)
    } catch (err) {
      // SDK Timed Out
      throw err;
    }
  }

  // Property Management

  setProperties(properties) {
    this.properties = properties;
  }

  // Identity Management

  getIdentities() {
    return this.identities;
  }

  setIdentities(identityMap) {
    const updatedClients = {};
    Object.entries(identityMap).forEach(([trafficType, key]) => {
      const existingKey = this.identities[trafficType];
      if (existingKey === key) {
        updatedClients[trafficType] = this.clients[trafficType];
      } else {
        updatedClients[trafficType] = this.factory.client(key, trafficType);
      }
    });
    this.clients = updatedClients;
    this.identities = identityMap;
  }

  addIdentities(identityMap) {
    this.setIdentities({
      ...this.identities,
      ...identityMap
    });
  }

  addIdentity(trafficType, key) {
    const identityMap = {};
    identityMap[trafficType] = key;
    this.addIdentities(identityMap);
  }

  removeIdentity(trafficType) {
    this.identities[trafficType] = null;
    this.clients[trafficType] = null;
  }

  // Get Treatment

  getTreatment(splitName, properties = {}) {
    const client = this.getSplitClient(splitName);
    if (client) {
      const mergedProperties = {
        ...this.properties,
        ...properties
      };
      return client.getTreatment(splitName, mergedProperties);
    } else {
      return "control";
    }
  }

  async getTreatmentWhenReady(splitName) {
    return this.blockUntilReady().then((_resolve) => {
      return this.getTreatment(splitName);
    });
  }

  // Internal Methods
  getSplitClient(splitName) {
    const trafficType = this.getTrafficType(splitName);
    return this.clients[trafficType];
  }

  getTrafficType(splitName) {
    const splitView = this.manager.split(splitName);
    if (splitView) {
      return splitView.trafficType;
    } else {
      return null;
    }
  }

  // Event Tracking

  track(eventType, properties = {}) {
    console.log("Tracking: " + eventType);
    const mergedProperties = {
      ...this.properties,
      ...properties
    };
    Object.values(this.clients).forEach((client) => {
      client.track(eventType, null, mergedProperties);
    });
  }

  // Event Flushing

  async destroy() {
    try {
      const promises = Object.values(this.clients).map(async client => client.destroy())
      await Promise.all(promises)
    } catch (err) {
      // Destroy Timed Out
      throw err;
    }
  }
}
