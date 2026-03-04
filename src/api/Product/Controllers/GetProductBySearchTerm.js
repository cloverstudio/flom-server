"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, User, Category, Review } = require("#models");

/**
      * @api {post} /api/v2/product/search Get Product By Search Term
      * @apiName Get Product By Search Term
      * @apiGroup WebAPI
      * @apiDescription Get Product By Search Term
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {String} searchTerm searchTerm - string
      * @apiParam {String} page page - number
      * @apiParam {String} location location - string - "longitude,latitude" /optional/
      * 
      * @apiSuccessExample Success-Response:
        {
        "code": 1,
        "time": 1540989079012,
        "data": {
                    "products": [
                        {
                            "file": [
                                {
                                    "file": {
                                        "originalName": "IMAGE_20190405_102608_312.jpg",
                                        "size": 1436656,
                                        "mimeType": "image/png",
                                        "nameOnServer": "q0E65Q6kb9B936X29YMUW0kifa1FLDwJ",
                                        "duration": 0
                                    },
                                    "thumb": {
                                        "originalName": "IMAGE_20190405_102608_312.jpg",
                                        "size": 11794,
                                        "mimeType": "image/jpeg",
                                        "nameOnServer": "Fjsy4KQA5kvvnGFAFM8LhWTF8ejF3LmQ"
                                    },
                                    "_id": "5ca71f317cccce26ba707ab6",
                                    "order": 0,
                                    "fileType": 0
                                }
                            ],
                            "image": [],
                            "location": {
                                "coordinates": [
                                    3.4645379707217216,
                                    6.426246682250032
                                ],
                                "type": "Point"
                            },
                            "_id": "5ca71f317cccce26ba707ab5",
                            "name": "Wallet ",
                            "categoryId": "5c5d5605cb012234f3d878e8",
                            "description": "Men wallet ",
                            "price": 4000,
                            "ownerId": "5bcf4018601533624f7979db",
                            "created": 1554456369692,
                            "status": 1,
                            "__v": 0,
                            "category": {
                                "_id": "5c5d5605cb012234f3d878e8",
                                "name": "Fashion design",
                                "parentId": "5c5d4268cb012234f3d87878"
                            },
                             "review": {
                                    "_id": "5cb6d5457823840e026df415",
                                    "product_id": "5cb46450e9ad4e2e953cb37a",
                                    "user_id": "5caf3739e9ad4e2e953cb246",
                                    "created": 1555491938169,
                                    "rate": 3,
                                    "comment": "iyzitzif,kg k ljvo hogogoglgltrmfmfmfkfkfkfifoififoof",
                                    "__v": 0,
                                    "name": "Sinisa",
                                    "avatar": {
                                        "picture": {
                                            "originalName": "scaled_1554986858724_camera.jpg",
                                            "size": 880225,
                                            "mimeType": "image/png",
                                            "nameOnServer": "J8yG6UwvJJhjsEZj5q7nsrdXaGGlh5mA"
                                        },
                                        "thumbnail": {
                                            "originalName": "scaled_1554986858724_camera.jpg",
                                            "size": 85117,
                                            "mimeType": "image/png",
                                            "nameOnServer": "U2SYeTx3ilk7Ir66YnMKljgdtMvJz45K"
                                        }
                                    },
                                    "phoneNumber": "+385989503635"
                                },
                            "owner": {
                                "avatar": {
                                    "picture": {
                                        "originalName": "scaled_D1dPEehW0AAQ8eG.gif",
                                        "size": 388543,
                                        "mimeType": "image/png",
                                        "nameOnServer": "v46DKi1JVfZqvfitn7HxBwJWwdpUylIL"
                                    },
                                    "thumbnail": {
                                        "originalName": "scaled_D1dPEehW0AAQ8eG.gif",
                                        "size": 61276,
                                        "mimeType": "image/png",
                                        "nameOnServer": "xaHrtFodTPMJhQ22ytAZFjj0jhuMpzK9"
                                    }
                                },
                                "bankAccounts": [
                                    {
                                        "_id": "5cad9c6eab7b1235c7a20055",
                                        "merchantCode": "40202221",
                                        "name": "",
                                        "accountNumber": "1524755459207",
                                        "code": "",
                                        "selected": false
                                    }
                                ],
                                "location": {
                                    "coordinates": [
                                        3.4645379707217216,
                                        6.426246682250032
                                    ],
                                    "type": "Point"
                                },
                                "locationVisibility": false,
                                "businessCategory": {
                                    "id": "5ca44ced08f8045e4e3471db",
                                    "name": "Business services"
                                },
                                "workingHours": {
                                    "start": "9am",
                                    "end": "5pm"
                                },
                                "_id": "5bcf4018601533624f7979db",
                                "name": "ShopPlus",
                                "created": 1540309016417,
                                "phoneNumber": "+2348031930926",
                                "aboutBusiness": "We are your number one spot for tech and fashion products "
                            }
                    ],
                    "shops": [
                         {
                            "avatar": {
                                "picture": {
                                    "originalName": "scaled_1550042995515_camera.jpg",
                                    "size": 885672,
                                    "mimeType": "image/png",
                                    "nameOnServer": "x3caT25nlj3YS9iiJELmDoI5L26H6HSp"
                                },
                                "thumbnail": {
                                    "originalName": "scaled_1550042995515_camera.jpg",
                                    "size": 86348,
                                    "mimeType": "image/png",
                                    "nameOnServer": "sTMdHRE6ZZigckyh3bn63rGCinXBRiYP"
                                }
                            },
                            "bankAccounts": [
                                {
                                    "_id": "5cad969aab7b1235c7a20052",
                                    "merchantCode": "40200167",
                                    "name": "",
                                    "accountNumber": "1503567574678",
                                    "code": "",
                                    "selected": false
                                }
                            ],
                            "location": {
                                "coordinates": [
                                    15.800305902957916,
                                    45.816087130145576
                                ],
                                "type": "Point"
                            },
                            "locationVisibility": false,
                            "businessCategory": {
                                "id": "5ca44cb408f8045e4e3471d9",
                                "name": "Computers and Phones"
                            },
                            "_id": "5be15ea110cca85cda92bebf",
                            "created": 1541496481586,
                            "phoneNumber": "+2348027741500",
                            "name": "MultiStore",
                            "aboutBusiness": "ul ififpifpufoudp7dp7d"
                        }
                    ],
                    "countResult": {
                        "shops": 4,
                        "products": 54
                    },
                    "hasNext": {
                        "shops": false,
                        "products": false
                    }
                }
    }
            
    **/

