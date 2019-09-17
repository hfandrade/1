import mondayApi from "./monday-api-client";

window.monday = {
  listeners: {},
  init: clientId => {
    window.monday.clientId = clientId;
    window.addEventListener("message", window.monday.receiveMessage, false);
  },
  token: token => {
    window.monday.apiToken = token;
  },
  api: query => {
    if (window.monday.apiToken) {
      return mondayApi({ query }, { token: window.monday.apiToken });
    } else {
      return new Promise(function(resolve, reject) {
        window.monday.localApi("api", { query }).then(result => {
          resolve(result.data);
        });
      });
    }
  },
  localApi: (method, args) => {
    return new Promise(function(resolve, reject) {
      const requestId = Math.random()
        .toString(36)
        .substr(2, 9);

      const clientId = window.monday.clientId;
      window.parent.postMessage({ method, args, requestId, clientId }, "*");
      window.monday.addListener(requestId, data => {
        resolve(data);
      });
    });
  },
  receiveMessage: event => {
    const { method, requestId } = event.data;
    const methodListeners = window.monday.listeners[method] || [];
    const requestIdListeners = window.monday.listeners[requestId] || [];
    const listeners = [...methodListeners, ...requestIdListeners];

    if (listeners) {
      listeners.forEach(listener => {
        listener(event.data);
      });
    }
  },
  listen: (type, callback) => {
    window.monday.addListener(type, callback);
    window.monday.localApi("listen", { type });
    // todo uniq listeners, remove listener
  },
  addListener: (key, callback) => {
    window.monday.listeners[key] = window.monday.listeners[key] || [];
    window.monday.listeners[key].push(callback);
  },
  authenticate: () => {
    var url = `https://auth.monday.com/oauth/authorize?client_id=${window.monday.clientId}&scope=me:monday_service_session`;
    window.location = url;
  }
};