import PluginSDK from "PluginSDK";

import { SERVER_ACTION } from "#SRC/js/constants/ActionTypes";
import AppDispatcher from "#SRC/js/events/AppDispatcher";
import Config from "#SRC/js/config/Config";
import BaseStore from "#SRC/js/stores/BaseStore";

import {
  REQUEST_CONSOLE_CONNECT,
  REQUEST_CONSOLE_DISCONNECT,
  REQUEST_CONSOLE_MESSAGE_ERROR,
  REQUEST_CONSOLE_MESSAGE_SUCCESS
} from "../constants/ActionTypes";

import { CONSOLE_CONNNECT_SUCCESS } from "../constants/EventTypes";

// import TaskConsoleTab from "../structs/TaskDirectory";
import ConsoleActions from "../events/ConsoleActions";

class ConsoleStore extends BaseStore {
  constructor() {
    super(...arguments);

    this.dispatcherIndex = AppDispatcher.register(payload => {
      if (payload.source !== SERVER_ACTION) {
        return false;
      }

      const { data, innerPath, task, type } = payload.action;
      switch (type) {
        case REQUEST_CONSOLE_CONNECT:
          this.processConsoleConnect(data);
          break;
        case REQUEST_CONSOLE_DISCONNECT:
          // this.emit(TASK_DIRECTORY_ERROR, task.id);
          break;
        case REQUEST_CONSOLE_MESSAGE_ERROR:
          // this.emit(NODE_STATE_ERROR, task.id);
          break;
        case REQUEST_CONSOLE_MESSAGE_SUCCESS:
          // this.emit(NODE_STATE_SUCCESS, task.id);
          break;
      }

      return true;
    });
  }

  connectConsole(task) {
    console.log("consoleStore: connectConsole");
    ConsoleActions.consoleConnect(task);
  }

  addChangeListener(eventName, callback) {
    this.on(eventName, callback);
  }

  removeChangeListener(eventName, callback) {
    this.removeListener(eventName, callback);
  }

  processConsoleConnect(data) {
    // Only update when receiving response from what was requested
    console.log("dispatch console connect");
    this.emit(CONSOLE_CONNNECT_SUCCESS, data);
  }
}

module.exports = new ConsoleStore();