const generateQueryObject = function (params) {
  let result = {};

  let $and = [];

  if (params.searchTerm) {
    const allWords = params.searchTerm.split(" ");

    allWords.forEach((word) => {
      $and.push({
        name: {
          $regex: word,
          $options: "i",
        },
      });
    });
  }

  if (!params.location) {
    result.$and = $and;
    if (params.typeAcc) result.typeAcc = params.typeAcc;
  } else {
    result.$geoNear = {
      near: params.location,
      spherical: true,
      distanceField: "dist.calculated",
      query: {
        $and,
      },
    };
    if (params.typeAcc) result.$geoNear.query.typeAcc = params.typeAcc;
  }
  result.isDeleted = false;

  if (params.kidsMode === true) result.appropriateForKids = true;
  if (params.blocked && params.blocked.length > 0) result.ownerId = { $nin: blocked };

  return result;
};

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const searchTerm = request.body.searchTerm;
    const page = request.body.page ? request.body.page : 1;
    const locationStr = request.body.location;

    const location =
      locationStr == undefined ? undefined : locationStr.split(",").map((str) => Number(str));
    const skip = page > 0 ? (page - 1) * Const.pagingRows : 0;

    const user = request.user;
    let kidsMode;
    const blocked = user.blocked || [];
    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    if (user) kidsMode = user.kidsMode;

    let countResult = {};

    // Search shops
    let shops = [];

    if (location) {
      shops = await User.aggregate([
        generateQueryObject({
          location,
          searchTerm,
          typeAcc: 1,
        }),
        {
          $sort: {
            "dist.calculated": 1,
          },
        },
        {
          $limit: Const.pagingRows + skip,
        },
        {
          $skip: skip,
        },
      ]).exec();
    } else {
      shops = await User.find(
        generateQueryObject({
          searchTerm,
          typeAcc: 1,
        }),
      )
        .select({
          _id: 1,
          name: 1,
          phoneNumber: 1,
          avatar: 1,
          bankAccounts: 1,
          location: 1,
          aboutBusiness: 1,
          businessCategory: 1,
          workingHours: 1,
          created: 1,
          isAppUser: 1,
        })
        .limit(Const.pagingRows)
        .skip(skip)
        .exec();
    }

    countResult.shops = await User.countDocuments(
      generateQueryObject({
        searchTerm,
        typeAcc: 1,
      }),
    );

    // Search products
    let products = [];

    if (location) {
      products = await Product.aggregate([
        generateQueryObject({
          location,
          searchTerm,
          kidsMode,
          blocked,
        }),
        {
          $sort: {
            "dist.calculated": 1,
          },
        },
        {
          $limit: Const.pagingRows + skip,
        },
        {
          $skip: skip,
        },
      ]).exec();
    } else {
      products = await Product.find(
        generateQueryObject({
          searchTerm,
          kidsMode,
          blocked,
        }),
      )
        .limit(Const.pagingRows)
        .skip(skip)
        .exec();

      products = products.map((obj) => obj.toObject());
    }

    countResult.products = await Product.countDocuments(
      generateQueryObject({
        searchTerm,
        kidsMode,
        blocked,
      }),
    );

    // get categories and owners Ids for each product
    let categoriesIds = [];
    let ownersId = [];
    let productsId = [];

    products = products.map((product) => {
      let productObj = product;

      productObj._id = product._id.toString();
      productObj.categoryId = product.categoryId.toString();
      productsId.push(productObj._id);

      categoriesIds.push(productObj.categoryId);
      ownersId.push(productObj.ownerId);

      return productObj;
    });

    // get categories and owners from db
    let categories = [];
    let owners = [];
    let reviews = [];

    categories = await Category.find({
      _id: {
        $in: categoriesIds,
      },
    }).exec();

    owners = await User.find({
      _id: {
        $in: ownersId,
      },
    })
      .select({
        _id: 1,
        name: 1,
        phoneNumber: 1,
        avatar: 1,
        bankAccounts: 1,
        location: 1,
        locationVisibility: 1,
        aboutBusiness: 1,
        businessCategory: 1,
        workingHours: 1,
        created: 1,
      })
      .exec();

    reviews = await Review.find({
      product_id: {
        $in: productsId,
      },
      user_id: request.user._id.toString(),
      isDeleted: false,
    }).exec();

    categories = categories.map((obj) => obj.toObject());
    owners = owners.map((obj) => obj.toObject());
    reviews = reviews.map((obj) => obj.toObject());

    // connect category and owner data with product
    products = products.map((obj) => {
      obj.category = categories.find((category) => category._id.toString() == obj.categoryId);
      obj.owner = owners.find((owner) => owner._id.toString() == obj.ownerId);
      obj.review = reviews.find((review) => review.product_id.toString() == obj._id);

      if (obj.review) {
        obj.review.name = request.user.name;
        obj.review.avatar = request.user.avatar;
        obj.review.phoneNumber = request.user.phoneNumber;
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

    // figure out is there is more data in db
    let hasNext = {};

    hasNext.shops = countResult.shops > skip + Const.pagingRows;
    hasNext.products = countResult.products > skip + Const.pagingRows;

    // prepare dataToSend
    let dataToSend = {};

    dataToSend.products = products;
    dataToSend.shops = shops;
    dataToSend.countResult = countResult;
    dataToSend.hasNext = hasNext;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("GetProductBySearchTerm", e);
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.errorResponse(response, Const.httpCodeServerError, "GetProductBySearchTerm", e);
    return;
  }
});

module.exports = router;
