import AppDispatcher from "#SRC/js/events/AppDispatcher";

import {
  REQUEST_CONSOLE_CONNECT,
  REQUEST_CONSOLE_DISCONNECT,
  REQUEST_CONSOLE_MESSAGE_ERROR,
  REQUEST_CONSOLE_MESSAGE_SUCCESS
} from "../constants/ActionTypes";

var ws;

function getConsoleURL(task) {
  return `ws://${window.location.host}/terminal/375e9a1b2b58/ws`;
}

function sendMessage(ws, type, content) {
  var message = JSON.stringify({
    type,
    content
  });
  if (ws.readyState !== 3) {
    ws.send(message);
  }
}

var ConsoleActions = {
  consoleConnect(task) {
    ws = new WebSocket(getConsoleURL(task));

    ws.onopen = function(event) {
      sendMessage(ws, "init", JSON.stringify({ Arguments: "", AuthToken: "" }));
      // pingTimer = setInterval(sendPing, 30 * 1000, ws);
      AppDispatcher.dispatch({
        type: REQUEST_CONSOLE_CONNECT,
        data: "Connect success"
      });
    };

    ws.onmessage = function(event) {
      // console.log(event)
      var data = JSON.parse(event.data);
      switch (data.type) {
        case "output":
          // decode message and convert to utf-8
          // term.io.writeUTF8(window.atob(data.content));

          break;
        case "pong":
          // pong
          break;
        case "set-title":
          // term.setWindowTitle(data.content);
          break;
        case "set-preferences":
          // var preferences = JSON.parse(data.content);
          // Object.keys(preferences).forEach(function(key) {
          //     console.log("Setting " + key + ": " +  preferences[key]);
          //     term.getPrefs().set(key, preferences[key]);
          // });
          break;
        case "set-autoreconnect":
          // autoReconnect = JSON.parse(data.content);
          // console.log("Enabling reconnect: " + autoReconnect + " seconds")
          break;
        case "error":
          // term.io.writeUTF8(window.atob(data.content));
          break;
        default:
          console.log("new websocket");
        // unidentified message
        // term.io.writeUTF8("Invalid message: " + event.data);
      }
    };

    ws.onclose = function(event) {
      // if (term) {
      //     term.uninstallKeyboard();
      //     term.io.showOverlay("Connection Closed", null);
      // }
      // clearInterval(pingTimer);
      // if (autoReconnect > 0) {
      //     setTimeout(openWs, autoReconnect * 1000);
      // }
      console.log("WebSocket close");
    };
  }
};

module.exports = ConsoleActions;
