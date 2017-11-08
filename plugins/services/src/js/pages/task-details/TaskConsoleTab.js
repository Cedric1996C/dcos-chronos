import React from "react";
import { routerShape } from "react-router";
import mixin from "reactjs-mixin";
import { StoreMixin } from "mesosphere-shared-reactjs";
import Task from "../../structs/Task";

class TaskConsoleTab extends mixin(StoreMixin) {
   constructor() {
    super(...arguments);
    this.state = {
      isLoading: true
    };
  }

  componentWillMount() {
    super.componentWillMount();
  }

  componentWillUnmount() {
    super.componentWillUnmount();

    // global.removeEventListener("message", this.onMessageReceived);
  }


  render() {
    const location = "http://localhost:21888/terminal/eb6b6eab9130";
    const { params, routes, task } = this.props;
    console.log(task)

    return (
      <div className="iframe-page-container">
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          id="console-iframe"
          src={location}
        />
      </div>
    );
  }
}

TaskConsoleTab.contextTypes = {
  params: React.PropTypes.object,
  routes: React.PropTypes.array,
  task: React.PropTypes.instanceOf(Task),
  router: routerShape
};

module.exports = TaskConsoleTab;