import { RequestUtil } from "mesosphere-shared-reactjs";

import {
  REQUEST_CHRONOS_JOB_DELETE_ERROR,
  REQUEST_CHRONOS_JOB_DELETE_SUCCESS,
  REQUEST_CHRONOS_JOB_UPDATE_ERROR,
  REQUEST_CHRONOS_JOB_UPDATE_SUCCESS,
  REQUEST_CHRONOS_JOB_RUN_ERROR,
  REQUEST_CHRONOS_JOB_RUN_SUCCESS,
  REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_ERROR,
  REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_SUCCESS,
  REQUEST_CHRONOS_JOB_DETAIL_ERROR,
  REQUEST_CHRONOS_JOB_DETAIL_ONGOING,
  REQUEST_CHRONOS_JOB_DETAIL_SUCCESS,
  REQUEST_CHRONOS_JOBS_ERROR,
  REQUEST_CHRONOS_JOBS_ONGOING,
  REQUEST_CHRONOS_JOBS_SUCCESS,
  REQUEST_CHRONOS_JOB_CREATE_SUCCESS,
  REQUEST_CHRONOS_JOB_CREATE_ERROR,
  REQUEST_CHRONOS_JOB_STOP_RUN_SUCCESS,
  REQUEST_CHRONOS_JOB_STOP_RUN_ERROR
} from "../constants/ActionTypes";
import AppDispatcher from "./AppDispatcher";
import ChronosUtil from "../utils/ChronosUtil";
import Config from "../config/Config";

const ChronosActions = {
  createJob(data) {
    RequestUtil.json({
      url: `${Config.CHRONOSAPI}/v0/scheduled-jobs`,
      method: "POST",
      data,
      success() {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_CREATE_SUCCESS
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_CREATE_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          xhr
        });
      }
    });
  },

  fetchJobs: RequestUtil.debounceOnError(
    Config.getRefreshRate(),
    function(resolve, reject) {
      return function() {
        RequestUtil.json({
          url: `${Config.CHRONOSAPI}/v1/jobs`,
          data: [
            { name: "embed", value: "activeRuns" },
            { name: "embed", value: "schedules" },
            { name: "embed", value: "historySummary" }
          ],
          success(response) {
            try {
              const data = ChronosUtil.parseJobs(response);
              AppDispatcher.handleServerAction({
                type: REQUEST_CHRONOS_JOBS_SUCCESS,
                data
              });
              resolve();
            } catch (error) {
              AppDispatcher.handleServerAction({
                type: REQUEST_CHRONOS_JOBS_ERROR,
                data: error
              });
              reject();
            }
          },
          error(xhr) {
            AppDispatcher.handleServerAction({
              type: REQUEST_CHRONOS_JOBS_ERROR,
              data: xhr.message,
              xhr
            });
            reject();
          },
          hangingRequestCallback() {
            AppDispatcher.handleServerAction({
              type: REQUEST_CHRONOS_JOBS_ONGOING
            });
          }
        });
      };
    },
    { delayAfterCount: Config.delayAfterErrorCount }
  ),

  fetchJobDetail(jobID) {
    RequestUtil.json({
      url: `${Config.CHRONOSAPI}/v1/jobs/${jobID}`,
      data: [
        { name: "embed", value: "activeRuns" },
        { name: "embed", value: "history" },
        { name: "embed", value: "schedules" }
      ],
      success(response) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_DETAIL_SUCCESS,
          data: ChronosUtil.parseJob(response),
          jobID
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_DETAIL_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          jobID,
          xhr
        });
      },
      hangingRequestCallback() {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_DETAIL_ONGOING,
          jobID
        });
      }
    });
  },

  deleteJob(jobID, stopCurrentJobRuns = false) {
    RequestUtil.json({
      url: `${Config.CHRONOSAPI}/v1/jobs/${jobID}` +
        `?stopCurrentJobRuns=${stopCurrentJobRuns}`,
      method: "DELETE",
      success() {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_DELETE_SUCCESS,
          jobID
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_DELETE_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          jobID,
          xhr
        });
      }
    });
  },

  updateJob(jobID, data) {
    RequestUtil.json({
      url: `${Config.CHRONOSAPI}/v0/scheduled-jobs/${jobID}`,
      method: "PUT",
      data,
      success() {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_UPDATE_SUCCESS
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_UPDATE_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          xhr
        });
      }
    });
  },

  runJob(jobID) {
    RequestUtil.json({
      url: `${Config.CHRONOSAPI}/v1/jobs/${jobID}/runs`,
      method: "POST",
      data: {},
      success() {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_RUN_SUCCESS
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_RUN_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          xhr
        });
      }
    });
  },

  stopJobRun(jobID, jobRunID) {
    const url =
      `${Config.CHRONOSAPI}/v1/jobs/${jobID}` +
      `/runs/${jobRunID}/actions/stop`;

    RequestUtil.json({
      url,
      method: "POST",
      data: {},
      success() {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_STOP_RUN_SUCCESS
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_STOP_RUN_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          xhr
        });
      }
    });
  },

  updateSchedule(jobID, data) {
    RequestUtil.json({
      url: `${Config.CHRONOSAPI}/v1/jobs/${jobID}/schedules/${data.id}`,
      method: "PUT",
      data,
      success() {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_SUCCESS,
          jobID
        });
      },
      error(xhr) {
        AppDispatcher.handleServerAction({
          type: REQUEST_CHRONOS_JOB_SCHEDULE_UPDATE_ERROR,
          data: RequestUtil.parseResponseBody(xhr),
          jobID,
          xhr
        });
      }
    });
  }
};

if (Config.useFixtures) {
  const jobFixture = require("../../../tests/_fixtures/chronos/job.json");
  const jobsFixture = require("../../../tests/_fixtures/chronos/jobs.json");

  if (!global.actionTypes) {
    global.actionTypes = {};
  }

  global.actionTypes.ChronosActions = {
    deleteJob: {
      event: "success",
      success: { response: {} }
    },
    fetchJobDetail: {
      event: "success",
      success: { response: jobFixture }
    },
    fetchJobs: {
      event: "success",
      success: { response: jobsFixture }
    },
    runJob: {
      event: "success",
      success: { response: {} }
    },
    stopJobRun: {
      event: "success",
      success: { response: {} }
    },
    updateSchedule: {
      event: "success",
      success: { response: {} }
    }
  };

  Object.keys(global.actionTypes.ChronosActions).forEach(function(method) {
    ChronosActions[method] = RequestUtil.stubRequest(
      ChronosActions,
      "ChronosActions",
      method
    );
  });
}

module.exports = ChronosActions;
