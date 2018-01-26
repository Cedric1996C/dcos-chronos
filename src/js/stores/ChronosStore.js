import { EventEmitter } from "events";
import PluginSDK from "PluginSDK";

import {
  REQUEST_CHRONOS_JOB_CREATE_ERROR,
  REQUEST_CHRONOS_JOB_CREATE_SUCCESS,
  REQUEST_CHRONOS_JOB_DELETE_ERROR,
  REQUEST_CHRONOS_JOB_DELETE_SUCCESS,
  REQUEST_CHRONOS_JOB_DETAIL_ERROR,
  REQUEST_CHRONOS_JOB_DETAIL_ONGOING,
  REQUEST_CHRONOS_JOB_DETAIL_SUCCESS,
  REQUEST_CHRONOS_JOB_RUN_ERROR,
  REQUEST_CHRONOS_JOB_RUN_SUCCESS,
  REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_ERROR,
  REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_SUCCESS,
  REQUEST_CHRONOS_JOB_STOP_RUN_ERROR,
  REQUEST_CHRONOS_JOB_STOP_RUN_SUCCESS,
  REQUEST_CHRONOS_JOB_UPDATE_ERROR,
  REQUEST_CHRONOS_JOB_UPDATE_SUCCESS,
  REQUEST_CHRONOS_JOBS_ERROR,
  REQUEST_CHRONOS_JOBS_ONGOING,
  REQUEST_CHRONOS_JOBS_SUCCESS,
  SERVER_ACTION
} from "../constants/ActionTypes";
import AppDispatcher from "../events/AppDispatcher";
import {
  CHRONOS_JOB_CREATE_ERROR,
  CHRONOS_JOB_CREATE_SUCCESS,
  CHRONOS_JOB_DELETE_ERROR,
  CHRONOS_JOB_DELETE_SUCCESS,
  CHRONOS_JOB_DETAIL_CHANGE,
  CHRONOS_JOB_DETAIL_ERROR,
  CHRONOS_JOB_RUN_ERROR,
  CHRONOS_JOB_RUN_SUCCESS,
  CHRONOS_JOB_SCHEDULE_UPDATE_ERROR,
  CHRONOS_JOB_SCHEDULE_UPDATE_SUCCESS,
  CHRONOS_JOB_STOP_RUN_ERROR,
  CHRONOS_JOB_STOP_RUN_SUCCESS,
  CHRONOS_JOB_UPDATE_ERROR,
  CHRONOS_JOB_UPDATE_SUCCESS,
  CHRONOS_JOBS_CHANGE,
  CHRONOS_JOBS_ERROR,
  VISIBILITY_CHANGE
} from "../constants/EventTypes";
import Config from "../config/Config";
import ChronosActions from "../events/ChronosActions";
import Job from "../structs/Job";
import JobTree from "../structs/JobTree";
import VisibilityStore from "./VisibilityStore";

let requestInterval;
const jobDetailFetchTimers = {};

function pauseJobDetailMonitors() {
  Object.keys(jobDetailFetchTimers).forEach(function(jobID) {
    global.clearInterval(jobDetailFetchTimers[jobID]);
    jobDetailFetchTimers[jobID] = null;
  });
}

function startPolling() {
  if (!requestInterval) {
    ChronosActions.fetchJobs();
    requestInterval = global.setInterval(
      ChronosActions.fetchJobs,
      Config.getRefreshRate()
    );
  }
}

function stopPolling() {
  if (requestInterval) {
    global.clearInterval(requestInterval);
    requestInterval = null;
  }
}

