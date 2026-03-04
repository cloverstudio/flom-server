"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { MarketingNotificationTemplate } = require("#models");
const { getUserIds } = require("../helpers");

/**
 * @api {post} /api/v2/marketing-notifications/templates Add new marketing notification template
 * @apiVersion 2.0.9
 * @apiName Add new marketing notification template
 * @apiGroup WebAPI Marketing Notification Template
 * @apiDescription API for creating new marketing notification template. There is always receivers parameter with empty array
 * unless you send userIds when creating template
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam {String} name Marketing notification template name
 * @apiParam {String} [title] Marketing notification title
 * @apiParam {String} [text] Marketing notification text
 * @apiParam {String} [userIds] List of userIds to who to send the notification separated by a comma. Optional if allSubscribers is 1
 * @apiParam {Number} [allSubscribers] 0 - false, 1 - true. userIds will be ignored if this parameter is set to 1
 * @apiParam {Number} [contentType] Type of the content: 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product, 6 - profile, 7 - marketplace
 * @apiParam {String} [contentId] Id of the content. Required only for content type from 1 to 5
 * @apiParam {String} [contentName] Name of the content.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635925162110,
 *   "data": {
 *     "marketingNotificationTemplate": {
 *       "receivers": [
 *         "5f7ee96ca283bc433d9d723a",
 *         "5fd0c8043796fc0fdbe5b5b5",
 *         "6101140dcbf8f756d06168fd",
 *         "6139cd7848c6c40f4dffb04a"
 *       ],
 *       "created": 1635924986184,
 *       "_id": "61823caa33b1083a21fc68f0",
 *       "name": "Template 1",
 *       "title": "Test title",
 *       "text": "Test text",
 *       "creatorId": "5f7ee464a283bc433d9d722f",
 *       "allSubscribers": 0,
 *       "contentType": 1,
 *       "contentId": "616ec172b752ad6dd2458987",
 *       "contentName": "616ec"
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
 * @apiError (Errors) 443415 No template name parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const requestUserId = request.user._id.toString();
    const { name, title, text, contentName } = request.body;
    let { contentId } = request.body;
    let contentType = +request.body.contentType || undefined;

    let allSubscribers;
    if (request.body.allSubscribers !== undefined) {
      allSubscribers = !!+request.body.allSubscribers;
    }

    if (!name) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoTemplateName,
        message: `MarketingNotificationTemplateController - add template, no name parameter`,
      });
    }

    let userIds;
    if (!allSubscribers) {
      userIds = (
        await getUserIds({
          requestUserId,
          allSubscribers,
          requestUserIds: request.body.userIds,
        })
      ).userIds;
    }

    if (Const.marketingNotificationsContentTypes.indexOf(contentType) === -1) {
      contentType = undefined;
    }
    if (contentId && !Utils.isValidObjectId(contentId)) {
      contentId = undefined;
    }

    const marketingNotificationTemplate = await MarketingNotificationTemplate.create({
      name,
      title,
      text,
      creatorId: requestUserId,
      allSubscribers,
      receivers: userIds,
      contentType,
      contentId,
      contentName,
    });

    const marketingNotificationTemplateObj = marketingNotificationTemplate.toObject();
    delete marketingNotificationTemplateObj.__v;

    Base.successResponse(response, Const.responsecodeSucceed, {
      marketingNotificationTemplate: marketingNotificationTemplateObj,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MarketingNotificationsTemplateController - add new template",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/marketing-notifications/templates Get my marketing notification templates list
 * @apiVersion 2.0.9
 * @apiName Get my marketing notification templates list
 * @apiGroup WebAPI Marketing Notification Template
 * @apiDescription API for getting list of marketing notifications templates you created
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam (Query string) {String} [search] Search text to search marketing notification titles
 * @apiParam (Query string) {String} [page] Page
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1636030910714,
 *   "data": {
 *     "marketingNotificationTemplates": [
 *       {
 *         "_id": "6183d9bd7c26c4c1f64ceb0e",
 *         "receivers": [],
 *         "created": 1636030909221,
 *         "name": "Template 1",
 *         "creatorId": "5f7ee464a283bc433d9d722f"
 *       },
 * 			 {
 *       "receivers": [
 *         "5f7ee96ca283bc433d9d723a",
 *         "5fd0c8043796fc0fdbe5b5b5",
 *         "6101140dcbf8f756d06168fd",
 *         "6139cd7848c6c40f4dffb04a"
 *       ],
 *       "created": 1635924986184,
 *       "_id": "61823caa33b1083a21fc68f0",
 *       "name": "Template 1",
 *       "title": "Test title",
 *       "text": "Test text",
 *       "creatorId": "5f7ee464a283bc433d9d722f",
 *       "allSubscribers": 0,
 *       "contentType": 1,
 *       "contentId": "616ec172b752ad6dd2458987",
 *       "contentName": "616e"
 *       }
 *     ],
 *     "total": 2,
 *     "hasNext": false
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const requestUserId = request.user._id.toString();
    const search = request.query.search;
    const page = +request.query.page || 1;

    const searchQuery = { creatorId: requestUserId };
    if (search && search !== "") {
      searchQuery["title"] = { $regex: new RegExp(search.toString()), $options: "i" };
    }

    const sortQuery = search && search !== "" ? { $score: 1 } : { created: -1 };

    const templates = await MarketingNotificationTemplate.find(searchQuery)
      .sort(sortQuery)
      .skip((page - 1) * Const.newPagingRows)
      .limit(Const.newPagingRows)
      .lean();

    const total = await MarketingNotificationTemplate.find(searchQuery).countDocuments();

    const templatesFormatted = templates.map((template) => {
      const { __v, ...rest } = template;
      return rest;
    });

    Base.successResponse(response, Const.responsecodeSucceed, {
      marketingNotificationTemplates: templatesFormatted,
      total,
      hasNext: page * Const.newPagingRows < total,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MarketingNotificationsTemplateController - templates list",
      error,
    });
  }
});

/**
 * @api {put} /api/v2/marketing-notifications/templates/:templateId Update marketing notification template
 * @apiVersion 2.0.9
 * @apiName Update marketing notification template
 * @apiGroup WebAPI Marketing Notification Template
 * @apiDescription API for updating marketing notification template
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiParam {String} [name] Marketing notification template name
 * @apiParam {String} [title] Marketing notification title
 * @apiParam {String} [text] Marketing notification text
 * @apiParam {String} [userIds] List of userIds to who to send the notification separated by a comma. Optional if allSubscribers is 1
 * @apiParam {Number} [allSubscribers] 0 - false, 1 - true. userIds will be ignored if this parameter is set to 1
 * @apiParam {Number} [contentType] Type of the content: 1 - video, 2 - video story, 3 - podcast, 4 - text story, 5 - product, 6 - profile, 7 - marketplace
 * @apiParam {String} [contentId] Id of the content. Required only for content type from 1 to 5
 * @apiParam {String} [contentName] Name of the content.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635925162110,
 *   "data": {
 *     "marketingNotificationTemplate": {
 *       "receivers": [
 *         "5f7ee96ca283bc433d9d723a",
 *         "5fd0c8043796fc0fdbe5b5b5",
 *         "6101140dcbf8f756d06168fd",
 *         "6139cd7848c6c40f4dffb04a"
 *       ],
 *       "created": 1635924986184,
 *       "_id": "61823caa33b1083a21fc68f0",
 *       "name": "Template 1",
 *       "title": "Test title",
 *       "text": "Test text",
 *       "creatorId": "5f7ee464a283bc433d9d722f",
 *       "allSubscribers": 0,
 *       "contentType": 1,
 *       "contentId": "616ec172b752ad6dd2458987",
 *       "contentName": "616e"
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
 * @apiError (Errors) 443416 Invalid templateId parameter
 * @apiError (Errors) 443417 Template with templateId not found
 * @apiError (Errors) 4000007 Token not valid
 */

