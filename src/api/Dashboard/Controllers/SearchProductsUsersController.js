"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const { auth } = require("#middleware");
const { User, BlessPacket, Transfer, Review, ViewForYou, Product } = require("#models");

/**
 * @api {get} /api/v2/dashboard/product Dashboard - Search product details
 * @apiVersion 0.0.1
 * @apiName Dashboard - Search product details
 * @apiGroup WebAPI Dashboard
 * @apiDescription API that can be used to fetch the list of users who made a review, view, like, bless on some product. Response depends on "username" variable.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String} field Name of the field - "reviews, views, likes, blesses, sold-regular, sold-offer"
 * @apiParam {Number} [page] Number for paging (default 1)
 * @apiParam {String} productId Id of product
 * @apiParam {String} [username] String that represents part of or full name of a user
 *
 * @apiSuccessExample {json} Success Response - field blesses
 * {
 *     "code": 1,
 *     "time": 1658739586555,
 *     "data": {
 *         "blesses": [
 *             {
 *                 "_id": "63f352db265d5f0acd3a5a85",
 *                 "user": {
 *                     "_id": "63dccc42bcc5921af87df5ce",
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "16766337",
 *                             "name": "Global",
 *                             "accountNumber": "1234567890",
 *                             "code": "011",
 *                             "selected": true
 *                         }
 *                     ],
 *                     "isAppUser": true,
 *                     "name": "Major_Kira_Nerys",
 *                     "created": 1675414594155,
 *                     "phoneNumber": "+2347087677188",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 311015,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "J86zLA5X85M2BKzuKyEUKeNnSm1SaO7H"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1675429443.jpg",
 *                             "size": 100000,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "72QsCaJDcsJgXfEv8Svpe7g43cl1AMAP"
 *                         }
 *                     },
 *                     "cover": {
 *                         "banner": {
 *                             "file": {
 *                                 "originalName": "image_1675429349.jpg",
 *                                 "nameOnServer": "TqDLJplnkJflV2sRzo6cjrItE4J9OMnz.jpg",
 *                                 "width": 1600,
 *                                 "height": 932,
 *                                 "size": 722070,
 *                                 "mimeType": "image/jpeg",
 *                                 "aspectRatio": 1.71674
 *                             },
 *                             "fileType": 0,
 *                             "thumb": {
 *                                 "originalName": "image_1675429349.jpg",
 *                                 "nameOnServer": "zmQ3cV7uPuRq4bZWTTk6JWgcnW19V9qO.jpg",
 *                                 "mimeType": "image/jpeg",
 *                                 "size": 364000
 *                             }
 *                         }
 *                     },
 *                     "email": "luka.d@clover.studio"
 *                 },
 *                 "amount": 20,
 *                 "localAmount": 10000,
 *                 "created": 1676890843262,
 *                 "bless": {
 *                     "_id": "63e2371994deb3742b0140e5",
 *                     "emoji": {
 *                         "originalFileName": "bless33.webp",
 *                         "nameOnServer": "bless33.webp",
 *                         "size": 96630,
 *                         "width": 480,
 *                         "height": 270,
 *                         "mimeType": "image/webp"
 *                     },
 *                     "smallEmoji": {
 *                         "originalFileName": "bless33.webp",
 *                         "nameOnServer": "bless33.webp",
 *                         "size": 96630,
 *                         "width": 480,
 *                         "height": 270,
 *                         "mimeType": "image/webp"
 *                     },
 *                     "isDeleted": false,
 *                     "keywords": "",
 *                     "created": 1675769625494,
 *                     "title": "Root",
 *                     "amount": 20,
 *                     "creditsAmount": 50,
 *                     "position": 27,
 *                     "emojiFileName": "bless33.webp",
 *                     "smallEmojiFileName": "bless33.webp",
 *                     "__v": 0,
 *                     "link": "https://dev-old.flom.app/api/v2/bless/emojis/bless33.webp"
 *                 }
 *             }
 *         ],
 *         "total": 4,
 *         "countResult": 4,
 *         "hasNext": false
 *     }
 * }
 *
 * @apiSuccessExample {json} Success Response - field likes
 * {
 *    "code": 1,
 *    "time": 1658304644617,
 *    "data": {
 *        "likes": [
 *            {
 *                "_id": "6050d57ff69b9e15738a2bbb",
 *                "isAppUser": true,
 *                "name": "Flomboyant",
 *                "created": 1615910271398,
 *                "phoneNumber": "+2348020000020",
 *                "email": "luka.d@clover.studio",
 *                "avatar": {
 *                    "picture": {
 *                        "originalName": "imageA_1637670064.jpg",
 *                        "size": 589947,
 *                        "mimeType": "image/png",
 *                        "nameOnServer": "xzPMja451NOWaDnLGEyKNBxLHsXYoAL5"
 *                    },
 *                    "thumbnail": {
 *                        "originalName": "imageA_1637670064.jpg",
 *                        "size": 89700,
 *                        "mimeType": "image/png",
 *                        "nameOnServer": "0k2i0Sth8P3WwCh3e6dIlJWhE7eZXsRd"
 *                    }
 *                },
 *                "cover": {
 *                    "banner": {
 *                        "file": {
 *                            "originalName": "cropped1080081740025848746.jpg",
 *                            "nameOnServer": "SCSlReu5cxzWZdiJGLh7yVJXsoFTOpwr",
 *                            "size": 6653082,
 *                            "mimeType": "image/png",
 *                            "aspectRatio": 3
 *                        },
 *                        "fileType": 0,
 *                        "thumb": {
 *                            "originalName": "cropped1080081740025848746.jpg",
 *                            "nameOnServer": "ItwiwHvmblTRUTr9Kjl8PJZXPF7Uaduj",
 *                            "mimeType": "image/jpeg",
 *                            "size": 431000
 *                        }
 *                    },
 *                    "video": {
 *                        "file": {
 *                            "originalName": "2022-02-14-11-38-22-898.mp4",
 *                            "nameOnServer": "XGShcbFe5P1adgsPYSfX2LrvwEKEphKI",
 *                            "aspectRatio": 0.66667,
 *                            "duration": 4.966992,
 *                            "mimeType": "video/mp4",
 *                            "size": 2302189,
 *                            "hslName": "07pmPyLg6bIaH7bcxpktstTxjV4A1qWl"
 *                        },
 *                        "fileType": 1,
 *                        "thumb": {
 *                            "originalName": "2022-02-14-11-38-22-898.mp4",
 *                            "nameOnServer": "PqbGp0IPfRVIACPCmEVB4knLYOyL83cc",
 *                            "mimeType": "image/png",
 *                            "size": 186121
 *                        }
 *                    },
 *                    "audio": {
 *                        "file": {
 *                            "originalName": "AUDIO_20220214_114851.wav",
 *                            "nameOnServer": "CEjddzjLbyIzpMy5MLcRn4fz02zh0gWQ.mp3",
 *                            "mimeType": "audio/mpeg",
 *                            "duration": 4.248,
 *                            "size": 13135,
 *                            "hslName": "6kbJXgwrjAdECzB0Od1k8iXDgKqeHgA8"
 *                        },
 *                        "fileType": 2
 *                    }
 *                }
 *            }
 *        ],
 *        "total": 2,
 *        "countResult": 2,
 *        "hasNext": false
 *    }
 * }
 *
 * @apiSuccessExample {json} Success Response - field views
 * {
 *    "code": 1,
 *    "time": 1658304451216,
 *    "data": {
 *        "views": [
 *            {
 *                "created": 1658150244334,
 *                "user": {
 *                    "_id": "5f87132ffa90652b60469b96",
 *                    "username": "James_Riddle",
 *                    "phoneNumber": "+2348020000010",
 *                    "name": "James_Riddle",
 *                    "bankAccounts": [
 *                        {
 *                            "_id": "62d6a57b9503fe25791f675a",
 *                            "merchantCode": "40200168",
 *                            "name": "SampleAcc",
 *                            "accountNumber": "1503567574679",
 *                            "code": "",
 *                            "selected": true
 *                        }
 *                    ],
 *                    "created": 1602687791835,
 *                    "avatar": {
 *                        "picture": {
 *                            "originalName": "image_1638974601.jpg",
 *                            "size": 131446,
 *                            "mimeType": "image/png",
 *                            "nameOnServer": "jNklNbbXnRgwDgef5zNartoS6pZSMPY8"
 *                        },
 *                        "thumbnail": {
 *                            "originalName": "image_1638974601.jpg",
 *                            "size": 79800,
 *                            "mimeType": "image/png",
 *                            "nameOnServer": "KPZP4fE8PmqG4YPmJPoHfv9CN6BCiqSf"
 *                        }
 *                    },
 *                    "isAppUser": true
 *                }
 *            }
 *        ],
 *        "total": 1,
 *        "countResult": 1,
 *        "hasNext": false
 *    }
 * }
 *
 * @apiSuccessExample {json} Success Response - field reviews
 * {
 *    "code": 1,
 *    "time": 1658304190118,
 *    "data": {
 *        "reviews": [
 *            {
 *                "_id": "623b387f81dd50183effb80e",
 *                "type": 1,
 *                "created": 1648048255644,
 *                "files": [],
 *                "product_id": "5f158464552d4627382e297b",
 *                "user_id": "6050d57ff69b9e15738a2bbb",
 *                "rate": 1,
 *                "comment": "Green is nice, ali ako stavim na mute, ništa se ne čuje 😤",
 *                "__v": 0,
 *                "user": {
 *                    "_id": "6050d57ff69b9e15738a2bbb",
 *                    "isAppUser": true,
 *                    "name": "Flomboyant",
 *                    "created": 1615910271398,
 *                    "phoneNumber": "+2348020000020",
 *                    "email": "luka.d@clover.studio",
 *                    "avatar": {
 *                        "picture": {
 *                            "originalName": "imageA_1637670064.jpg",
 *                            "size": 589947,
 *                            "mimeType": "image/png",
 *                            "nameOnServer": "xzPMja451NOWaDnLGEyKNBxLHsXYoAL5"
 *                        },
 *                        "thumbnail": {
 *                            "originalName": "imageA_1637670064.jpg",
 *                            "size": 89700,
 *                            "mimeType": "image/png",
 *                            "nameOnServer": "0k2i0Sth8P3WwCh3e6dIlJWhE7eZXsRd"
 *                        }
 *                    },
 *                    "cover": {
 *                        "banner": {
 *                            "file": {
 *                                "originalName": "cropped1080081740025848746.jpg",
 *                                "nameOnServer": "SCSlReu5cxzWZdiJGLh7yVJXsoFTOpwr",
 *                                "size": 6653082,
 *                                "mimeType": "image/png",
 *                                "aspectRatio": 3
 *                            },
 *                            "fileType": 0,
 *                            "thumb": {
 *                                "originalName": "cropped1080081740025848746.jpg",
 *                                "nameOnServer": "ItwiwHvmblTRUTr9Kjl8PJZXPF7Uaduj",
 *                                "mimeType": "image/jpeg",
 *                                "size": 431000
 *                            }
 *                        },
 *                        "video": {
 *                            "file": {
 *                                "originalName": "2022-02-14-11-38-22-898.mp4",
 *                                "nameOnServer": "XGShcbFe5P1adgsPYSfX2LrvwEKEphKI",
 *                                "aspectRatio": 0.66667,
 *                                "duration": 4.966992,
 *                                "mimeType": "video/mp4",
 *                                "size": 2302189,
 *                                "hslName": "07pmPyLg6bIaH7bcxpktstTxjV4A1qWl"
 *                            },
 *                            "fileType": 1,
 *                            "thumb": {
 *                                "originalName": "2022-02-14-11-38-22-898.mp4",
 *                                "nameOnServer": "PqbGp0IPfRVIACPCmEVB4knLYOyL83cc",
 *                                "mimeType": "image/png",
 *                                "size": 186121
 *                            }
 *                        },
 *                        "audio": {
 *                            "file": {
 *                                "originalName": "AUDIO_20220214_114851.wav",
 *                                "nameOnServer": "CEjddzjLbyIzpMy5MLcRn4fz02zh0gWQ.mp3",
 *                                "mimeType": "audio/mpeg",
 *                                "duration": 4.248,
 *                                "size": 13135,
 *                                "hslName": "6kbJXgwrjAdECzB0Od1k8iXDgKqeHgA8"
 *                            },
 *                            "fileType": 2
 *                        }
 *                    }
 *                }
 *            }
 *        ],
 *        "avgRatesScore": 1,
 *        "total": 4,
 *        "countResult": 4,
 *        "hasNext": false
 *    }
 * }
 *
 * @apiSuccessExample {json} Success Response - fields sold-offer and sold-regular
 * {
 *     "code": 1,
 *     "time": 1658302457630,
 *     "data": {
 *         "sold": [
 *             {
 *                 "_id": "621f75819716ad4429d12335",
 *                 "created": 1646228865171,
 *                 "basket": {
 *                     "id": "62161392d1a8ac16c7eb1593",
 *                     "quantity": 1,
 *                     "pricePerItem": 4.29,
 *                     "localPricePerItem": 2000.29,
 *                     "name": "Visibabe"
 *                 },
 *                 "user": {
 *                     "_id": "5f7ee464a283bc433d9d722f",
 *                     "username": "mdragic",
 *                     "phoneNumber": "+2348020000007",
 *                     "name": "mdragic",
 *                     "bankAccounts": [
 *                         {
 *                             "_id": "6261379c0f7ddf1e2bca8e3a",
 *                             "merchantCode": "40200168",
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "selected": true
 *                         }
 *                     ],
 *                     "created": 1602151524372,
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "cropped2444207444774310745.jpg",
 *                             "size": 4698848,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "profile-3XFUoWqVRofEPbMfC1ZKIDNj"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "cropped2444207444774310745.jpg",
 *                             "size": 97900,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "thumb-wDIl52eluinZOQ20yNn2PpnMwi"
 *                         }
 *                     },
 *                     "isAppUser": true
 *                 }
 *             },
 *         ],
 *         "total": 4,
 *         "countResult": 4,
 *         "hasNext": false
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
    var field = request.query.field;
    var productId = request.query.productId;
    var page = +request.query.page || 1;
    var username = request.query.userName || "";
    username = username.toLowerCase();

    var reviews, sold, soldOffer, likes, blesses;

    const user = await User.find({ "token.token": token }).lean();

    if (!user) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "SearchProductsUsersController, invalid user token",
      });
    }

    var product = await Product.findOne({ _id: productId }).lean();

    if (field === "reviews") {
      var reviewsForResponse = [];
      reviews = await Review.find({ product_id: productId, isDeleted: false }).lean();

      await Promise.all(
        reviews.map(async (review) => {
          const user = await User.findOne(
            { _id: review.user_id },
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

          review.user = user;

          if (user.name.toLowerCase().includes(username)) {
            reviewsForResponse.push(review);
          }
        }),
      );

      const rates = await Review.aggregate([
        { $match: { product_id: productId, isDeleted: false } },
        { $group: { _id: null, sumRates: { $sum: "$rate" }, reviewsCount: { $sum: 1 } } },
      ]);

      const hasNext = page * Const.newPagingRows < reviewsForResponse.length;

      const arrayForResponsePaging = reviewsForResponse.slice(
        (page - 1) * Const.newPagingRows,
        (page - 1) * Const.newPagingRows + 10,
      );

      return Base.successResponse(response, Const.responsecodeSucceed, {
        reviews: arrayForResponsePaging,
        avgRatesScore: rates[0]?.sumRates / rates[0]?.reviewsCount || 0,
        total: reviewsForResponse.length,
        countResult: arrayForResponsePaging.length,
        hasNext,
      });
    } else if (field === "views") {
      var userIdsAndDate = await ViewForYou.find(
        { productId: productId },
        { _id: 0, userId: 1, created: 1 },
      )
        .sort({ created: 1 })
        .lean();

      var usersAndDate = await addUsers(userIdsAndDate, username);

      const arrayOfUsersAndDate = usersAndDate.slice(
        (page - 1) * Const.newPagingRows,
        (page - 1) * Const.newPagingRows + 10,
      );

      const hasNext = page * Const.newPagingRows < usersAndDate.length;

      return Base.successResponse(response, Const.responsecodeSucceed, {
        views: arrayOfUsersAndDate,
        total: usersAndDate.length,
        countResult: arrayOfUsersAndDate.length,
        hasNext,
      });
    } else if (field === "likes") {
      likes = await User.find(
        {
          likedProducts: productId,
          name: {
            $regex: "^" + username,
            $options: "i",
          },
        },
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
      )
        .skip((page - 1) * Const.newPagingRows)
        .limit(Const.newPagingRows)
        .lean();

      var total = await User.find({
        likedProducts: productId,
        name: {
          $regex: "^" + username,
          $options: "i",
        },
      }).countDocuments();

      if (username === "") {
        likes = [];
        total = 0;
      }

      const hasNext = page * Const.newPagingRows < total;

      return Base.successResponse(response, Const.responsecodeSucceed, {
        likes: likes,
        total: total,
        countResult: likes.length,
        hasNext,
      });
    } else if (field === "blesses") {
      blesses = await Transfer.aggregate([
        {
          $match: {
            transferType: Const.transferTypeSuperBless,
            productId: productId,
            status: Const.transferComplete,
          },
        },
        {
          $group: {
            _id: null,
            sumAmount: { $sum: "$amount" },
            localSumAmount: { $sum: "$localAmountReceiver.value" },
            arrayOfIdsAndAmounts: {
              $push: {
                transferId: "$_id",
                id: "$senderId",
                amount: "$amount",
                localAmount: "$localAmountReceiver.value",
                productName: "$blessPacket.title",
                created: "$created",
              },
            },
          },
        },
      ]);

      var blessRes = [];

      if (!blesses[0]) {
        blesses = [[]];
        blesses[0].arrayOfIdsAndAmounts = [];
      }

      await Promise.all(
        blesses[0]?.arrayOfIdsAndAmounts?.map(async (bless) => {
          var obj = {};

          obj._id = bless.transferId;

          obj.user = await User.findOne(
            { _id: bless.id },
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

          obj.amount = bless.amount;
          obj.localAmount = bless.localAmount;

          obj.created = bless.created;

          obj.bless = await BlessPacket.findOne({ title: bless.productName }).lean();
          if (obj.bless)
            obj.bless.link = `${Config.webClientUrl}/api/v2/bless/emojis/${obj.bless.emojiFileName}`;

          if (obj.user?.name.toLowerCase().includes(username) && username != "") {
            blessRes.push(obj);
          }
        }),
      );

      const total = blessRes.length;
      const hasNext = page * Const.newPagingRows < total;

      const arrayForResponsePaging = blessRes.slice(
        (page - 1) * Const.newPagingRows,
        (page - 1) * Const.newPagingRows + 10,
      );

      return Base.successResponse(response, Const.responsecodeSucceed, {
        blesses: arrayForResponsePaging,
        total,
        countResult: arrayForResponsePaging.length,
        hasNext,
      });
    } else if (field === "sold-regular") {
      sold = await Transfer.find(
        {
          $and: [
            { basket: { $elemMatch: { id: productId } } },
            { receiverPhoneNumber: user[0].phoneNumber },
            { transferType: Const.transferTypeMarketplace },
            { status: Const.transferComplete },
          ],
        },
        { basket: 1, senderPhoneNumber: 1, created: 1 },
      ).lean();

      sold.forEach((product) => {
        product.basket = product.basket.filter((basket) => {
          return basket.id == productId;
        });

        product.basket = {
          id: product.basket[0].id,
          quantity: product.basket[0].quantity,
          pricePerItem: product.basket[0].pricePerItem,
          localPricePerItem: product.basket[0].localAmountReceiver.value,
          name: product.basket[0].name,
          fulfilled: product.basket[0].fulfilled,
        };
      });

      const soldWithUsers = await addUsersForSold(sold, username);

      const hasNext = page * Const.newPagingRows < soldWithUsers.length;

      const arrayOUsersPaging = soldWithUsers.slice(
        (page - 1) * Const.newPagingRows,
        (page - 1) * Const.newPagingRows + 10,
      );

      return Base.successResponse(response, Const.responsecodeSucceed, {
        sold: arrayOUsersPaging,
        total: soldWithUsers.length,
        countResult: arrayOUsersPaging.length,
        hasNext,
      });
    } else if (field === "sold-offer") {
      soldOffer = await Transfer.find(
        {
          receiverPhoneNumber: user[0].phoneNumber,
          basket: { $elemMatch: { messageId: { $exists: true }, id: productId } },
          status: Const.transferComplete,
        },
        { senderPhoneNumber: 1, basket: 1, created: 1 },
      ).lean();

      soldOffer.forEach((product) => {
        product.basket = product.basket.filter((basket) => {
          return basket.id == productId;
        });

        //rename so I can call function addUsersForSold
        product.receiverPhoneNumber = product.senderPhoneNumber;
        delete product.senderPhoneNumber;

        product.basket = {
          id: product.basket[0].id,
          quantity: product.basket[0].quantity,
          pricePerItem: product.basket[0].pricePerItem,
          localPricePerItem: product.basket[0].localAmountReceiver.value,
          name: product.basket[0].name,
          fulfilled: product.basket[0].fulfilled,
        };
      });

      const soldWithUsers = await addUsersForSold(soldOffer, username);

      const hasNext = page * Const.newPagingRows < soldWithUsers.length;

      const arrayOUsersPaging = soldWithUsers.slice(
        (page - 1) * Const.newPagingRows,
        (page - 1) * Const.newPagingRows + 10,
      );

      return Base.successResponse(response, Const.responsecodeSucceed, {
        sold: arrayOUsersPaging,
        total: soldWithUsers.length,
        countResult: arrayOUsersPaging.length,
        hasNext,
      });
    }

    return Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    return Base.newErrorResponse({
      response,
      message: "SearchProductsUsersController",
      error,
    });
  }
});

async function addUsers(userIdsAndDate, username) {
  const userIds = userIdsAndDate.reduce((acc, cur) => {
    return [...acc, cur.userId];
  }, []);
  var users = await User.find({ _id: { $in: [...new Set(userIds)] } }).lean();

  users = users.filter((user) => {
    return user.name.toLowerCase().includes(username);
  });

  for (let i = 0; i < userIdsAndDate.length; i++) {
    const { userId } = userIdsAndDate[i];

    const currentUser = users.find((user) => user._id.toString() === userId);
    if (currentUser) {
      delete userIdsAndDate[i].userId;
      userIdsAndDate[i].user = {
        _id: userId,
        username: currentUser.userName,
        phoneNumber: currentUser.phoneNumber,
        name: currentUser.name,
        bankAccounts: currentUser.bankAccounts,
        created: currentUser.created,
        avatar: currentUser.avatar || {},
        isAppUser: currentUser.isAppUser,
        whatsApp: currentUser.whatsApp,
      };
    } else {
      userIdsAndDate = userIdsAndDate.filter((userAndDate) => {
        return userAndDate.userId != userId;
      });
    }
  }
  return userIdsAndDate;
}

async function addUsersForSold(sold, username) {
  console.log("username ", username);
  const userPhoneNumbers = sold.reduce((acc, cur) => {
    return [...acc, cur.senderPhoneNumber];
  }, []);

  var users = await User.find({ phoneNumber: { $in: [...new Set(userPhoneNumbers)] } }).lean();

  users = users.filter((user) => {
    return user.name?.toLowerCase().includes(username) && username != "";
  });

  for (let i = 0; i < sold.length; i++) {
    const { senderPhoneNumber } = sold[i];

    const currentUser = users.find((user) => user.phoneNumber === senderPhoneNumber);
    if (currentUser) {
      delete sold[i].senderPhoneNumber;
      sold[i].user = {
        _id: currentUser._id.toString(),
        username: currentUser.userName,
        phoneNumber: currentUser.phoneNumber,
        name: currentUser.name,
        bankAccounts: currentUser.bankAccounts,
        created: currentUser.created,
        avatar: currentUser.avatar || {},
        isAppUser: currentUser.isAppUser,
        whatsApp: currentUser.whatsApp,
      };
    } else {
      sold = sold.filter((user) => {
        return user.senderPhoneNumber != senderPhoneNumber;
      });
    }
  }
  return sold;
}

module.exports = router;