class ChronosStore extends EventEmitter {
  constructor() {
    super(...arguments);

    this.data = {
      jobDetail: {},
      jobTree: { id: "/", items: [] }
    };

    PluginSDK.addStoreConfig({
      store: this,
      storeID: this.storeID,
      events: {
        jobCreateSuccess: CHRONOS_JOB_CREATE_SUCCESS,
        jobCreateError: CHRONOS_JOB_CREATE_ERROR,
        jobDeleteSuccess: CHRONOS_JOB_DELETE_SUCCESS,
        jobDeleteError: CHRONOS_JOB_DELETE_ERROR,
        jobDetailChange: CHRONOS_JOB_DETAIL_CHANGE,
        jobDetailError: CHRONOS_JOB_DETAIL_ERROR,
        jobUpdateSuccess: CHRONOS_JOB_UPDATE_SUCCESS,
        jobUpdateError: CHRONOS_JOB_UPDATE_ERROR,
        jobRunError: CHRONOS_JOB_RUN_ERROR,
        jobRunSuccess: CHRONOS_JOB_RUN_SUCCESS,
        jobStopRunError: CHRONOS_JOB_STOP_RUN_ERROR,
        jobStopRunSuccess: CHRONOS_JOB_STOP_RUN_SUCCESS,
        jobScheduleUpdateError: CHRONOS_JOB_SCHEDULE_UPDATE_ERROR,
        jobScheduleUpdateSuccess: CHRONOS_JOB_SCHEDULE_UPDATE_SUCCESS,
        change: CHRONOS_JOBS_CHANGE,
        error: CHRONOS_JOBS_ERROR
      },
      unmountWhen() {
        return true;
      },
      listenAlways: true
    });

    // Handle app actions
    this.dispatcherIndex = AppDispatcher.register(({ source, action }) => {
      if (source !== SERVER_ACTION) {
        return false;
      }
      switch (action.type) {
        case REQUEST_CHRONOS_JOB_CREATE_SUCCESS:
          this.emit(CHRONOS_JOB_CREATE_SUCCESS);
          break;
        case REQUEST_CHRONOS_JOB_CREATE_ERROR:
          this.emit(CHRONOS_JOB_CREATE_ERROR, action.data);
          break;
        case REQUEST_CHRONOS_JOB_DELETE_ERROR:
          this.emit(CHRONOS_JOB_DELETE_ERROR, action.jobID, action.data);
          break;
        case REQUEST_CHRONOS_JOB_DELETE_SUCCESS:
          this.emit(CHRONOS_JOB_DELETE_SUCCESS, action.jobID);
          break;
        case REQUEST_CHRONOS_JOB_DETAIL_SUCCESS:
          this.data.jobDetail[action.jobID] = action.data;
          this.emit(CHRONOS_JOB_DETAIL_CHANGE);
          break;
        case REQUEST_CHRONOS_JOB_DETAIL_ONGOING:
          break;
        case REQUEST_CHRONOS_JOB_DETAIL_ERROR:
          this.emit(CHRONOS_JOB_DETAIL_ERROR);
          break;
        case REQUEST_CHRONOS_JOB_UPDATE_SUCCESS:
          this.emit(CHRONOS_JOB_UPDATE_SUCCESS);
          break;
        case REQUEST_CHRONOS_JOB_UPDATE_ERROR:
          this.emit(CHRONOS_JOB_UPDATE_ERROR, action.data);
          break;
        case REQUEST_CHRONOS_JOB_RUN_ERROR:
          this.emit(CHRONOS_JOB_RUN_ERROR, action.jobID);
          break;
        case REQUEST_CHRONOS_JOB_RUN_SUCCESS:
          this.emit(CHRONOS_JOB_RUN_SUCCESS, action.jobID);
          break;
        case REQUEST_CHRONOS_JOB_STOP_RUN_ERROR:
          this.emit(CHRONOS_JOB_STOP_RUN_ERROR, action.jobID);
          break;
        case REQUEST_CHRONOS_JOB_STOP_RUN_SUCCESS:
          this.emit(CHRONOS_JOB_STOP_RUN_SUCCESS, action.jobID);
          break;
        case REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_ERROR:
          this.emit(CHRONOS_JOB_SCHEDULE_UPDATE_ERROR, action.jobID);
          break;
        case REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_SUCCESS:
          this.emit(CHRONOS_JOB_SCHEDULE_UPDATE_SUCCESS, action.jobID);
          break;
        case REQUEST_CHRONOS_JOBS_SUCCESS:
          this.data.jobTree = action.data;
          this.emit(CHRONOS_JOBS_CHANGE);
          break;
        case REQUEST_CHRONOS_JOBS_ONGOING:
          break;
        case REQUEST_CHRONOS_JOBS_ERROR:
          this.emit(CHRONOS_JOBS_ERROR);
          break;
      }

      return true;
    });

    VisibilityStore.addChangeListener(
      VISIBILITY_CHANGE,
      this.onVisibilityStoreChange.bind(this)
    );
  }

