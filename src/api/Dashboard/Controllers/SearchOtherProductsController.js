"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { User, BlessPacket, Transfer, CreditConversionRate } = require("#models");

/**
 * @api {get} /api/v2/dashboard/other/search Dashboard - Search dashboard other users
 * @apiName Dashboard - Search other users
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to search users by its name.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} [page] Page number for paging (default 1)
 * @apiParam (Query string) {String} [username] String that represents part of or full name of a user
 * @apiParam (Query string) {String} [sort] Sort (0-ascending, 1-desceding) - default 1
 *
 * @apiSuccessExample Success-Response:
 * {
 *     "code": 1,
 *     "time": 1658486326493,
 *     "data": {
 *         "usersAndTransfers": [
 *            {
 *                 "_id": "63f785065c2a842a8bc0b72e",
 *                 "transferType": 8,
 *                 "productName": "50 credits",
 *                 "amount": 0.25,
 *                 "created": 1677165830124,
 *                 "paymentMethodType": 4,
 *                 "user": {
 *                     "_id": "63e0d656a62453346de15e37",
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "40200168",
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "selected": true
 *                         }
 *                     ],
 *                     "isAppUser": true,
 *                     "name": "Mer01",
 *                     "created": 1675679318902,
 *                     "phoneNumber": "+2348020000001",
 *                     "cover": {
 *                         "banner": {
 *                             "file": {
 *                                 "originalName": "1 874.png",
 *                                 "nameOnServer": "defaultBanner",
 *                                 "size": 70369,
 *                                 "mimeType": "image/png",
 *                                 "aspectRatio": 3.13044
 *                             },
 *                             "fileType": 0,
 *                             "thumb": {
 *                                 "originalName": "1 874.png",
 *                                 "nameOnServer": "defaultBannerThumb",
 *                                 "mimeType": "image/jpeg",
 *                                 "size": 174000
 *                             }
 *                         }
 *                     },
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1675941548.jpg",
 *                             "size": 2459644,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "gSAor1NEcOI80CxOyiWIUDdtWBDufdmS"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1675941548.jpg",
 *                             "size": 102000,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "giQmiVnX13ZmjjmHTHxCRlOItmZIWiOL"
 *                         }
 *                     }
 *                 }
 *             },
 *             {
 *                 "transferType": 6,
 *                 "productName": "Cash transfer",
 *                 "amount": 0.1428571492433548,
 *                 "localAmount": 1200,
 *                 "created": 1658302463277,
 *                 "paymentMethodType": 1,
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
 *                                 "aspectRatio": 3.13044
 *                             },
 *                             "fileType": 0,
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
 *                 "paymentMethodType": 1,
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
 *         "total": 30,
 *         "countResult": 10,
 *         "hasNext": true
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
 **/

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const token = request.headers["access-token"];
    const page = +request.query.page || 1;
    var sort = request.query.sort || "1"; //default desc
    var username = request.query.username || "";
    username = username.toLowerCase();
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
        message: "SearchOtherProductsController, invalid user token",
      });
    }

    const blessNamesObjects = await BlessPacket.find({}, { _id: 0, title: 1 }).lean();

    let blessNames = [];

    blessNamesObjects.forEach((bless) => {
      blessNames.push(Object.values(bless)[0]);
    });

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
                  bankAccounts: 1,
                  avatar: 1,
                  email: 1,
                  cover: 1,
                },
              ).lean();

            delete transfer.senderId;

            if (
              transfer.transferType === Const.transferTypeSuperBless &&
              blessNames.includes(transfer?.productName)
            ) {
              transfer.bless = await BlessPacket.findOne({
                title: transfer.productName,
              }).lean();

              transfer.bless.link = `${Config.webClientUrl}/api/v2/bless/emojis/${transfer.bless.emojiFileName}`;
              if (transfer.user.name.toLowerCase().includes(username) && username !== "") {
                transfersToBeReturned.push(transfer);
              }
            } else if (
              transfer.transferType === Const.transferTypeCash &&
              transfer.user.name.toLowerCase().includes(username) &&
              username !== ""
            ) {
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
              if (transfer.user.name.toLowerCase().includes(username) && username !== "") {
                transfersToBeReturned.push(transfer);
              }
            } else if (
              transfer.transferType === Const.transferTypeCredits &&
              transfer.user.name.toLowerCase().includes(username) &&
              username !== ""
            ) {
              transfersToBeReturned.push(transfer);
            }
          }),
        );
      }),
    );

    if (sort == 1) {
      transfersToBeReturned.sort((a, b) => {
        return b.amount - a.amount;
      });
    } else {
      transfersToBeReturned.sort((a, b) => {
        return a.amount - b.amount;
      });
    }

    const hasNext = page * Const.newPagingRows < transfersToBeReturned.length;

    const arrayOfTransfersPaging = transfersToBeReturned.slice(
      (page - 1) * Const.newPagingRows,
      (page - 1) * Const.newPagingRows + 10,
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      usersAndTransfers: arrayOfTransfersPaging,
      total: transfersToBeReturned.length,
      countResult: arrayOfTransfersPaging.length,
      hasNext,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SearchOtherProductsController",
      error,
    });
  }
});

module.exports = router;
