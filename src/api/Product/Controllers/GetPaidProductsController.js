"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Product, Category, User, Transaction, Message, Review } = require("#models");

/**
      * @api {post} /api/v2/product/paid/ Get Paid Products
      * @apiName Get Paid Products
      * @apiGroup WebAPI
      * @apiDescription Get Paid Products
      * 
      * @apiHeader {String} access-token Users unique access-token.
      * 
      * @apiParam {String} page page - number
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
                                    "originalName": "IMAGE_20190411_174419_193.jpg",
                                    "size": 4108307,
                                    "mimeType": "image/png",
                                    "nameOnServer": "2BBdJ01o9P19YYWxjb9nMQKOyV6OrcvL",
                                    "duration": 0
                                },
                                "thumb": {
                                    "originalName": "IMAGE_20190411_174419_193.jpg",
                                    "size": 108579,
                                    "mimeType": "image/jpeg",
                                    "nameOnServer": "aSWciN0xX80kKQBlhBYFhkl0Jzn7UXuO"
                                },
                                "_id": "5caf6efae9ad4e2e953cb2a4",
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
                        "_id": "5caf6efae9ad4e2e953cb2a3",
                        "name": "Nail Salons",
                        "categoryId": "5ca458e731780ea12c79f6ad",
                        "description": "The Nail Studio ",
                        "price": 100,
                        "ownerId": "5caf6335e9ad4e2e953cb287",
                        "created": 1555001082709,
                        "status": 1,
                        "__v": 0,
                        "category": {
                            "_id": "5ca458e731780ea12c79f6ad",
                            "name": "Nail Studio",
                            "parentId": "5ca44c5b08f8045e4e3471d6"
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
                                    "originalName": "scaled_T-004.jpg",
                                    "size": 353501,
                                    "mimeType": "image/png",
                                    "nameOnServer": "mzyBzd7g2bzpiXTwyBEdbokauMOYjyCX"
                                },
                                "thumbnail": {
                                    "originalName": "scaled_T-004.jpg",
                                    "size": 41665,
                                    "mimeType": "image/png",
                                    "nameOnServer": "SEPETfvmW3TDuXFaj2e9NhTZ6DOW63Da"
                                }
                            },
                            "bankAccounts": [
                                {
                                    "_id": "5cb49137e9ad4e2e953cb38f",
                                    "merchantCode": "40208813",
                                    "name": "",
                                    "accountNumber": "1543872671271",
                                    "code": "",
                                    "selected": false
                                }
                            ],
                            "location": {
                                "coordinates": []
                            },
                            "locationVisibility": false,
                            "businessCategory": {
                                "id": "5ca44ca808f8045e4e3471d8",
                                "name": "Essential Services"
                            },
                            "_id": "5caf6335e9ad4e2e953cb287",
                            "name": "Barbers Shop",
                            "created": 1554998069354,
                            "phoneNumber": "+2348130717898"
                        }
                    }
                ],
                "countResult": 1,
                "hasNext": false
                }
    }
            
    **/

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const userId = request.user.id;
    const page = request.body.page ? request.body.page : 1;
    const skip = page > 0 ? (page - 1) * Const.pagingRows : 0;

    const { userRate, userCountryCode, userCurrency, conversionRates } =
      await Utils.getUsersConversionRate({
        user: request.user,
        accessToken: request.headers["access-token"],
      });

    let countResult = {};

    const transactions = await Transaction.find({
      senderId: userId,
      completed: true,
      type: 1,
    }).exec();

    const productIds = transactions.map((transaction) => transaction.productId);
    const receiptIds = [];

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      if (transaction.receiptMessageId !== undefined) {
        receiptIds.push(transaction.receiptMessageId);
      }
    }

    let products = await Product.find({
      _id: {
        $in: productIds,
      },
      isDeleted: false,
    })
      .limit(Const.pagingRows)
      .skip(skip)
      .exec();

    let receipts = await Message.find({
      _id: {
        $in: receiptIds,
      },
    })
      .limit(Const.pagingRows)
      .skip(skip)
      .exec();

    receipts = receipts.map((receipt) => receipt.toObject());

    countResult = await Product.countDocuments({
      _id: {
        $in: productIds,
      },
      isDeleted: false,
    });

    // get categories and owners Ids for each product
    let categoriesIds = [];
    let ownersId = [];
    let productsId = [];

    products = products.map((product) => {
      let productObj = product.toObject();

      //productObj._id = product._id.toString();
      productObj.categoryId = product.categoryId.toString();

      categoriesIds.push(productObj.categoryId);
      ownersId.push(productObj.ownerId);
      productsId.push(productObj._id);

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
      .select(Const.userSelectQuery)
      .exec();

    reviews = await Review.find({
      product_id: {
        $in: productsId,
      },
      user_id: userId,
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

      return obj;
    });

    // figure out is there is more data in db
    let hasNext = {};

    hasNext = countResult > skip + Const.pagingRows;

    // prepare dataToSend
    let dataToSend = {};

    dataToSend.products = transactions.map((transaction) => {
      let product = products.find((product) => product._id.toString() == transaction.productId);

      Utils.addUserPriceToProduct({
        product,
        userRate,
        userCountryCode,
        userCurrency,
        conversionRates,
      });

      // TODO: decide on receipt's props
      //product.receipt = receipts.find(receipt => receipt._id.toString() == transaction.receiptMessageId);

      return product;
    });

    dataToSend.countResult = countResult;
    dataToSend.hasNext = hasNext;

    Base.successResponse(response, Const.responsecodeSucceed, dataToSend);
  } catch (e) {
    if (e.name == "CastError") {
      logger.error("GetPaidProducts", e);
      return Base.successResponse(response, Const.responsecodeProductWrongProductIdFormat);
    }
    Base.errorResponse(response, Const.httpCodeServerError, "GetPaidProducts", e);
    return;
  }
});

module.exports = router;
