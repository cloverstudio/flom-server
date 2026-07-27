"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, businessTags, countries } = require("#config");
const { auth } = require("#middleware");
const Utils = require("#utils");
const Logics = require("#logics");
const {
  Category,
  Business,
  BusinessMember,
  BusinessInvite,
  User,
  Chain,
  SubChain,
  Outlet,
  Terminal,
  TerminalOperatorReference,
  Product,
} = require("#models");

/**
 * @api {get} /api/v2/businesses/me  Get users own businesses flom_v1
 * @apiVersion 2.0.34
 * @apiName Get users own businesses
 * @apiGroup WebAPI Business
 * @apiDescription Get users own businesses. Returns all businesses where the user is the owner or an assistant.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345724687,
 *     "data": {
 *         "businesses": [
 *             {
 *                 "_id": "6a4bb17dab58c78c74906cd6",
 *                 "name": "Petrov biznis",
 *                 "description": "mjesto za mene",
 *                 "status": "created",
 *                 "payoutStatus": "disabled",
 *                 "idStatus": "unverified",
 *                 "owner": {
 *                     "_id": "641d9c333478cf0d6a500547",
 *                     "phoneNumber": "+385958710207"
 *                 },
 *                 "market": "NG",
 *                 "tagIds": ["tag1", "tag2", "tag3"],
 *                 "tags": [
 *                    {
 *                      "id": "tag1",
 *                      "display": { "en-NG": "Makeup & Beauty" },
 *                      "enabledInMarket": true
 *                    }
 *                 ],
 *                 "created": 1783345533103,
 *                 "lastActive": 1783345533103,
 *                 "createdAt": "2026-07-06T13:45:33.118Z",
 *                 "updatedAt": "2026-07-06T13:45:33.118Z",
 *                 "__v": 0
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

router.get("/me", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;

    const members = await BusinessMember.find({
      userId: user._id.toString(),
      status: { $in: ["active"] },
    }).lean();

    const businesses = await Business.find({
      _id: { $in: members.map((m) => m.businessId) },
    })
      .sort({ lastActive: -1 })
      .lean();

    Base.successResponse(response, Const.responsecodeSucceed, { businesses });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, list businesses",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/businesses/:businessId  Get business flom_v1
 * @apiVersion 2.0.34
 * @apiName Get business
 * @apiGroup WebAPI Business
 * @apiDescription Get business by Id.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345670376,
 *     "data": {
 *         "business": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "payoutStatus": "disabled",
 *             "idStatus": "unverified",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "market": "NG",
 *             "tagIds": ["tag1", "tag2", "tag3"],
 *             "tags": [
 *                {
 *                  "id": "tag1",
 *                  "display": { "en-NG": "Makeup & Beauty", "default": "Makeup & Beauty" },
 *                  "enabledInMarket": true
 *                }
 *             ],
 *             "created": 1783345533103,
 *             "lastActive": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "outlets": [ {
 *                    "_id": "6a4bb17dab58c78c74906cd6",
 *                    "businessId": "6a4bb17dab58c78c74906cd6",
 *                    "chainId": "6a4bb17dab58c78c74906cd6",
 *                    "subChainId": "6a4bb17dab58c78c74906cd6",
 *                    "name": "Petrov outlet",
 *                    "address": {
 *                        "country": "Croatia",
 *                        "countryCode": "HR",
 *                        "city": "Split",
 *                        "road": "Jobova",
 *                        "houseNumber": "14",
 *                        "postCode": "21000",
 *                        "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *                    },
 *                    "schedule": {
 *                        "description": "Open every day except holidays",
 *                        "weekly": {
 *                            "0": {
 *                                "enabled": false,
 *                                "periods": [ { "start": 540, "end": 660 } ]
 *                            },
 *                        },
 *                        "exceptions": [
 *                           {
 *                             "date": "2026-12-25",
 *                             "enabled": false,
 *                             "periods": [],
 *                             "description": "Christmas Day"
 *                           },
 *                           {
 *                             "date": "2026-08-15",
 *                             "enabled": true,
 *                             "periods": [
 *                               { "start": 540, "end": 660 }
 *                             ],
 *                             "description": "Assumption of Mary"
 *                           }
 *                       ]
 *                    },
 *                    "created": 1783345533103,
 *                    "createdAt": "2026-07-06T13:45:33.118Z",
 *                    "updatedAt": "2026-07-06T13:45:33.118Z",
 *                    "terminals": [
 *                      {
 *                         "_id": "6a4bb17dab58c78c74906cd6",
 *                         "businessId": "6a4bb17dab58c78c74906cd6",
 *                         "outletId": "6a4bb17dab58c78c74906cd6",
 *                         "chainId": "6a4bb17dab58c78c74906cd6",
 *                         "subChainId": "6a4bb17dab58c78c74906cd6",
 *                         "paymentAddress": "1234567890",
 *                         "isActive": true,
 *                         "created": 1783345533103,
 *                         "operator": {
 *                             "_id": "641d9c333478cf0d6a500547",
 *                             "name": "John Doe",
 *                             "userName": "johndoe",
 *                             "firstName": "John",
 *                             "lastName": "Doe",
 *                             "phoneNumber": "+385958710207",
 *                             "avatar": {},
 *                             "created": 1783345533103
 *                         },
 *                      }
 *                    ],
 *                }
 *             ],
 *             "members": [
 *               {
 *                  "_id": "641d9c333478cf0d6a500547",
 *                  "businessId": "6a4bb17dab58c78c74906cd6",
 *                  "userId": "641d9c333478cf0d6a500547",
 *                  "firstName": "John",
 *                  "lastName": "Doe",
 *                  "phoneNumber": "+385958710207",
 *                  "inviteId": "641d9c333478cf0d6a500547",
 *                  "role": "manager", // owner, manager, helper
 *                  "status": "invited", // invited, active, inactive, removed
 *                  "created": 1783345533103,
 *                  "user": {
 *                      "_id": "641d9c333478cf0d6a500547",
 *                      "name": "John Doe",
 *                      "userName": "johndoe",
 *                      "firstName": "John",
 *                      "lastName": "Doe",
 *                      "phoneNumber": "+385958710207",
 *                      "avatar": {},
 *                      "created": 1783345533103
 *                  },
 *                  "invite": {
 *                      "_id": "641d9c333478cf0d6a500547",
 *                      "businessId": "6a4bb17dab58c78c74906cd6",
 *                      "userId": "641d9c333478cf0d6a500547",
 *                      "role": "manager", // role - helper, manager
 *                      "status": "pending", // pending, accepted, rejected, revoked, expired
 *                      "invitedById": "641d9c333478cf0d6a500547",
 *                      "invitedAt": 1783345533103,
 *                      "expiresAt": 1783345533103,
 *                      "respondedAt": 1783345533103,
 *                      "revokedAt": 1783345533103,
 *                      "created": 1783345533103
 *                  }
 *               }
 *             ],
 *             "services": [
 * 				        {
 *                   "_id": "6a569f265deda20265771cda",
 *                   "businessId": "6a561fa0fd66633a96932d37",
 *                   "name": "šišanje",
 *                   "description": "brbrbrbrrrrr",
 *                   "originalPrice": {
 *                       "countryCode": "HR",
 *                       "currency": "EUR",
 *                       "value": 100,
 *                       "minValue": -1,
 *                       "maxValue": -1,
 *                       "singleValue": -1,
 *                       "unlimitedValue": -1,
 *                       "exclusiveValue": -1
 *                   },
 *                   "isDeleted": false,
 *                   "numberOfReviews": 0,
 *                   "numberOfViews": 0,
 *                   "numberOfLikes": 0,
 *                   "moderation": {
 *                       "status": 1
 *                   },
 *                   "type": 6,
 *                   "hashtags": [],
 *                   "appropriateForKids": false,
 *                   "visibility": "public",
 *                   "tribeIds": [],
 *                   "communityIds": [],
 *                   "featured": {
 *                       "isFeatured": false,
 *                       "countryCode": "default",
 *                       "created": 1784061734995
 *                   },
 *                   "allowPublicComments": false,
 *                   "availableForExpo": false,
 *                   "usedInExpoCount": 0,
 *                   "oldSlugs": [],
 *                   "created": 1784061734995,
 *                   "modified": 1784061734995,
 *                   "file": [],
 *                   "image": [],
 *                   "audiosForExpo": [],
 *                   "contentPurchaseHistory": [],
 *                   "reservations": [],
 *                }
 *             ]
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/:businessId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId } = request.params;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "BusinessController, get business - invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "BusinessController, get business - business not found",
      });
    }

    const services = await Product.find({
      businessId,
      isDeleted: false,
      type: Const.productTypeService,
    }).lean();

    business.services = services;

    const businessMembers = await BusinessMember.find({ businessId }).lean();

    const userIds = businessMembers.map((member) => member.userId);
    const users = await User.find(
      { _id: { $in: userIds } },
      {
        _id: 1,
        name: 1,
        userName: 1,
        phoneNumber: 1,
        avatar: 1,
        created: 1,
        firstName: 1,
        lastName: 1,
      },
      { lean: true },
    );
    const usersMap = {};
    users.forEach((user) => {
      usersMap[user._id.toString()] = user;
    });

    businessMembers.forEach((member) => {
      member.user = usersMap[member.userId.toString()] || null;
    });

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      business,
      action: "business:view",
    });

    if (allowed) {
      const outlets = await Outlet.find({ businessId }).lean();
      business.outlets = outlets;

      const terminals = await Terminal.find({ businessId }).lean();
      const terminalIds = terminals.map((t) => t._id.toString());
      const terminalOperatorReferences = await TerminalOperatorReference.find({
        terminalId: { $in: terminalIds },
        startTimeStamp: { $exists: true },
        endTimeStamp: { $exists: false },
      }).lean();

      const terminalToOperatorMap = {};
      terminalOperatorReferences.forEach((ref) => {
        terminalToOperatorMap[ref.terminalId.toString()] = ref.userId;
      });

      terminals.forEach((terminal) => {
        const userId = terminalToOperatorMap[terminal._id.toString()];
        if (userId) {
          const member =
            businessMembers.find((member) => member.userId.toString() === userId) || null;

          if (member) {
            terminal.operator = {
              _id: member.userId,
              name: member.user.name,
              userName: member.user.userName,
              firstName: member.firstName || member.user.firstName,
              lastName: member.lastName || member.user.lastName,
              phoneNumber: member.user.phoneNumber,
              avatar: member.user.avatar,
              created: member.user.created,
            };
          }
        }
      });

      const terminalsByOutlet = terminals.reduce((acc, terminal) => {
        if (!acc[terminal.outletId]) {
          acc[terminal.outletId] = [];
        }
        acc[terminal.outletId].push(terminal);
        return acc;
      }, {});

      business.outlets.forEach((outlet) => {
        outlet.terminals = terminalsByOutlet[outlet._id.toString()] || [];
      });
    }

    const allowed2 = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      business,
      action: "members:view",
    });

    if (allowed2) {
      const inviteIds = businessMembers.map((member) => member.inviteId);
      const invites = await BusinessInvite.find({ _id: { $in: inviteIds } }).lean();
      const invitesMap = {};
      invites.forEach((invite) => {
        invitesMap[invite._id.toString()] = invite;
      });

      businessMembers.forEach((member) => {
        if (member.role !== "owner" && member.inviteId) {
          member.invite = invitesMap[member.inviteId.toString()] || null;
        }
      });

      business.members = businessMembers;
    }

    Base.successResponse(response, Const.responsecodeSucceed, { business });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, get business",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/businesses Create business flom_v1
 * @apiVersion 2.0.34
 * @apiName Create business
 * @apiGroup WebAPI Business
 * @apiDescription Create a new business.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     name                    Business name
 * @apiParam {String}     description             Business description
 * @apiParam {String}     [market]                Business market (country code - HR, NG, US) - defaults to owner's country code
 * @apiParam {String[]}   [tagIds]                Tag ids for the business (array of tag IDs)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345670376,
 *     "data": {
 *         "business": {
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "payoutStatus": "disabled",
 *             "idStatus": "unverified",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "market": "NG",
 *             "tagIds": ["tag1", "tag2", "tag3"],
 *             "tags": [
 *                {
 *                  "id": "tag1",
 *                  "display": { "en-NG": "Makeup & Beauty", "default": "Makeup & Beauty" },
 *                  "enabledInMarket": true
 *                }
 *             ],
 *             "created": 1783345533103,
 *             "lastActive": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "outlets": [ {
 *                    "_id": "6a4bb17dab58c78c74906cd6",
 *                    "businessId": "6a4bb17dab58c78c74906cd6",
 *                    "chainId": "6a4bb17dab58c78c74906cd6",
 *                    "subChainId": "6a4bb17dab58c78c74906cd6",
 *                    "name": "Petrov outlet",
 *                    "address": {
 *                        "country": "Croatia",
 *                        "countryCode": "HR",
 *                        "city": "Split",
 *                        "road": "Jobova",
 *                        "houseNumber": "14",
 *                        "postCode": "21000",
 *                        "displayName": "14, Jobova, Poljud, Split, Split-Dalmatia County, 21000, Croatia"
 *                    },
 *                    "schedule": {
 *                        "description": "Open every day except holidays",
 *                        "weekly": {
 *                            "0": {
 *                                "enabled": false,
 *                                "periods": [ { "start": 540, "end": 660 } ]
 *                            },
 *                        },
 *                        "exceptions": [
 *                           {
 *                             "date": "2026-12-25",
 *                             "enabled": false,
 *                             "periods": [],
 *                             "description": "Christmas Day"
 *                           },
 *                           {
 *                             "date": "2026-08-15",
 *                             "enabled": true,
 *                             "periods": [
 *                               { "start": 540, "end": 660 }
 *                             ],
 *                             "description": "Assumption of Mary"
 *                           }
 *                       ]
 *                    },
 *                    "created": 1783345533103,
 *                    "createdAt": "2026-07-06T13:45:33.118Z",
 *                    "updatedAt": "2026-07-06T13:45:33.118Z",
 *                    "__v": 0
 *                }
 *             ],
 *             "terminals": [
 *               {
 *                  "_id": "6a4bb17dab58c78c74906cd6",
 *                  "businessId": "6a4bb17dab58c78c74906cd6",
 *                  "outletId": "6a4bb17dab58c78c74906cd6",
 *                  "chainId": "6a4bb17dab58c78c74906cd6",
 *                  "subChainId": "6a4bb17dab58c78c74906cd6",
 *                  "paymentAddress": "1234567890",
 *                  "isMainTerminal": false,
 *                  "isActive": false,
 *                  "created": 1783345533103,
 *                  "createdAt": "2026-07-06T13:45:33.118Z",
 *                  "updatedAt": "2026-07-06T13:45:33.118Z",
 *                  "__v": 0
 *               }
 *             ],
 *             "members": [
 *               {
 *                  "_id": "641d9c333478cf0d6a500547",
 *                  "businessId": "6a4bb17dab58c78c74906cd6",
 *                  "userId": "641d9c333478cf0d6a500547",
 *                  "role": "owner", // owner, manager, helper
 *                  "status": "pending",
 *                  "invitedById": "641d9c333478cf0d6a500547",
 *                  "created": 1783345533103,
 *                  "user": {
 *                      "_id": "641d9c333478cf0d6a500547",
 *                      "name": "John Doe",
 *                      "userName": "johndoe",
 *                      "phoneNumber": "+385958710207",
 *                      "avatar": {},
 *                      "created": 1783345533103
 *                  }
 *               }
 *             ],
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443856 Invalid business name
 * @apiError (Errors) 443972 Invalid business description
 * @apiError (Errors) 443979 Invalid business market
 * @apiError (Errors) 443980 Invalid business tag
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { name, description, market, tagIds = [] } = request.body;

    const info = {};

    if (!name || typeof name !== "string" || name.length < 3 || name.length > 100) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidName,
        message: "BusinessController, create business - invalid name",
      });
    }
    info.name = name;

    if (
      !description ||
      typeof description !== "string" ||
      description.length < 3 ||
      description.length > 1000
    ) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidDescription,
        message: "BusinessController, create business - invalid description",
      });
    }
    info.description = description;

    if (market) {
      if (!countries[market]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidMarket,
          message: "BusinessController, create business - invalid market",
        });
      }

      info.market = market;
    } else {
      info.market = user.countryCode;
    }

    if (tagIds && !Array.isArray(tagIds)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTag,
        message: "BusinessController, create business - tagIds must be an array",
      });
    }

    if (tagIds.length > 0) {
      const tagMap = {};

      businessTags.forEach((t) => {
        tagMap[t.id] = t;
      });

      tagIds.forEach((t) => {
        if (!tagMap[t]) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTag,
            message: "BusinessController, create business - invalid tag ID",
          });
        }

        if (tagMap[t].regulated) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTag,
            message: "BusinessController, create business - regulated tag ID not allowed",
          });
        }
      });

      info.tagIds = tagIds;
    }

    const business = await Logics.createBusiness({ owner: user, info });

    Base.successResponse(response, Const.responsecodeSucceed, { business });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, create business",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/businesses/:businessId  Update business flom_v1
 * @apiVersion 2.0.34
 * @apiName Update business
 * @apiGroup WebAPI Business
 * @apiDescription Update a business. Only owner or assistants can update the business details.
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}     [name]                  Business name
 * @apiParam {String}     [description]           Business description
 * @apiParam {String}     [market]                Business market (country code - HR, NG, US) - defaults to owner's country code
 * @apiParam {String[]}   [tagIds]                Tag ids for the business (array of tag IDs) (send full array of tagIds, the old ones will be replaced with the new ones)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1783345533159,
 *     "data": {
 *         "business": {
 *             "name": "Petrov biznis",
 *             "description": "mjesto za mene",
 *             "status": "created",
 *             "payoutStatus": "disabled",
 *             "idStatus": "unverified",
 *             "owner": {
 *                 "_id": "641d9c333478cf0d6a500547",
 *                 "phoneNumber": "+385958710207"
 *             },
 *             "market": "NG",
 *             "tagIds": ["tag1", "tag2", "tag3"],
 *             "tags": [
 *                {
 *                  "id": "tag1",
 *                  "display": { "en-NG": "Makeup & Beauty", "default": "Makeup & Beauty" },
 *                  "enabledInMarket": true
 *                }
 *             ],
 *             "_id": "6a4bb17dab58c78c74906cd6",
 *             "created": 1783345533103,
 *             "lastActive": 1783345533103,
 *             "createdAt": "2026-07-06T13:45:33.118Z",
 *             "updatedAt": "2026-07-06T13:45:33.118Z",
 *             "__v": 0
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443970 Invalid business id
 * @apiError (Errors) 443971 Business not found
 * @apiError (Errors) 443858 User is not allowed to complete the action
 * @apiError (Errors) 443856 Invalid business name
 * @apiError (Errors) 443972 Invalid business description
 * @apiError (Errors) 443979 Invalid business market
 * @apiError (Errors) 443980 Invalid business tag
 * @apiError (Errors) 4000007 Token not valid
 */

