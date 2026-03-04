"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { User, BlessPacket, Transfer, CreditConversionRate } = require("#models");

/**
 * @api {get} /api/v2/dashboard/other Dashboard - other details API
 * @apiVersion 0.0.1
 * @apiName Dashboard - other details API
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to fetch other details on dashboard. If user is "Global" then it is a global transfer and the money is sent from non Flom user. paymentMethodType 5 represents sats transfers.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [sort] Sort (0-ascending, 1-desceding) - default 1
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1658486326493,
 *     "data": {
 *         "usersAndTransfers": [
 *             {
 *                 "_id": "62fb964563e38b1dda8909ce",
 *                 "transferType": 6,
 *                 "productName": "Cash transfer",
 *                 "amount": 0.1428571492433548,
 *                 "localAmount": 1200,
 *                 "created": 1658302463277,
 *                 "user": {
 *                     "_id": "60a654f17996ed34687d3b23",
 *                     "isAppUser": true,
 *                     "name": "+2348*****7898",
 *                     "created": 1621513457270,
 *                     "phoneNumber": "+2348130717898",
 *                     "email": "amper.sand@yahoo.com",
 *                     "cover": {
 *                         "banner": {
 *                             "file": {
 *                                 "originalName": "1 874.png",
 *                                 "nameOnServer": "defaultBanner",
 *                                 "size": 70369,
 *                                 "mimeType": "image/png",
 *                                 "aspectRapi/v2/dashboard/other0,
 *                             "thumb": {
 *                                 "originalName": "1 874.png",
 *                                 "nameOnServer": "defaultBannerThumb",
 *                                 "mimeType": "image/jpeg",
 *                                 "size": 174000
 *                             }
 *                         }
 *                     }
 *                 }
 *             },
 *             {
 *                 "transferType": 3,
 *                 "productName": "Fab",
 *                 "amount": 50,
 *                 "created": 1643116117945,
 *                 "user": {
 *                     "_id": "6050d57ff69b9e15738a2bbb",
 *                     "isAppUser": true,
 *                     "name": "Flomboyant",
 *                     "created": 1615910271398,
 *                     "phoneNumber": "+2348020000020",
 *                     "email": "luka.d@clover.studio",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1637670064.jpg",
 *                             "size": 589947,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "xzPMja451NOWaDnLGEyKNBxLHsXYoAL5"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1637670064.jpg",
 *                             "size": 89700,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "0k2i0Sth8P3WwCh3e6dIlJWhE7eZXsRd"
 *                         }
 *                     },
 *                     "cover": {
 *                         "banner": {
 *                             "file": {
 *                                 "originalName": "cropped1080081740025848746.jpg",
 *                                 "nameOnServer": "SCSlReu5cxzWZdiJGLh7yVJXsoFTOpwr",
 *                                 "size": 6653082,
 *                                 "mimeType": "image/png",
 *                                 "aspectRatio": 3
 *                             },
 *                             "fileType": 0,
 *                             "thumb": {
 *                                 "originalName": "cropped1080081740025848746.jpg",
 *                                 "nameOnServer": "ItwiwHvmblTRUTr9Kjl8PJZXPF7Uaduj",
 *                                 "mimeType": "image/jpeg",
 *                                 "size": 431000
 *                             }
 *                         },
 *                         "video": {
 *                             "file": {
 *                                 "originalName": "2022-02-14-11-38-22-898.mp4",
 *                                 "nameOnServer": "XGShcbFe5P1adgsPYSfX2LrvwEKEphKI",
 *                                 "aspectRatio": 0.66667,
 *                                 "duration": 4.966992,
 *                                 "mimeType": "video/mp4",
 *                                 "size": 2302189,
 *                                 "hslName": "07pmPyLg6bIaH7bcxpktstTxjV4A1qWl"
 *                             },
 *                             "fileType": 1,
 *                             "thumb": {
 *                                 "originalName": "2022-02-14-11-38-22-898.mp4",
 *                                 "nameOnServer": "PqbGp0IPfRVIACPCmEVB4knLYOyL83cc",
 *                                 "mimeType": "image/png",
 *                                 "size": 186121
 *                             }
 *                         },
 *                         "audio": {
 *                             "file": {
 *                                 "originalName": "AUDIO_20220214_114851.wav",
 *                                 "nameOnServer": "CEjddzjLbyIzpMy5MLcRn4fz02zh0gWQ.mp3",
 *                                 "mimeType": "audio/mpeg",
 *                                 "duration": 4.248,
 *                                 "size": 13135,
 *                                 "hslName": "6kbJXgwrjAdECzB0Od1k8iXDgKqeHgA8"
 *                             },
 *                             "fileType": 2
 *                         }
 *                     }
 *                 },
 *                 "bless": {
 *                     "_id": "61bc3cad2146cf2ba2e57759",
 *                     "title": "Fab",
 *                     "amount": 50,
 *                     "emojiFileName": "bless08",
 *                     "name": "",
 *                     "position": 8,
 *                     "smallEmojiFileName": "",
 *                     "value": 0
 *                     "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless08.webp"
 *                 }
 *             },
 *         ],
 *        "bless": 160,
 *        "cash": 2.4,
 *        "blessCredits": 200,
 *        "transfer": 95,
 *        "localBless": 80000,
 *        "localCash": 1200,
 *        "total": 21,
 *        "countResult": 10,
 *        "hasNext": true
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
    const token = request.headers["access-token"];
    const page = +request.query.page || 1;
    var sort = request.query.sort || "1"; //default desc
    var countryCode = request.query.countryCode;

    if (!countryCode) {
      countryCode = "default";
    }
    const creditConversionRate = await CreditConversionRate.findOne({ countryCode }).lean();

    const user = await User.find({ "token.token": token }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "GetOtherDetailsController, invalid user token",
      });
    }

    const blessNamesObjects = await BlessPacket.find({}, { _id: 0, title: 1 }).lean();

    let blessNames = [];

    blessNamesObjects.forEach((bless) => {
      blessNames.push(Object.values(bless)[0]);
    });

    //sats are incuded(bless user with sats) in the amount but not global transfers
    const otherTransfers = await Transfer.aggregate([
      {
        $match: {
          transferType: {
            $in: [
              Const.transferTypeSuperBless,
              Const.transferTypeCash,
              Const.transferTypeSats,
              Const.transferTypeDirectCash,
            ],
          },
          productId: { $exists: false },
          receiverPhoneNumber: user[0].phoneNumber,
          status: Const.transferComplete,
          paymentMethodType: {
            $nin: [Const.paymentMethodTypeCreditBalance, Const.paymentMethodTypeInternal],
          },
        },
      },
      {
        $group: {
          _id: "$transferType",
          sumAmount: { $sum: "$amount" },
          localSumAmount: { $sum: "$localAmountReceiver.value" },
          transferArray: {
            $push: {
              _id: "$_id",
              transferType: "$transferType",
              productName: "$productName",
              amount: "$amount",
              satsAmount: "$satsAmount",
              localAmount: "$localAmountReceiver.value",
              senderId: "$senderId",
              created: "$created",
              paymentMethodType: "$paymentMethodType",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const otherTransfersCredits = await Transfer.aggregate([
      {
        $match: {
          transferType: {
            $in: [Const.transferTypeSuperBless, Const.transferTypeCredits],
          },
          productId: { $exists: false },
          receiverPhoneNumber: user[0].phoneNumber,
          status: Const.transferComplete,
          paymentMethodType: Const.paymentMethodTypeCreditBalance,
        },
      },
      {
        $group: {
          _id: "$transferType",
          sumAmount: { $sum: "$creditsAmount" },
          transferArray: {
            $push: {
              _id: "$_id",
              transferType: "$transferType",
              productName: "$productName",
              amount: "$creditsAmount",
              senderId: "$senderId",
              created: "$created",
              paymentMethodType: "$paymentMethodType",
            },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    /*const otherTransfersGlobalSats = await Transfer.aggregate([
          {
            $match: {
              transferType: Const.transferTypeSats,
              productId: { $exists: false },
              receiverPhoneNumber: user[0].phoneNumber,
              status: Const.transferComplete,
              paymentMethodType: Const.paymentMethodTypeSatsBalance,
            },
          },
          {
            $group: {
              _id: null,
              sumAmount: { $sum: "$amount" },
              localSumAmount: { $sum: "$localAmountReceiver.value" },
              satsAmount: { $sum: "$satsAmount" },
              transferArray: {
                $push: {
                  _id: "$_id",
                  transferType: "$transferType",
                  productName: "$productName",
                  amount: "$amount",
                  localAmount: "$localAmountReceiver.value",
                  satsAmount: "$satsAmount",
                  senderId: "$senderId",
                  created: "$created",
                  paymentMethodType: "$paymentMethodType",
                },
              },
              count: { $sum: 1 },
            },
          },
        ]);

        const otherTransfersDirectCash = await Transfer.aggregate([
          {
            $match: {
              transferType: Const.transferTypeDirectCash,
              productId: { $exists: false },
              receiverPhoneNumber: user[0].phoneNumber,
              status: Const.transferComplete,
            },
          },
          {
            $group: {
              _id: null,
              sumAmount: { $sum: "$amount" },
              localSumAmount: { $sum: "$localAmountReceiver.value" },
              satsAmount: { $sum: "$satsAmount" },
              transferArray: {
                $push: {
                  _id: "$_id",
                  transferType: "$transferType",
                  productName: "$productName",
                  amount: "$amount",
                  satsAmount: "$satsAmount",
                  localAmount: "$localAmountReceiver.value",
                  senderId: "$senderId",
                  created: "$created",
                  paymentMethodType: "$paymentMethodType",
                },
              },
              count: { $sum: 1 },
            },
          },
        ]);*/

    var transfersToBeReturned = [];

    await Promise.all(
      otherTransfers.map(async (transfers) => {
        await Promise.all(
          transfers.transferArray.map(async (transfer) => {
            if (transfer.senderId === "Global") {
              transfer.user = "Global";
            } else
              transfer.user = await User.findOne(
                { _id: transfer.senderId },
                {
                  _id: 1,
                  isAppUser: 1,
                  name: 1,
                  created: 1,
                  phoneNumber: 1,
                  avatar: 1,
                  email: 1,
                  cover: 1,
                  bankAccounts: 1,
                },
              ).lean();

            delete transfer.senderId;

            //transfer.amount = transfer.amount / creditConversionRate.value;

            if (
              transfer.transferType === Const.transferTypeSuperBless &&
              blessNames.includes(transfer?.productName)
            ) {
              transfer.bless = await BlessPacket.findOne({
                title: transfer.productName,
              }).lean();

              transfer.bless.link = `${Config.webClientUrl}/api/v2/bless/emojis/${transfer.bless?.emojiFileName}`;
              transfersToBeReturned.push(transfer);
            } else if (transfer.transferType === Const.transferTypeCash) {
              transfersToBeReturned.push(transfer);
            }
          }),
        );
      }),
    );

    await Promise.all(
      otherTransfersCredits.map(async (transfers) => {
        await Promise.all(
          transfers.transferArray.map(async (transfer) => {
            if (transfer.senderId === "Global") {
              transfer.user = "Global";
            } else
              transfer.user = await User.findOne(
                { _id: transfer.senderId },
                {
                  _id: 1,
                  isAppUser: 1,
                  name: 1,
                  created: 1,
                  phoneNumber: 1,
                  avatar: 1,
                  email: 1,
                  cover: 1,
                  bankAccounts: 1,
                },
              ).lean();

            delete transfer.senderId;

            //transfer.amount = transfer.amount / creditConversionRate.value;

            if (
              transfer.transferType === Const.transferTypeSuperBless &&
              blessNames.includes(transfer?.productName)
            ) {
              transfer.bless = await BlessPacket.findOne({
                title: transfer.productName,
              }).lean();

              transfer.bless.link = `${Config.webClientUrl}/api/v2/bless/emojis/${transfer.bless?.emojiFileName}`;
              transfersToBeReturned.push(transfer);
            } else if (transfer.transferType === Const.transferTypeCredits) {
              transfersToBeReturned.push(transfer);
            }
          }),
        );
      }),
    );

    /*await Promise.all(
          otherTransfersGlobalSats.map(async (transfers) => {
            await Promise.all(
              transfers.transferArray.map(async (transfer) => {
                if (transfer.senderId !== "Global") {
                  transfer.user = await User
                    .findOne(
                      { _id: transfer.senderId },
                      {
                        _id: 1,
                        isAppUser: 1,

                        name: 1,
                        created: 1,
                        phoneNumber: 1,
                        avatar: 1,
                        email: 1,
                        cover: 1,
                        bankAccounts: 1,
                      }
                    )
                    .lean();
                  delete transfer.senderId;
                } else {
                  transfer.user = {
                    name: "Internet",
                  };
                }

                transfersToBeReturned.push(transfer);
              })
            );
          })
        );*/

    if (sort == 1) {
      transfersToBeReturned.sort((a, b) => {
        return b.amount - a.amount;
      });
    } else {
      transfersToBeReturned.sort((a, b) => {
        return a.amount - b.amount;
      });
    }

    const total = await Transfer.find({
      transferType: {
        $in: [
          Const.transferTypeSuperBless,
          Const.transferTypeCash,
          Const.transferTypeSats,
          Const.transferTypeDirectCash,
        ],
      },
      productId: { $exists: false },
      receiverPhoneNumber: user[0].phoneNumber,
      status: Const.transferComplete,
      paymentMethodType: {
        $nin: [Const.paymentMethodTypeCreditBalance, Const.paymentMethodTypeInternal],
      },
    }).countDocuments();

    const totalCredits = await Transfer.find({
      transferType: { $in: [Const.transferTypeSuperBless, Const.transferTypeCredits] },
      productId: { $exists: false },
      receiverPhoneNumber: user[0].phoneNumber,
      status: Const.transferComplete,
      paymentMethodType: Const.paymentMethodTypeCreditBalance,
    }).countDocuments();

    // const totalGlobalSats = await Transfer
    //   .find({
    //     transferType: Const.transferTypeSats,
    //     productId: { $exists: false },
    //     receiverPhoneNumber: user[0].phoneNumber,
    //     status: Const.transferComplete,
    //     paymentMethodType: Const.paymentMethodTypeSatsBalance,
    //   })
    //   .countDocuments();

    const hasNext = page * Const.newPagingRows < total + totalCredits;

    const arrayOUsersPaging = transfersToBeReturned.slice(
      (page - 1) * Const.newPagingRows,
      (page - 1) * Const.newPagingRows + 10,
    );

    let localBless = otherTransfers
      .filter((transfer) => transfer._id === Const.transferTypeSuperBless)
      .reduce((sum, transfer) => sum + transfer.localSumAmount, 0);
    let localCash = otherTransfers
      .filter(
        (transfer) =>
          transfer._id === Const.transferTypeSats || transfer._id === Const.transferTypeDirectCash,
      )
      .reduce((sum, transfer) => sum + transfer.localSumAmount, 0);
    let bless = otherTransfers
      .filter((transfer) => transfer._id === Const.transferTypeSuperBless)
      .reduce((sum, transfer) => sum + transfer.sumAmount, 0);
    let cash = otherTransfers
      .filter(
        (transfer) =>
          transfer._id === Const.transferTypeSats || transfer._id === Const.transferTypeDirectCash,
      )
      .reduce((sum, transfer) => sum + transfer.sumAmount, 0);
    let blessCredits = otherTransfersCredits
      .filter((transfer) => transfer._id === Const.transferTypeSuperBless)
      .reduce((sum, transfer) => sum + transfer.sumAmount, 0);
    let transfer = otherTransfersCredits
      .filter((transfer) => transfer._id === Const.transferTypeCredits)
      .reduce((sum, transfer) => sum + transfer.sumAmount, 0);

    /* if (otherTransfers.length == 2) {
          if (otherTransfers[0]?._id === 3) {
            bless = otherTransfers[0]?.sumAmount;
            localBless = otherTransfers[0]?.localSumAmount;
            cash = otherTransfers[1]?.sumAmount;
            localCash += otherTransfers[1]?.localSumAmount;
          } else {
            bless = otherTransfers[1]?.sumAmount;
            localBless = otherTransfers[1]?.localSumAmount;
            cash = otherTransfers[0]?.sumAmount;
            localCash += otherTransfers[0]?.localSumAmount;
          }
        } else {
          if (otherTransfers[0]?._id === 3) {
            bless = otherTransfers[0]?.sumAmount;
            localBless = otherTransfers[0]?.localSumAmount;
          }

          if (otherTransfers[0]?._id === 6) {
            cash = otherTransfers[0]?.sumAmount;
            localCash += otherTransfers[0]?.localSumAmount;
          }
        }

        if (otherTransfersCredits.length === 2) {
          if (otherTransfersCredits[0]?._id === 3) {
            transfer = otherTransfersCredits[0]?.sumAmount;
            blessCredits = otherTransfersCredits[1]?.sumAmount;
          } else {
            transfer = otherTransfersCredits[1]?.sumAmount;
            blessCredits = otherTransfersCredits[0]?.sumAmount;
          }
        } else {
          if (otherTransfersCredits[0]?._id === 3) {
            transfer = otherTransfersCredits[0]?.sumAmount;
          }

          if (otherTransfersCredits[0]?._id === 8) {
            blessCredits = otherTransfersCredits[0]?.sumAmount;
          }
        }*/

    Base.successResponse(response, Const.responsecodeSucceed, {
      usersAndTransfers: arrayOUsersPaging,
      bless,
      cash,
      blessCredits,
      transfer,
      localCash,
      localBless,
      total: total + totalCredits,
      countResult: arrayOUsersPaging.length || 0,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "GetOtherDetailsController",
      error,
    });
  }
});

module.exports = router;
