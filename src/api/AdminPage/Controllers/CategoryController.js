"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { Category } = require("#models");

/**
 * @api {post} /api/v2/admin-page/categories Admin page create category
 * @apiVersion 2.0.10
 * @apiName Admin page create category
 * @apiGroup WebAPI Admin page - Categories
 * @apiDescription API used for creating new category for flom_v1. Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}   	name				Name of the category
 * @apiParam {Number[]} 	group 			Array of groups for the category (1 - all, 2 - creators, 3 - merchants, 11 - video, 12 - video story,
 *                                    13 - podcast, 14 - text story, 15 - product)
 * @apiParam {String} 	  [parentId] 	Category id of the parent category. Defaults to "-1" which indicates parent category
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639566785977,
 *   "data": {
 *     "category": {
 *       "_id": "61b9cdc1700dde7eaf79a57e",
 *       "name": "Test",
 *       "group": 3,
 *       "parentId": "-1"
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
 * @apiError (Errors) 443235 No name parameter
 * @apiError (Errors) 443411 Parent id is not a valid id
 * @apiError (Errors) 443455 Parent not found
 * @apiError (Errors) 443456 No group parameter
 * @apiError (Errors) 443457 Invalid group parameter. Either parameter is not an array or the array contains invalid values
 * @apiError (Errors) 443458 Group not allowed. Group has to have one or more parent groups only (unless parent is group 1 - all).
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.post("/", auth({ allowAdmin: true, role: Const.Role.ADMIN }), async (request, response) => {
  try {
    const { name, parentId = "-1" } = request.body;
    let group = [];

    if (!name) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoName,
        message: `CategoryController - create category, no name parameter`,
      });
    }

    let parent;
    if (parentId !== "-1") {
      if (!Utils.isValidObjectId(parentId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidObjectId,
          message: `CategoryController - create category, invalid parent id`,
        });
      }

      parent = await Category.findOne({ _id: parentId }).lean();
      if (!parent) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeParentNotFound,
          message: `CategoryController - create category, parent not found`,
        });
      }
    }

    if (!request.body.group) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoGroup,
        message: `CategoryController - create category, no group parameter`,
      });
    } else {
      if (!Array.isArray(request.body.group)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidGroup,
          message: `CategoryController - create category, invalid groups parameter`,
        });
      }

      group = request.body.group
        .map((group) => +group)
        .filter((group) => Const.categoryGroups.indexOf(group) !== -1);

      if (request.body.group.length !== group.length) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidGroup,
          message: `CategoryController - create category, invalid groups parameter`,
        });
      }
    }

    function checkGroup({ parentGroup, childGroup }) {
      for (let i = 0; i < childGroup.length; i++) {
        const group = childGroup[i];
        if (parentGroup.indexOf(group) === -1) {
          return false;
        }
      }
      return true;
    }

    if (parent && parent.group !== Const.categoryGroupAll) {
      if (!checkGroup({ parentGroup: parent.group, childGroup: group })) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeGroupNotAllowed,
          message: `CategoryController - create category, group not allowed`,
        });
      }
    }

    const category = await Category.create({
      name,
      group,
      parentId,
    });
    const { __v, ...categoryData } = category.toObject();

    Base.successResponse(response, Const.responsecodeSucceed, { category: categoryData });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "CategoryController - create category",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/admin-page/categories/:categoryId Admin page update category
 * @apiVersion 2.0.10
 * @apiName Admin page update category
 * @apiGroup WebAPI Admin page - Categories
 * @apiDescription API used for updating category on flom_v1. Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam {String}   [name] 		Name of the category
 * @apiParam {Number[]} [group] 	Array of groups for the category (1 - all, 2 - creators, 3 - merchants, 11 - video, 12 - video story,
 *                                13 - podcast, 14 - text story, 15 - product)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1639569055529,
 *   "data": {
 *     "category": {
 *       "_id": "61b9d29a5f5e3c8bf8c11161",
 *       "name": "Test",
 *       "group": 1,
 *       "parentId": "-1"
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
 * @apiError (Errors) 400680 Category not found
 * @apiError (Errors) 443411 Category id is not a valid id
 * @apiError (Errors) 443457 Invalid group parameter. Either parameter is not an array or the array contains invalid values
 * @apiError (Errors) 4000007 Token not valid
 * @apiError (Errors) 5000001 Not authorized
 */

router.patch(
  "/:categoryId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { categoryId } = request.params;
      const { name } = request.body;

      if (!Utils.isValidObjectId(categoryId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidObjectId,
          message: `CategoryController - update category, invalid category id`,
        });
      }

      const category = await Category.findOne({ _id: categoryId });
      if (!category) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeCategoryNotFound,
          message: `CategoryController - update category, category not found`,
        });
      }

      if (name && name !== "") {
        category.name = name;
      }

      if (request.body.group) {
        if (!Array.isArray(request.body.group)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidGroup,
            message: `CategoryController - update category, invalid groups parameter`,
          });
        }

        const groups = request.body.group
          .map((group) => +group)
          .filter((group) => Const.categoryGroups.indexOf(group) !== -1);

        if (request.body.group.length !== groups.length) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidGroup,
            message: `CategoryController - update category, invalid groups parameter`,
          });
        }

        category.group = groups;
      }

      await category.save();

      const categoryObj = category.toObject();
      delete categoryObj.__v;

      Base.successResponse(response, Const.responsecodeSucceed, {
        category: categoryObj,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CategoryController - update category",
        error,
      });
    }
  },
);

/**
 * @api {delete} /api/v2/admin-page/categories/:categoryId Admin page delete category
 * @apiVersion 2.0.10
 * @apiName Admin page delete category
 * @apiGroup WebAPI Admin page - Categories
 * @apiDescription API used for deleting category on flom_v1. If category is a parent category then all children categories will be deleted.
 * Admin or super admin role required for access
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *   "code": 1,
 *   "time": 1632474824460,
 *   "data": {
 *     "deleted": true,
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
 * @apiError (Errors) 5000001 Not authorized
 */

router.delete(
  "/:categoryId",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { categoryId } = request.params;

      await Category.updateMany(
        { $or: [{ _id: categoryId }, { parentId: categoryId }] },
        { $set: { deleted: true } },
      );

      Base.successResponse(response, Const.responsecodeSucceed, {
        deleted: true,
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "CategoryController - delete category",
        error,
      });
    }
  },
);

module.exports = router;
