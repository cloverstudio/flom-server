"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { Product, User, Tribe, Category, Review } = require("#models");

/**
      * @api {post} /api/v2/product/merchant Search Mechant Products
      * @apiName Search Mechant Products
      * @apiGroup WebAPI
      * @apiDescription Search Mechant Products
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {String} productName productName /optional/
      * @apiParam {String} page page /optional/
      * @apiParam {String} ownerId ownerId string
      * 
      * @apiSuccessExample Success-Response:
        {
        "code": 1,
        "time": 1540989079012,
        "data": {
                    "hasNext": false,
                    "countResult": 2,
                    "products": [
                        {
                            "file": [
                                {
                                    "file": {
                                        "originalName": "IMAGE_20190506_111702_783.jpg",
                                        "size": 932342,
                                        "mimeType": "image/png",
                                        "nameOnServer": "aJvd5WZ7XhOdIHVKiFKgawAOcdehfIlD",
                                        "duration": 0
                                    },
                                    "thumb": {
                                        "originalName": "IMAGE_20190506_111702_783.jpg",
                                        "size": 98081,
                                        "mimeType": "image/jpeg",
                                        "nameOnServer": "xpqPuaqWLD8OyuWmGuZRPji2plcoOiFI"
                                    },
                                    "_id": "5ccffb903c56940c98098768",
                                    "order": 0,
                                    "fileType": 0
                                }
                            ],
                            "image": [],
                            "location": {
                                "coordinates": [
                                    0,
                                    0
                                ],
                                "type": "Point"
                            },
                            "_id": "5ccffb903c56940c98098767",
                            "name": "test2",
                            "categoryId": "5ca458e731780ea12c79f69b",
                            "description": "Ovo sure Dva rwda\nDrugi",
                            "price": 780,
                            "ownerId": "5cca99172ea804745ae2de5f",
                            "created": 1557134224246,
                            "status": 1,
                            "isNegotiable": true,
                            "__v": 0,
                            "category": {
                                "_id": "5ca458e731780ea12c79f69b",
                                "name": "Fashion Design",
                                "parentId": "5ca44c0708f8045e4e3471d3"
                            },
                            "owner": {
                                "bankAccounts": [
                                    {
                                        "_id": "5ccad30a2ea804745ae2de77",
                                        "merchantCode": "40200168",
                                        "name": "SampleAcc",
                                        "accountNumber": "1503567574679",
                                        "code": "",
                                        "selected": true
                                    }
                                ],
                                "location": {
                                    "coordinates": []
                                },
                                "locationVisibility": false,
                                "businessCategory": {
                                    "id": "5ca44c0708f8045e4e3471d3",
                                    "name": "Fashion"
                                },
                                "_id": "5cca99172ea804745ae2de5f",
                                "name": "19 Merchanr",
                                "created": 1556781335396,
                                "phoneNumber": "+2348020000019"
                            }
                        }
                    ]
                }
    }
            
    **/

