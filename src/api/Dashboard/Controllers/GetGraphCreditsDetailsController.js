"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const { auth } = require("#middleware");
const { User, Transfer } = require("#models");

/**
 * @api {get} api/v2/dashboard/graph/credits Dashboard - Credits graph data
 * @apiVersion 0.0.1
 * @apiName Dashboard - Credits graph data
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to fetch data for dashboard credits graph.
 *
 * @apiParam  {String} startDate Starting date
 * @apiParam  {String} endDate Ending date
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1659358705124,
 *     "data": {
 *         "content": [
 *             {
 *                 "startDate": 1643116117945,
 *                 "endDate": 1643640010799,
 *                 "creditsAmount": 0,
 *             },
 *             {
 *                 "startDate": 1643640010799,
 *                 "endDate": 1644163903653,
 *                 "creditsAmount": 0,
 *             },
 *         ],
 *         "other": [
 *             {
 *                 "startDate": 1643116117945,
 *                 "endDate": 1643640010799,
 *                 "creditsAmount": 50,
 *             },
 *             {
 *                 "startDate": 1643640010799,
 *                 "endDate": 1644163903653,
 *                 "creditsAmount": 5,
 *             }
 *         ]
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const user = request.user;

    var types = request.query.types;
    let startDate = request.query.startDate;
    const endDate = request.query.endDate;

    const ONE_HOUR = 3600000;
    const ONE_DAY = 86400000;
    const ONE_WEEK = 604800000;
    const ONE_MONTH = 2678400000; // 31 days
    const ONE_YEAR = 31556926000;

    if (!startDate) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoStartDate,
        message: "GetGraphDetailsController, no start date parameter",
      });
    }

    if (!endDate) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoEndDate,
        message: "GetGraphDetailsController, no end date parameter",
      });
    }

    startDate = startDate === "0" ? user.created : startDate;

    //other
    const other = await Transfer.aggregate([
      {
        $match: {
          transferType: { $in: [Const.transferTypeSuperBless, Const.transferTypeCredits] },
          receiverPhoneNumber: user.phoneNumber,
          productId: { $exists: false },
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: Const.paymentMethodTypeCreditBalance,
        },
      },
      {
        $group: {
          _id: null,
          transferArray: {
            $push: "$$ROOT",
          },
        },
      },
    ]);

    //content
    const content = await Transfer.aggregate([
      {
        $match: {
          transferType: {
            $in: [
              Const.transferTypeSuperBless,
              Const.transferTypeSprayBless,
              Const.transferTypeCredits,
            ],
          },
          receiverPhoneNumber: user.phoneNumber,
          productId: { $exists: true },
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: Const.paymentMethodTypeCreditBalance,
        },
      },
      {
        $group: {
          _id: null,
          transferArray: {
            $push: "$$ROOT",
          },
        },
      },
    ]);

    const transfers = { other, content };

    var arrayOfGroups = [];
    var custom = false;

    const endStart = endDate - startDate;

    for (const array in transfers) {
      //  2011-10-05T14:48:00.000Z
      const groups = transfers[array][0]?.transferArray.reduce((groups, transfer) => {
        var date;
        if (endStart <= ONE_DAY) {
          var copyOfStartDate = new Date(
            new Date(Number(startDate)).toISOString().split(":")[0] + ":00:00.000Z",
          ).getTime();

          while (copyOfStartDate <= Number(endDate)) {
            if (!groups[copyOfStartDate.toString() + "," + copyOfStartDate.toString()]) {
              groups[copyOfStartDate.toString() + "," + copyOfStartDate.toString()] = {
                creditsAmount: 0,
              };
            }
            copyOfStartDate += ONE_HOUR;
          }
          date = new Date(
            new Date(transfer.created).toISOString().split(":")[0] + ":00:00.000Z",
          ).getTime();
        } else if (endStart > ONE_DAY && endStart < ONE_WEEK) {
          //max 24 points
          custom = true;

          const arrayOfRanges = [];
          const increment = Math.round(endStart / 24);
          var copyOfStartDate = Number(startDate);

          for (let i = 0; i < 23; i++) {
            arrayOfRanges.push(copyOfStartDate + Number(increment));
            if (
              !groups[
                copyOfStartDate.toString() + "," + (copyOfStartDate + Number(increment)).toString()
              ]
            ) {
              groups[
                copyOfStartDate.toString() + "," + (copyOfStartDate + Number(increment)).toString()
              ] = { creditsAmount: 0 };
            }
            copyOfStartDate += increment;
          }

          arrayOfRanges.push(Number(endDate));
          if (!groups[copyOfStartDate.toString() + "," + Number(endDate).toString()]) {
            groups[copyOfStartDate.toString() + "," + Number(endDate).toString()] = {
              creditsAmount: 0,
            };
          }

          copyOfStartDate = Number(startDate);

          for (let j = 0; j < 23; j++) {
            if (transfer.created >= arrayOfRanges[j] && transfer.created < arrayOfRanges[j + 1]) {
              groups[
                copyOfStartDate.toString() + "," + (copyOfStartDate + Number(increment)).toString()
              ].creditsAmount += transfer.creditsAmount;

              break;
            }
            copyOfStartDate += increment;
          }
        } else if (endStart >= ONE_WEEK && endStart <= ONE_MONTH) {
          var copyOfStartDate = new Date(
            new Date(Number(startDate)).toISOString().split("T")[0] + "T00:00:00.000Z",
          ).getTime();

          while (copyOfStartDate <= Number(endDate)) {
            if (!groups[copyOfStartDate.toString() + "," + copyOfStartDate.toString()]) {
              groups[copyOfStartDate.toString() + "," + copyOfStartDate.toString()] = {
                creditsAmount: 0,
              };
            }
            copyOfStartDate += ONE_DAY;
          }
          date = new Date(
            new Date(transfer.created).toISOString().split("T")[0] + "T00:00:00.000Z",
          ).getTime();
        } else if (endStart > ONE_MONTH) {
          //max 31 points
          custom = true;

          var arrayOfRanges = [];
          const increment = Math.round(endStart / 31);
          var copyOfStartDate = Number(startDate);

          for (let i = 0; i < 30; i++) {
            arrayOfRanges.push(copyOfStartDate + Number(increment));
            if (
              !groups[
                copyOfStartDate.toString() + "," + (copyOfStartDate + Number(increment)).toString()
              ]
            ) {
              groups[
                copyOfStartDate.toString() + "," + (copyOfStartDate + Number(increment)).toString()
              ] = { creditsAmount: 0 };
            }
            copyOfStartDate += increment;
          }

          arrayOfRanges.push(Number(endDate));
          if (!groups[copyOfStartDate.toString() + "," + Number(endDate).toString()]) {
            groups[copyOfStartDate.toString() + "," + Number(endDate).toString()] = {
              creditsAmount: 0,
            };
          }

          copyOfStartDate = Number(startDate);

          for (let j = 0; j < 30; j++) {
            if (transfer.created >= arrayOfRanges[j] && transfer.created < arrayOfRanges[j + 1]) {
              groups[
                copyOfStartDate.toString() + "," + (copyOfStartDate + Number(increment)).toString()
              ].creditsAmount += transfer.creditsAmount;

              break;
            }
            copyOfStartDate += increment;
          }
        }

        //date = new Date(transfer.created).split("T")[0];
        if (!custom) {
          groups[date.toString() + "," + date.toString()].creditsAmount += transfer.creditsAmount;
        }
        return groups;
      }, {});

      if (!arrayOfGroups[array]) {
        arrayOfGroups[array] = [];
      }
      arrayOfGroups[array].push(groups);
    }
    /*
      // Edit: to add it in the array format instead
      const groupArrays = Object.keys(groups).map((date) => {
        return {
          date,
          transfers: groups[date],
        };
      });
      */

    var contentJSON = [];
    var otherJSON = [];

    for (const property in arrayOfGroups["content"][0]) {
      const obj = {
        startDate: Number(property.split(",")[0]),
        endDate: Number(property.split(",")[1]),
        creditsAmount: arrayOfGroups["content"][0][property].creditsAmount,
      };
      contentJSON.push(obj);
    }

    for (const property in arrayOfGroups["other"][0]) {
      const obj = {
        startDate: Number(property.split(",")[0]),
        endDate: Number(property.split(",")[1]),
        creditsAmount: arrayOfGroups["other"][0][property].creditsAmount,
      };
      otherJSON.push(obj);
    }

    Base.successResponse(response, Const.responsecodeSucceed, {
      content: contentJSON,
      other: otherJSON,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetGraphCreditsDetailsController",
      error,
    });
  }
});

module.exports = router;
