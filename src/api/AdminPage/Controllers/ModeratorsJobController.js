"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { AdminPageUser, ProductModerationLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/moderators-jobs Admin page get moderators job count
 * @apiVersion 2.0.10
 * @apiName Admin page get moderators job count
 * @apiGroup WebAPI Admin page
 * @apiDescription API used for getting the job count (product moderation logs count) for each admin page user. API returns total job count,
 * count for the requested period and count of approved, rejected and products that need approval. Admin role needed for access.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) [adminUsername] Username of the admin page user
 * @apiParam (Query string) [startTimestamp] Start time for the count. Defaults to the oldest timestamp
 * @apiParam (Query string) [endTimestamp] End time for the count. Defaults to the current time
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1640008101292,
 *   "data": {
 *     "moderatorsJobs": [
 *       {
 *         "adminUserId": "617170858b9cdf218bae6859",
 *         "adminUsername": "markoR_admin",
 *         "total": 8,
 *         "countForPeriod": 4,
 *         "rejected": 2,
 *         "approved": 2,
 *         "approvalNeeded": 0
 *       },
 *       {
 *         "adminUserId": "6103c68fd649dd136f5fc8fa",
 *         "adminUsername": "mdragic",
 *         "total": 6,
 *         "countForPeriod": 6,
 *         "rejected": 2,
 *         "approved": 3,
 *         "approvalNeeded": 1
 *       }
 *     ]
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { adminUsername } = request.query;
    const startTimestamp = +request.query.startTimestamp || 0;
    const endTimestamp = +request.query.endTimestamp || Date.now();

    const matchQuery = {
      $and: [{ created: { $gte: startTimestamp } }, { created: { $lte: endTimestamp } }],
    };

    if (adminUsername) {
      matchQuery["$and"].push({ adminUsername });
    }

    let totalsObj = {};
    let totalsExists = false;
    if (!!request.query.startTimestamp || !!request.query.endTimestamp) {
      const allJobsGrouped = await ProductModerationLog.aggregate([
        { $match: adminUsername ? { adminUsername } : {} },
        { $group: { _id: "$adminUserId", total: { $sum: 1 } } },
      ]);

      allJobsGrouped.forEach((jobs) => (totalsObj[jobs._id] = jobs.total));
      totalsExists = true;
    }

    const jobsForPeriod = await ProductModerationLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$adminUserId",
          countForPeriod: { $sum: 1 },
          newStatuses: { $push: "$newProductStatus" },
        },
      },
    ]);

    const adminUsers = await AdminPageUser.find(
      { _id: { $in: jobsForPeriod.map((job) => job._id) } },
      { username: 1 },
    ).lean();
    const adminUsersObj = {};
    adminUsers.forEach((user) => {
      adminUsersObj[user._id.toString()] = user.username;
    });

    const jobsFormatted = jobsForPeriod.map((jobs) => {
      const { _id: adminUserId, countForPeriod, newStatuses } = jobs;
      const statusesCount = { 2: 0, 3: 0, 4: 0 };

      newStatuses.forEach((status) => {
        statusesCount[status] += 1;
      });

      const rejected = statusesCount[Const.moderationStatusRejected];
      const approved = statusesCount[Const.moderationStatusApproved];
      const approvalNeeded = statusesCount[Const.moderationStatusApprovalNeeded];

      const total = totalsExists ? totalsObj[adminUserId] : countForPeriod;
      return {
        adminUserId,
        adminUsername: adminUsersObj[adminUserId],
        total,
        countForPeriod,
        rejected,
        approved,
        approvalNeeded,
      };
    });

    Base.successResponse(response, Const.responsecodeSucceed, { moderatorsJobs: jobsFormatted });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ModeratorsJobController",
      error,
    });
  }
});

module.exports = router;
