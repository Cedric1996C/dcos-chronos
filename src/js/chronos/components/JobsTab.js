import mixin from "reactjs-mixin";
import React from "react";
import { routerShape } from "react-router";

import { StoreMixin } from "mesosphere-shared-reactjs";
import DCOSStore from "#SRC/js/stores/DCOSStore";

import AlertPanel from "../../components/AlertPanel";
import AlertPanelHeader from "../../components/AlertPanelHeader";
import FilterBar from "../../components/FilterBar";
import FilterHeadline from "../../components/FilterHeadline";
import JobsBreadcrumbs from "../../components/breadcrumbs/JobsBreadcrumbs";
import JobsTable from "./JobsTable";
import JobSearchFilter from "../../components/JobSearchFilter";
import JobFilterTypes from "../../constants/JobFilterTypes";
import JobFormModal from "../../components/modals/JobFormModal";
import JobTree from "../../structs/JobTree";
import Loader from "../../components/Loader";
import Page from "../../components/Page";
import ServiceFilterTypes
  from "../../../../plugins/services/src/js/constants/ServiceFilterTypes";

import JobAddBtn from "../../components/jobs/JodAddBtn";
import JobStateFilter from "../../components/jobs/JobStateFilter";
import ChronosJobModal from "../ChronosJobModal";

const METHODS_TO_BIND = [
  "getHeadline",
  "handleFilterChange",
  "resetFilter",
  "resetFilterQueryParams",
  "handleCloseJobModal",
  "handleOpenJobModal"
];

var DEFAULT_FILTER_OPTIONS = {
  searchString: ""
};

class JobsTab extends mixin(StoreMixin) {
  constructor() {
    super(...arguments);

    this.state = Object.assign(
      {
        isJobModalOpen: false
      },
      DEFAULT_FILTER_OPTIONS
    );

    this.store_listeners = [
      { name: "dcos", events: ["change"], suppressUpdate: false },
      {
        name: "chronos",
        events: ["change", "jobCreateSuccess"],
        suppressUpdate: false
      }
    ];

    METHODS_TO_BIND.forEach(method => {
      this[method] = this[method].bind(this);
    });
  }

  componentDidMount() {
    super.componentDidMount();
    this.updateFromProps(this.props);
  }

  componentWillReceiveProps(nextProps) {
    super.componentWillReceiveProps(...arguments);
    this.updateFromProps(nextProps);
  }

  // Chronos Job Adding
  handleCloseJobModal() {
    this.setState({ isJobModalOpen: false });
  }

  handleOpenJobModal() {
    this.setState({ isJobModalOpen: true });
  }

  handleFilterChange(filterValue) {
    const { router } = this.context;
    const { location: { pathname } } = this.props;
    const query = { [JobFilterTypes.TEXT]: filterValue };

    router.push({ pathname, query });

    this.setState({
      searchString: filterValue
    });
  }

  resetFilterQueryParams() {
    const { location: { pathname } } = this.props;
    const query = Object.assign({}, location.query);

    Object.values(ServiceFilterTypes).forEach(function (filterKey) {
      delete query[filterKey];
    });

    this.context.router.push({ pathname, query });
  }

  resetFilter() {
    var state = Object.assign({}, this.state, DEFAULT_FILTER_OPTIONS);
    this.setState(state, this.resetFilterQueryParams);
  }

  updateFromProps(props) {
    const { location = { query: {} } } = props;

    if (location.query[JobFilterTypes.TEXT] != null) {
      const state = {};

      state[JobFilterTypes.TEXT] = location.query[JobFilterTypes.TEXT];
      this.setState(state);
    }
  }

  getHeadline(item, filteredJobs) {
    const { state } = this;
    const jobs = item.getItems();

    const hasFiltersApplied = Object.keys(
      DEFAULT_FILTER_OPTIONS
    ).some(filterKey => {
      return state[filterKey] != null && state[filterKey].length > 0;
    });

    if (hasFiltersApplied) {
      return (
        <FilterHeadline
          onReset={this.resetFilter}
          name="Jobs"
          currentLength={filteredJobs.length}
          totalLength={jobs.length}
        />
      );
    }
  }

  getFilteredJobs(item) {
    const { searchString } = this.state;
    let jobs = item.getItems();
    console.log("getfilterjobs: ", jobs);

    if (searchString) {
      const filterProperties = Object.assign({}, item.getFilterProperties(), {
        name(item) {
          return item.getId();
        }
      });

      jobs = item.filterItemsByText(searchString, filterProperties).getItems();
      console.log("isSearching: ", searchString, jobs);
    }

    return jobs;
  }

  getJobTreeView(item, modal) {
    const filteredJobs = this.getFilteredJobs(item);
    console.log("filterJobs: ", filteredJobs);

    return (
      <Page>
        <Page.Header
          breadcrumbs={<JobsBreadcrumbs jobID={item.id} />}
        />
        <div className="flex-grow">
          {this.getHeadline(item, filteredJobs)}
          <FilterBar>
            <JobAddBtn onClick={this.handleOpenJobModal} />
            <JobStateFilter />
            <JobSearchFilter
              onChange={this.handleFilterChange}
              value={this.state.searchString}
            />
          </FilterBar>
          <JobsTable jobs={filteredJobs} />
        </div>
        {modal}
      </Page>
    );
  }

  getAlertPanelFooter() {
    return (
      <div className="button-collection flush-bottom">
        <button
          className="button button-success"
          onClick={this.handleOpenJobFormModal}
        >
          Create a Job
        </button>
      </div>
    );
  }

  getContents(item, modal) {
    // Render loading screen
    if (!DCOSStore.jobDataReceived) {
      return (
        <Page>
          <Page.Header breadcrumbs={<JobsBreadcrumbs />} />
          <Loader />
        </Page>
      );
    }

    if (item instanceof JobTree && item.getItems().length > 0) {
      return this.getJobTreeView(item, modal);
    }

    console.log("item.getItems().length == 0");

    // JobDetailPage
    if (this.props.params.id) {
      return this.props.children;
    }

    // Render empty panel
    return (
      <Page>
        <Page.Header breadcrumbs={<JobsBreadcrumbs />} />
        <AlertPanel>
          <AlertPanelHeader>No active jobs</AlertPanelHeader>
          <p className="tall">
            Create both one-off or scheduled jobs to perform tasks at a predefined interval.
          </p>
          {this.getAlertPanelFooter()}
        </AlertPanel>
        {modal}
      </Page>
    );
  }

  render() {
    let { id } = this.props.params;
    id = decodeURIComponent(id);

    // Find item in root tree and default to root tree if there is no match
    const item = DCOSStore.jobTree.findItemById(id) || DCOSStore.jobTree;
    const chronosItem = DCOSStore.chronosJobTree.findItemById(id) || DCOSStore.chronosJobTree;
    console.log("chronosItem: ", chronosItem);
    const modal = (
      <div>
        <ChronosJobModal
          open={this.state.isJobModalOpen}
          onClose={this.handleCloseJobModal}
        />
      </div>
    );

    return this.getContents(chronosItem, modal);
  }
}

JobsTab.contextTypes = {
  router: routerShape,
  location: React.PropTypes.object.isRequired
};

module.exports = JobsTab;
