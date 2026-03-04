"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { PaymentLog } = require("#models");

/**
 * @api {get} /api/v2/admin-page/payment-logs Admin page payment logs list
 * @apiVersion 2.0.10
 * @apiName Admin page payment logs list
 * @apiGroup WebAPI Admin page
 * @apiDescription API used for getting the list of payment moderation logs. Admin role needed for access.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) [productName] Name of the product to
 * @apiParam (Query string) [dataType] Type of the product (1 - tax, 2 - fee, 3 - payout)
 * @apiParam (Query string) [adminUsername] Username of the admin page user
 * @apiParam (Query string) [page] Page number. Default 1
 * @apiParam (Query string) [itemsPerPage] Number of results per page. Default 10
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639659646918,
 *   "data": {
 *     "paymentLogs": [
 *       {
 *         "id": "61bb36fa0c7926e3a88af114",
 *         "created": 1639659258081,
 *         "productId": "61a79a2512042d28af4def8f",
 *         "productName": "guhju",
 *         "productType": 4,
 *         "oldProductStatus": 1,
 *         "newProductStatus": 2,
 *         "newProductComment": "NO!",
 *         "adminUserId": "6103c68fd649dd136f5fc8fa",
 *         "adminUsername": "mdragic"
 *       }
 *     ],
 *     "pagination": {
 *       "total": 1,
 *       "itemsPerPage": 10
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443226 Invalid type parameter (has to be between 1 and 5)
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.get("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { adminUsername, startDate, endDate } = request.query;
    const logType = +request.query.logType;
    const page = +request.query.page || 1;
    const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

    const searchQuery = {};

    if (adminUsername) {
      searchQuery.adminUsername = adminUsername;
    }

    if (logType) {
      searchQuery.type = logType;
    }

    if (startDate || endDate) {
      let startDateMillis = new Date(startDate).getTime() || 0;
      let endDateMillis = new Date(endDate).getTime() || new Date().getTime();
      console.log("startDateMillis endDateMillis ", startDateMillis, endDateMillis);
      searchQuery.created = { $gte: startDateMillis, $lte: endDateMillis };
    }

    const paymentLogs = await PaymentLog.find(searchQuery)
      .limit(itemsPerPage)
      .skip((page - 1) * itemsPerPage)
      .sort({ created: -1 })
      .lean();

    const paymentLogsFormatted = paymentLogs.map((log) => {
      const { _id: id, __v, ...rest } = log;
      return { id, ...rest };
    });

    const total = await PaymentLog.countDocuments(searchQuery);

    Base.successResponse(response, Const.responsecodeSucceed, {
      paymentLogs: paymentLogsFormatted,
      pagination: { total, itemsPerPage },
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "PaymentLogController",
      error,
    });
  }
});

module.exports = router;