router.patch("/:businessId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { businessId } = request.params;
    const { name, description, market, tagIds = [] } = request.body;

    if (!businessId || !Utils.isValidObjectId(businessId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidBusinessId,
        message: "BusinessController, update business - invalid businessId",
      });
    }

    const business = await Business.findById(businessId).lean();

    if (!business) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeBusinessNotFound,
        message: "BusinessController, update business - business not found",
      });
    }

    const allowed = await Logics.checkBusinessPermissions({
      userId: user._id.toString(),
      business,
      action: "business:profile",
    });

    if (!allowed) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeUserNotAllowed,
        message:
          "BusinessController, update business - user is not allowed to update the business profile",
      });
    }

    const updateObj = { lastActive: Date.now() };

    if (name) {
      if (typeof name !== "string" || name.length < 3 || name.length > 100) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidName,
          message: "BusinessController, update business - invalid name",
        });
      }
      updateObj.name = name;
    }

    if (description) {
      if (typeof description !== "string" || description.length < 3 || description.length > 1000) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidDescription,
          message: "BusinessController, update business - invalid description",
        });
      }
      updateObj.description = description;
    }

    if (market) {
      if (!countries[market]) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidMarket,
          message: "BusinessController, update business - invalid market",
        });
      }

      updateObj.market = market;
    }

    if (tagIds && !Array.isArray(tagIds)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTag,
        message: "BusinessController, update business - tagIds must be an array",
      });
    }

    if (tagIds.length > 0) {
      const tagMap = {};

      businessTags.forEach((t) => {
        tagMap[t.id] = t;
      });

      tagIds.forEach((t) => {
        if (!tagMap[t]) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTag,
            message: "BusinessController, update business - invalid tag ID",
          });
        }

        if (tagMap[t].regulated) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTag,
            message: "BusinessController, update business - regulated tag ID not allowed",
          });
        }
      });

      updateObj["tagIds"] = tagIds;
    }

    const updatedBusiness = await Business.findByIdAndUpdate(businessId, updateObj, {
      new: true,
      lean: true,
    });

    Base.successResponse(response, Const.responsecodeSucceed, { business: updatedBusiness });
  } catch (error) {
    return Base.newErrorResponse({
      response,
      code: Const.httpCodeServerError,
      message: "BusinessController, update business",
      error,
    });
  }
});

module.exports = router;
