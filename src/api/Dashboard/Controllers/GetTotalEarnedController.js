"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User, Transfer } = require("#models");

/**
 * @api {get} /api/v2/dashboard Dashboard - Total earned API
 * @apiVersion 0.0.1
 * @apiName Dashboard - Total earned API
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to get total earned amount from marketplace, content, community and other.
 *
 * @apiParam  {String} startDate Starting date
 * @apiParam  {String} endDate Ending date
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1658760221805,
 *     "data": {
 *         "marketplace": 3243538.25,
 *         "localMarketplace": 32435380000.25,
 *         "community": 640151.98,
 *         "localCommunity": 64015100000.98,
 *         "content": 481,
 *         "localContent": 4810000,
 *         "other": 1574.71857144773
 *         "localOther": 157400000.71857144773
 *         "credits": 955,
 *         "creditsContent": 0,
 *         "creditsOther": 955
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

    let startDate = request.query.startDate;
    var endDate = request.query.endDate;

    const conversionRates = await Utils.getConversionRates();

    if (!startDate && !endDate) {
      startDate = user.created;
      endDate = Date.now();
    }

    var community;
    var marketplace;
    var content;
    var other;
    var credits;
    var creditsOther;
    var creditsContent;
    var satsContent;
    var satsOther;
    var satsMarketplace;

    startDate = startDate === "0" ? user.created : startDate;

    //other
    //sats are incuded in the amount
    other = await Transfer.aggregate([
      {
        $match: {
          transferType: {
            $in: [
              Const.transferTypeSuperBless,
              Const.transferTypeCash,
              Const.transferTypeDirectCash,
              Const.transferTypeSats,
            ],
          },
          receiverPhoneNumber: user.phoneNumber,
          productId: { $exists: false },
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: {
            $nin: [Const.paymentMethodTypeCreditBalance, Const.paymentMethodTypeInternal],
          },
        },
      },
      {
        $group: {
          _id: null,
          localSumAmount: { $sum: "$localAmountReceiver.value" },
          sumAmount: { $sum: "$amount" },
        },
      },
    ]);

    //content
    content = await Transfer.aggregate([
      {
        $match: {
          transferType: Const.transferTypeSuperBless,
          receiverPhoneNumber: user.phoneNumber,
          productId: { $exists: true },
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: {
            $nin: [Const.paymentMethodTypeCreditBalance, Const.paymentMethodTypeInternal],
          },
        },
      },
      {
        $group: {
          _id: null,
          localSumAmount: { $sum: "$localAmountReceiver.value" },
          sumAmount: { $sum: "$amount" },
        },
      },
    ]);

    //marketplace
    marketplace = await Transfer.aggregate([
      {
        $match: {
          transferType: Const.transferTypeMarketplace,
          receiverPhoneNumber: user.phoneNumber,
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: {
            $nin: [Const.paymentMethodTypeCreditBalance, Const.paymentMethodTypeInternal],
          },
        },
      },
      {
        $group: {
          _id: "$transferType",
          localSumAmount: { $sum: "$localAmountReceiver.value" },
          sumAmount: { $sum: "$amount" },
        },
      },
    ]);

    //community
    community = await Transfer.aggregate([
      {
        $match: {
          transferType: Const.transferTypeMembership,
          receiverPhoneNumber: user.phoneNumber,
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: {
            $nin: [Const.paymentMethodTypeCreditBalance, Const.paymentMethodTypeInternal],
          },
        },
      },
      {
        $group: {
          _id: null,
          localSumAmount: { $sum: "$localAmountReceiver.value" },
          sumAmount: { $sum: "$amount" },
        },
      },
    ]);

    //-------------------   CREDITS LOGIC  ----------------------
    credits = await Transfer.aggregate([
      {
        $match: {
          transferType: Const.transferTypeCredits,
          receiverPhoneNumber: user.phoneNumber,
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: Const.paymentMethodTypeCreditBalance,
        },
      },
      { $group: { _id: null, sumAmount: { $sum: "$creditsAmount" } } },
    ]);

    creditsContent = await Transfer.aggregate([
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
      { $group: { _id: null, sumAmount: { $sum: "$creditsAmount" } } },
    ]);

    creditsOther = await Transfer.aggregate([
      {
        $match: {
          transferType: {
            $in: [Const.transferTypeSuperBless, Const.transferTypeCredits],
          },
          receiverPhoneNumber: user.phoneNumber,
          productId: { $exists: false },
          created: { $gte: Number(startDate), $lte: Number(endDate) },
          status: Const.transferComplete,
          paymentMethodType: Const.paymentMethodTypeCreditBalance,
        },
      },
      { $group: { _id: null, sumAmount: { $sum: "$creditsAmount" } } },
    ]);

    //-------------------   SATS LOGIC  ----------------------

    //content
    // satsContent = await Transfer.aggregate([
    //   {
    //     $match: {
    //       transferType: Const.transferTypeSuperBless,
    //       productId: { $exists: true },
    //       receiverPhoneNumber: user[0].phoneNumber,
    //       created: { $gte: Number(startDate), $lte: Number(endDate) },
    //       status: Const.transferComplete,
    //       paymentMethodType: Const.paymentMethodTypeSatsBalance,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       sumAmount: { $sum: "$satsAmount" },
    //     },
    //   },
    // ]);

    //other
    // satsOther = await Transfer.aggregate([
    //   {
    //     $match: {
    //       transferType: Const.transferTypeSuperBless,
    //       receiverPhoneNumber: user[0].phoneNumber,
    //       productId: { $exists: false },
    //       created: { $gte: Number(startDate), $lte: Number(endDate) },
    //       status: Const.transferComplete,
    //       paymentMethodType: Const.paymentMethodTypeSatsBalance,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       sumAmount: { $sum: "$satsAmount" },
    //     },
    //   },
    // ]);

    //marketplace
    // satsMarketplace = await Transfer.aggregate([
    //   {
    //     $match: {
    //       transferType: Const.transferTypeMarketplace,
    //       receiverPhoneNumber: user[0].phoneNumber,
    //       created: { $gte: Number(startDate), $lte: Number(endDate) },
    //       status: Const.transferComplete,
    //       paymentMethodType: Const.paymentMethodTypeSatsBalance,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       sumAmount: { $sum: "$satsAmount" },
    //     },
    //   },
    // ]);

    // const satsMarketplaceToLocal =
    //   (satsMarketplace[0]?.sumAmount / conversionRates.rates["SAT"]) *
    //   conversionRates.rates[user[0].currency];

    // const satsContentToLocal =
    //   (satsContent[0]?.sumAmount / conversionRates.rates["SAT"]) *
    //   conversionRates.rates[user[0].currency];

    // const satsOtherToLocal =
    //   (satsOther[0]?.sumAmount / conversionRates.rates["SAT"]) *
    //   conversionRates.rates[user[0].currency];

    Base.successResponse(response, Const.responsecodeSucceed, {
      marketplace: marketplace[0]?.sumAmount || 0,
      // localMarketplace: (satsMarketplaceToLocal || 0) + (marketplace[0]?.localSumAmount || 0),
      localMarketplace: marketplace[0]?.localSumAmount || 0,
      community: community[0]?.sumAmount || 0,
      localCommunity: community[0]?.localSumAmount || 0,
      content: content[0]?.sumAmount || 0,
      // localContent: (satsContentToLocal || 0) + (content[0]?.localSumAmount || 0),
      other: other[0]?.sumAmount || 0,
      // localOther: (satsOtherToLocal || 0) + (other[0]?.localSumAmount || 0),
      localContent: content[0]?.localSumAmount || 0,
      localOther: other[0]?.localSumAmount || 0,

      credits: credits[0]?.sumAmount || 0,
      creditsContent: creditsContent[0]?.sumAmount || 0,
      creditsOther: creditsOther[0]?.sumAmount || 0,
      // satsContent: satsContent[0]?.sumAmount || 0,
      // satsOther: satsOther[0]?.sumAmount || 0,
      // satsMarketplace: satsMarketplace[0]?.sumAmount || 0,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetTotalEarnedController",
      error,
    });
  }
});

module.exports = router;