router.post("/", async function (request, response) {
  try {
    const productName = request.body.productName;
    const ownerId = request.body.ownerId;
    const accessToken = request.headers["access-token"];

    const page = request.body.page ? request.body.page : 1;
    const skip = page > 0 ? (page - 1) * Const.pagingRows : 0;

    if (!ownerId) return Base.successResponse(response, Const.responsecodeProductNoOwnerId);

    const ownerFromDb = await User.findOne(
      { _id: ownerId, "isDeleted.value": false },
      { blockedProducts: 1 },
    ).lean();
    if (ownerFromDb && ownerFromDb.blockedProducts) {
      console.log(`User with id &{ownerId} is blocked`);
      return Base.successResponse(response, Const.responsecodeSucceed, {
        hasNext: false,
        countResult: 0,
        products: [],
      });
    }

    if (!ownerFromDb) {
      return Base.successResponse(response, Const.responsecodeUserNotFound);
    }

    if (ownerFromDb.isDeleted.value) {
      return Base.successResponse(response, Const.responsecodeUserDeleted);
    }

    let products = {},
      countResult,
      kidsMode;
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (productName) {
      if (accessToken) {
        const user = await User.findOne({ "token.token": accessToken }).lean();
        if (!user) return Base.successResponse(response, Const.responsecodeSigninInvalidToken);

        kidsMode = user.kidsMode;

        let userTribeIdsArray = await Tribe.aggregate([
          {
            $match: {
              $or: [
                { ownerId: user._id.toString() },
                { "members.accepted.id": user._id.toString() },
              ],
            },
          },
          { $project: { _id: 1 } },
        ]);
        userTribeIdsArray = userTribeIdsArray.map((element) => {
          return element._id;
        });

        if (_.isEmpty(userTribeIdsArray)) {
          const query = {
            name: {
              $regex: productName,
              $options: "i",
            },
            ownerId: ownerId,
            "moderation.status": Const.moderationStatusApproved,
            visibility: "public",
            isDeleted: false,
          };
          if (kidsMode === true) query.appropriateForKids = true;

          products = await Product.find(query)
            .sort({
              created: -1,
            })
            .limit(Const.pagingRows)
            .skip(skip)
            .exec();

          countResult = await Product.countDocuments(query);
        } else {
          const query = {
            name: {
              $regex: productName,
              $options: "i",
            },
            ownerId: ownerId,
            "moderation.status": Const.moderationStatusApproved,
            $or: [{ visibility: "public" }, { tribeIds: { $in: userTribeIdsArray } }],
            isDeleted: false,
          };
          if (kidsMode === true) query.appropriateForKids = true;

          products = await Product.find(query)
            .sort({
              created: -1,
            })
            .limit(Const.pagingRows)
            .skip(skip)
            .exec();

          countResult = await Product.countDocuments(query);
        }
      } else {
        products = await Product.find({
          name: {
            $regex: productName,
            $options: "i",
          },
          ownerId: ownerId,
          "moderation.status": Const.moderationStatusApproved,
          visibility: "public",
          isDeleted: false,
          appropriateForKids: true,
        })
          .sort({
            created: -1,
          })
          .limit(Const.pagingRows)
          .skip(skip)
          .exec();

        countResult = await Product.countDocuments({
          name: {
            $regex: productName,
            $options: "i",
          },
          ownerId: ownerId,
          "moderation.status": Const.moderationStatusApproved,
          visibility: "public",
          isDeleted: false,
        });
      }

      products = products.map((product) => product.toObject());
    } else {
      if (accessToken) {
        const user = await User.findOne({ "token.token": accessToken }).lean();
        if (!user) return Base.successResponse(response, Const.responsecodeSigninInvalidToken);

        kidsMode = user.kidsMode;

        let userTribeIdsArray = await Tribe.aggregate([
          {
            $match: {
              $or: [
                { ownerId: user._id.toString() },
                { "members.accepted.id": user._id.toString() },
              ],
            },
          },
          { $project: { _id: 1 } },
        ]);
        userTribeIdsArray = userTribeIdsArray.map((element) => {
          return element._id;
        });

        if (_.isEmpty(userTribeIdsArray)) {
          const query = {
            ownerId: ownerId,
            "moderation.status": Const.moderationStatusApproved,
            visibility: "public",
            isDeleted: false,
          };
          if (kidsMode === true) query.appropriateForKids = true;

          products = await Product.find(query)
            .sort({
              created: -1,
            })
            .limit(Const.pagingRows)
            .skip(skip)
            .exec();

          countResult = await Product.countDocuments(query);
        } else {
          const query = {
            ownerId: ownerId,
            "moderation.status": Const.moderationStatusApproved,
            $or: [{ visibility: "public" }, { tribeIds: { $in: userTribeIdsArray } }],
            isDeleted: false,
          };
          if (kidsMode === true) query.appropriateForKids = true;

          products = await Product.find(query)
            .sort({
              created: -1,
            })
            .limit(Const.pagingRows)
            .skip(skip)
            .exec();

          countResult = await Product.countDocuments(query);
        }
      } else {
        products = await Product.find({
          ownerId: ownerId,
          "moderation.status": Const.moderationStatusApproved,
          visibility: "public",
          isDeleted: false,
          appropriateForKids: true,
        })
          .sort({
            created: -1,
          })
          .limit(Const.pagingRows)
          .skip(skip)
          .exec();

        countResult = await Product.countDocuments({
          ownerId: ownerId,
          "moderation.status": Const.moderationStatusApproved,
          visibility: "public",
          isDeleted: false,
        })
          .sort({
            created: -1,
          })
          .limit(Const.pagingRows)
          .skip(skip)
          .exec();

        products = products.map((product) => product.toObject());
      }
    }

    const hasNext = page * Const.pagingRows < countResult;

    let dataToSend = {};
    dataToSend.hasNext = hasNext;
    dataToSend.countResult = countResult;

    let owner = await User.findOne({
      _id: ownerId,
    })
      .select(Const.userSelectQuery)
      .exec();

    if (products.length == 0) {
      dataToSend.products = [];
      return Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
    }

    let productsToSend = [];
    let categoriesArr = [];

    for (let i = 0; i < products.length; i++) {
      let product = products[i];

      categoriesArr.push({
        product_id: product._id,
        categoryId: product.categoryId,
      });

      productsToSend.push(product);
    }

    const categoryIds = categoriesArr.map((obj) => obj.categoryId);
    const productsId = categoriesArr.map((obj) => obj.product_id);

    let categories = await Category.find({
      _id: {
        $in: categoryIds,
      },
    }).exec();

    let reviews = request.user
      ? await Review.find({
          product_id: {
            $in: productsId,
          },
          user_id: request.user._id.toString(),
          isDeleted: false,
        }).lean()
      : null;

    categories = categories.map((obj) => obj.toObject());

    dataToSend.products = productsToSend.map((obj) => {
      obj.category = categories.find(
        (category) => category._id.toString() == obj.categoryId.toString(),
      );
      obj.owner = owner.toObject();

      if (reviews) {
        obj.review = reviews.find((review) => review.product_id.toString() == obj._id.toString());

        if (obj.review) {
          obj.review.name = request.user.name;
          obj.review.avatar = request.user.avatar;
          obj.review.phoneNumber = request.user.phoneNumber;
        }
      }

      Utils.addUserPriceToProduct({
        product: obj,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });

      return obj;
    });

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    console.log("Error: ", e);
    Base.errorResponse(response, Const.httpCodeServerError);
  }
});

module.exports = router;
