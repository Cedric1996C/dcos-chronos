import React from "react";
import { routerShape } from "react-router";
import mixin from "reactjs-mixin";
import { StoreMixin } from "mesosphere-shared-reactjs";
import Task from "../../structs/Task";
import ConsoleStore from "../../stores/ConsoleStore";
import ConsoleActions from "../../events/ConsoleActions";

const METHODS_TO_BIND = [
  "listFiles",
  "catFile",
  "showHelp",
  "handleInput",
  "clearInput",
  "addHistory",
  "handleClick",
  "clearHistory"
];

class TaskConsoleTab extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);
    this.state = {
      commands: {},
      history: [],
      prompt: "$ "
    };

    METHODS_TO_BIND.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  componentWillMount() {
    super.componentWillMount();

    const { task } = this.props;
    console.log(task);
    ConsoleStore.connectConsole(task);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
  }

  clearHistory() {
    this.setState({ history: [] });
  }

  registerCommands() {
    this.setState({
      commands: {
        clear: this.clearHistory,
        ls: this.listFiles,
        intro: this.showWelcomeMsg,
        help: this.showHelp,
        cat: this.catFile,
        source: this.openLink(
          "https://github.com/prakhar1989/react-term/blob/master/src/app.js"
        ),
        github: this.openLink("http://github.com/prakhar1989"),
        blog: this.openLink("http://prakhar.me"),
        resume: this.openLink(
          "https://github.com/prakhar1989/cv/blob/master/Resume.pdf"
        )
      }
    });
  }

  listFiles() {
    this.addHistory("README.md");
  }

  showWelcomeMsg() {
    this.addHistory(
      "Hello, I'm Prakhar Srivastav, a graduate student in the Computer Science department (Machine Learning track)."
    );
    this.addHistory("Type `help` to see what all commands are available");
  }

  catFile(arg) {
    if (arg === "README.md") {
      this.addHistory("### REACT TERM");
      this.addHistory(
        "A couple of days back, I got an email from Columbia (the university that I'm stated to join) informing me that my new email ID and other student IT services were ready. Hosting my own webpage on a university's domain had long been a wish of mine, so as soon as I learnt about having some server space on the university's server I got excited wanted to put something interesting. Since I already have " +
          "a boring about me page, I went " +
          "with something different and built a simple terminal emulator in React!"
      );
      this.addHistory("type `source` to view the source code");
    } else {
      this.addHistory("cat: " + arg + ": No such file or directory");
    }
  }
  openLink(link) {
    return function() {
      window.open(link, "_blank");
    };
  }

  showHelp() {
    this.addHistory("help - this help text");
    this.addHistory("github - view my github profile");
    this.addHistory("source - browse the code for this page");
    this.addHistory("intro - print intro message");
    this.addHistory("blog - read some stuff that I've written");
    this.addHistory("clear - clear screen");
    this.addHistory("cat - print contents of a file");
    this.addHistory("ls - list files");
    this.addHistory("resume - view my resume");
  }

  componentDidMount() {
    this.registerCommands();
    this.showWelcomeMsg();
    this.refs.term.focus();
  }

  // componentDidUpdate() {
  //     var el = React.findDOMNode(this);
  //     //var container = document.getElementsByClassName("container")[0];
  //     // var container = document.getElementById("main");
  //     container.scrollTop = el.scrollHeight;
  // }

  handleInput(e) {
    // console.log(e.key);
    // if (e.key === "Enter") {
      var input_text = e.key;
      // var input_array = input_text.split(" ");
      // var input = input_array[0];
      // var arg = input_array[1];
      // var command = this.state.commands[input];

      // this.addHistory(this.state.prompt + " " + input_text);

      // if (command === undefined) {
      //   this.addHistory("sh: command not found: " + input);
      // } else {
      //   command(arg);
      // }
      ConsoleActions.consoleMessage(input_text);
      // this.clearInput();
    
  }

  clearInput() {
    this.term.value = "";
  }

  addHistory(output) {
    var history = this.state.history;
    history.push(output);
    this.setState({ history });
  }

  handleClick() {
    // console.log(this)
    this.refs.term.focus();
  }

  render() {

    var output = this.state.history.map(function(op, i) {
      return <p key={i}>{op}</p>;
    });

    return (
      <div className="input-area iframe-page-container" onClick={this.handleClick.bind(this)}>
        {output}
        <p>
          <span className="prompt">{this.state.prompt}</span>
          <input type="text" onKeyDown={this.handleInput.bind(this)} ref="term"/>
        </p>
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