router.put("/:templateId", auth({ allowUser: true }), async function (request, response) {
  try {
    const requestUserId = request.user._id.toString();
    const { templateId } = request.params;
    const { name, title, text, contentName } = request.body;
    let { contentId } = request.body;
    let contentType = +request.body.contentType || undefined;

    if (!Utils.isValidObjectId(templateId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTemplateId,
        message: `MarketingNotificationTemplateController - update template, invalid templateId parameter`,
      });
    }

    const template = await MarketingNotificationTemplate.findOne({
      _id: templateId,
      creatorId: requestUserId,
    });
    if (!template) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeTemplateNotFound,
        message: `MarketingNotificationTemplateController - update template, invalid templateId parameter`,
      });
    }

    if (name) {
      template.name = name;
    }
    if (title || title === "") {
      template.title = title;
    }
    if (text || text === "") {
      template.text = text;
    }
    if (contentName) {
      template.contentName = contentName;
    }

    let allSubscribers;
    if (request.body.allSubscribers !== undefined) {
      allSubscribers = !!+request.body.allSubscribers;
      template.allSubscribers = allSubscribers;
    }

    if (!allSubscribers) {
      const { userIds = [] } = await getUserIds({
        requestUserId,
        allSubscribers,
        requestUserIds: request.body.userIds,
      });
      template.receivers = userIds;
      template.markModified("userIds");
    }

    if (contentType && Const.marketingNotificationsContentTypes.indexOf(contentType) !== -1) {
      template.contentType = contentType;
    }
    if (contentId && Utils.isValidObjectId(contentId)) {
      template.contentId = contentId;
    }

    await template.save();

    const templateObj = template.toObject();
    delete templateObj.__v;

    Base.successResponse(response, Const.responsecodeSucceed, {
      marketingNotificationTemplate: templateObj,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MarketingNotificationsTemplateController - update template",
      error,
    });
  }
});

/**
 * @api {delete} /api/v2/marketing-notifications/templates/:templateId Delete marketing notification template
 * @apiVersion 2.0.9
 * @apiName Delete marketing notification template
 * @apiGroup WebAPI Marketing Notification Template
 * @apiDescription API for deleting marketing notification template
 *
 * @apiHeader {String} access-token Users unique access-token
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1635925162110,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 * }
 *
 * @apiError (Errors) 443416 Invalid templateId parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.delete("/:templateId", auth({ allowUser: true }), async function (request, response) {
  try {
    const requestUserId = request.user._id.toString();
    const { templateId } = request.params;

    if (!Utils.isValidObjectId(templateId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInvalidTemplateId,
        message: `MarketingNotificationTemplateController - delete template, invalid templateId parameter`,
      });
    }

    await MarketingNotificationTemplate.deleteOne({
      _id: templateId,
      creatorId: requestUserId,
    });

    Base.successResponse(response, Const.responsecodeSucceed, {});
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "MarketingNotificationsTemplateController - delete template",
      error,
    });
  }
});

module.exports = router;