  createJob(job) {
    ChronosActions.createJob(job);
  }

  deleteJob(jobID, stopCurrentJobRuns) {
    ChronosActions.deleteJob(jobID, stopCurrentJobRuns);
  }

  fetchJobDetail(jobID) {
    ChronosActions.fetchJobDetail(jobID);
  }

  updateJob(jobId, job) {
    ChronosActions.updateJob(jobId, job);
  }

  runJob(jobID) {
    ChronosActions.runJob(jobID);
  }

  stopJobRun(jobID, jobRunID) {
    const job = this.getJob(jobID);

    if (job == null || jobRunID == null) {
      return;
    }

    ChronosActions.stopJobRun(jobID, jobRunID);
  }

  toggleSchedule(jobID, isEnabled = true) {
    const job = this.getJob(jobID);

    if (job == null) {
      return null;
    }

    const [schedule] = job.getSchedules();

    if (schedule == null) {
      return null;
    }

    this.updateSchedule(
      jobID,
      Object.assign({}, schedule, { enabled: isEnabled })
    );
  }

  updateSchedule(jobID, schedule) {
    if (schedule == null) {
      return;
    }

    ChronosActions.updateSchedule(jobID, schedule);
  }

  addChangeListener(eventName, callback) {
    this.on(eventName, callback);

    // Start polling if there is at least one listener
    if (this.shouldPoll()) {
      startPolling();
    }
  }

  removeChangeListener(eventName, callback) {
    this.removeListener(eventName, callback);

    // Stop polling if no one is listening
    if (!this.shouldPoll()) {
      stopPolling();
    }
  }

  getJob(jobID) {
    if (this.data.jobDetail[jobID] == null) {
      return null;
    }

    return new Job(this.data.jobDetail[jobID]);
  }

  monitorJobDetail(jobID) {
    if (jobDetailFetchTimers[jobID] != null || jobID == null) {
      // Already monitoring
      return;
    }

    if (!VisibilityStore.isInactive()) {
      this.fetchJobDetail(jobID);

      jobDetailFetchTimers[jobID] = global.setInterval(
        this.fetchJobDetail.bind(this, jobID),
        Config.getRefreshRate()
      );
    }
  }

  onVisibilityStoreChange() {
    if (!VisibilityStore.isInactive()) {
      Object.keys(jobDetailFetchTimers).forEach(jobID => {
        this.monitorJobDetail(jobID);
      });

      if (this.shouldPoll()) {
        startPolling();

        return;
      }
    }

    pauseJobDetailMonitors();
    stopPolling();
  }

  shouldPoll() {
    return this.listeners(CHRONOS_JOBS_CHANGE).length > 0;
  }

  stopJobDetailMonitor(jobID) {
    if (jobID != null) {
      global.clearInterval(jobDetailFetchTimers[jobID]);
      delete jobDetailFetchTimers[jobID];

      return;
    }

    Object.keys(jobDetailFetchTimers).forEach(function(fetchTimerID) {
      global.clearInterval(jobDetailFetchTimers[fetchTimerID]);
      delete jobDetailFetchTimers[fetchTimerID];
    });
  }

  /**
   * @type {JobTree}
   */
  get jobTree() {
    return new JobTree(this.data.jobTree);
  }

  get storeID() {
    return "CHRONOS";
  }
}

module.exports = new ChronosStore();
