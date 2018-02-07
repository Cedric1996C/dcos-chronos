import { Form } from "reactjs-components";
import React, { Component } from "react";

import ChronosJob from "./ChronosJob";
import SchemaFormUtil from "../utils/SchemaFormUtil";
import SchemaUtil from "../utils/SchemaUtil";

class ChronosJobForm extends Component {
  getChronosJob() {
    return ChronosJob;
  }

  getNewDefinition(model = this.props.model) {
    const schema = this.getChronosJob();
    const definition = SchemaUtil.schemaToMultipleDefinition({
      schema,
      renderSubheader: this.getSubHeader,
      renderLabel: this.getLabel,
      renderRemove: this.getRemoveRowButton,
      renderAdd: this.getAddNewRowButton
    });

    if (model) {
      SchemaFormUtil.mergeModelIntoDefinition(
        model,
        definition,
        this.getRemoveRowButton
      );
    }
    const newDefinition = definition.general.definition;
    newDefinition.splice(3, 0, this.getDockerImageSelector());

    return newDefinition;
  }

  getDockerImageSelector() {
    return {
      fieldType: "select",
      label: "DockerImage",
      showLabel: true,
      options: [
        {
          html: "Senior",
          id: "Senior"
        },
        {
          html: "Junior",
          id: "junior"
        }
      ],
      value: "junior",
      name: "dockerImage",
      validation: value => !!value,
      validationErrorText: "One option has to be selected"
    };
  }

  render() {
    return (
      <Form
        className="form flush-bottom"
        definition={this.getNewDefinition()}
      />
    );
  }
}

module.exports = ChronosJobForm;
