"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const { User } = require("#models");
const crypto = require("crypto");
const path = require("path");
const { resize: easyimgResize } = require("easyimage");
const fs = require("fs");

/**
 * @api {get} /api/v2/user/social-media Get social media list for user flom_v1
 * @apiVersion 2.0.10
 * @apiName  Get social media list for user flom_v1
 * @apiGroup WebAPI User - Social Media
 * @apiDescription  Get social media list for user
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1683120414631,
 *     "data": {
 *         "socialMediaLinks": [
 *             {
 *                 "id": "821385b761ce7159282ae632",
 *                 "title": "Hello worlddddddddddddd",
 *                 "url": "https://www.hello-world.com/hellooooooo",
 *                 "thumbnail": {
 *                     "originalFileName": "EasyImage-wLSpbl6E.webp",
 *                     "nameOnServer": "EasyImage-wLSpbl6E.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1340,
 *                     "height": 75,
 *                     "width": 75,
 *                     "aspectRatio": 1
 *                 },
 *                 "order": 1
 *             },
 *             {
 *                 "id": "4daa962669fa9a040260d929",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "EasyImage-PvxX95Sy.webp",
 *                     "nameOnServer": "EasyImage-PvxX95Sy.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1340,
 *                     "height": 75,
 *                     "width": 75,
 *                     "aspectRatio": 1
 *                 },
 *                 "order": 2
 *             },
 *             {
 *                 "id": "85fd31a4b4d9741c511942df",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "EasyImage-_sKrW5xr.webp",
 *                     "nameOnServer": "EasyImage-_sKrW5xr.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1340,
 *                     "height": 75,
 *                     "width": 75,
 *                     "aspectRatio": 1
 *                 },
 *                 "order": 3
 *             },
 *             {
 *                 "id": "a6f2d6bd8b5b52bcb5130882",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "EasyImage-HM0KEknF.webp",
 *                     "nameOnServer": "EasyImage-HM0KEknF.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1340,
 *                     "height": 75,
 *                     "width": 75,
 *                     "aspectRatio": 1
 *                 },
 *                 "order": 4
 *             },
 *             {
 *                 "id": "bcd63820cd096af7a3c619a0",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "nameOnServer": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1146,
 *                     "height": 38,
 *                     "width": 75,
 *                     "aspectRatio": 0.5066666666666667
 *                 },
 *                 "order": 5
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
 * @apiError (Errors) 4000007 Token invalid
 */

router.get("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const { user } = request;

    Base.successResponse(response, Const.responsecodeSucceed, {
      socialMediaLinks: user.socialMediaLinks ?? [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSocialMediaController, GET List",
      error,
    });
  }
});

/**
 * @api {post} /api/v2/user/social-media Create social media link flom_v1
 * @apiVersion 2.0.10
 * @apiName  Create social media link flom_v1
 * @apiGroup WebAPI User - Social Media
 * @apiDescription  Create social media link
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} title      Title/name of social media
 * @apiParam {String} url        URL for social media link
 * @apiParam {File}   [image]    Image for social media link
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1683120414631,
 *     "data": {
 *         "socialMediaLinks": [
 *             {
 *                 "id": "bcd63820cd096af7a3c619a0",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "nameOnServer": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1146,
 *                     "height": 38,
 *                     "width": 75,
 *                     "aspectRatio": 0.5066666666666667
 *                 },
 *                 "order": 1
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
 * @apiError (Errors) 443810 No social media title
 * @apiError (Errors) 443811 No social media URL
 * @apiError (Errors) 443812 Social media link already exists
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async (request, response) => {
  try {
    const { user } = request;
    const socialMediaArray = user.socialMediaLinks || [];

    if (request.headers["content-type"].indexOf("multipart") === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInputNotMultipart,
        message: `UserSocialMediaController, POST - input is not multipart form data`,
      });
    }

    const { fields = {}, files = {} } = await Utils.formParse(request, {
      keepExtensions: true,
      type: "multipart",
      multiples: true,
      uploadDir: Config.uploadPath,
    });

    const { title, url } = fields;
    const { image } = files;

    if (!title) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoSocialMediaTitle,
        message: `UserSocialMediaController, POST - no social media title`,
      });
    }
    if (!url) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeNoSocialMediaURL,
        message: `UserSocialMediaController, POST - no social media url`,
      });
    }

    const alreadyExists = socialMediaArray.reduce((acc, curr) => {
      if (curr.title === title) acc += 1;
    }, 0);

    if (!!alreadyExists) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSocialMediaAlreadyExists,
        message: `UserSocialMediaController, POST - social media already exists`,
      });
    }

    let thumbnail;
    if (image) {
      const mimeType = image.type;

      if (mimeType.indexOf("image") === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeOnlyImageFilesAllowed,
          message: `UserSocialMediaController, POST - only image files allowed`,
        });
      }

      const { fileData, code } = await Utils.handleImageFile(image);
      if (code === 123) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeExtensionNotAllowed,
          message: `UserSocialMediaController, POST - image extension not allowed`,
        });
      }

      thumbnail = await createThumb(fileData);
    }

    let maxOrder = 0;
    socialMediaArray.forEach((media) => {
      if (media.order > maxOrder) maxOrder = media.order;
    });

    const newSocialMediaObj = {
      id: crypto.randomBytes(12).toString("hex"),
      title,
      url,
      thumbnail: thumbnail,
      order: maxOrder + 1,
    };
    socialMediaArray.push(newSocialMediaObj);

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { socialMediaLinks: socialMediaArray },
      { new: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      socialMediaLinks: updatedUser.socialMediaLinks || [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSocialMediaController, POST",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/user/social-media/:id Update social media link flom_v1
 * @apiVersion 2.0.10
 * @apiName  Update social media link flom_v1
 * @apiGroup WebAPI User - Social Media
 * @apiDescription  Update social media link
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiParam {String} [title]        Title/name of social media
 * @apiParam {String} [url]          URL for social media link
 * @apiParam {File}   [image]        Image for social media link
 * @apiParam {Number} [removeImage]  Remove image from social media link (if 0/null/undefined image will NOT be removed, if any other number it will)
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1683120414631,
 *     "data": {
 *         "socialMediaLinks": [
 *             {
 *                 "id": "bcd63820cd096af7a3c619a0",
 *                 "title": "Hello worldddddddd",
 *                 "url": "https://www.hello-world.com/helloooooooo",
 *                 "thumbnail": {
 *                     "originalFileName": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "nameOnServer": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1146,
 *                     "height": 38,
 *                     "width": 75,
 *                     "aspectRatio": 0.5066666666666667
 *                 },
 *                 "order": 1
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
 * @apiError (Errors) 443813 Social media link not found
 * @apiError (Errors) 443606 Image file input error
 * @apiError (Errors) 443607 Only image files allowed
 * @apiError (Errors) 443609 Image file extension/type not allowed
 * @apiError (Errors) 443615 Input is not multipart form data
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:id", auth({ allowUser: true }), async (request, response) => {
  try {
    const { user } = request;
    const socialMediaArray = user.socialMediaLinks;
    const id = request.params.id;

    const socialMedia = user.socialMediaLinks.filter((media) => media.id === id)[0];

    if (!socialMedia) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSocialMediaDoesNotExist,
        message: `UserSocialMediaController, PATCH - social media does not exist`,
      });
    }

    if (request.headers["content-type"].indexOf("multipart") === -1) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeInputNotMultipart,
        message: `UserSocialMediaController, PATCH - input is not multipart form data`,
      });
    }

    const { fields = {}, files = {} } = await Utils.formParse(request, {
      keepExtensions: true,
      type: "multipart",
      multiples: true,
      uploadDir: Config.uploadPath,
    });

    if (Object.keys(fields) === 0 && Object.keys(files) === 0) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        socialMediaLinks: user.socialMediaLinks || [],
      });
    }

    const { title, url } = fields;
    const removeImage = !!+fields.removeImage;
    const { image } = files;
    const updatedObject = socialMedia;

    if (title) updatedObject.title = title;
    if (url) updatedObject.url = url;

    if (removeImage) {
      const { thumbnail } = updatedObject;

      const thumbPath = path.resolve(Config.uploadPath, thumbnail.nameOnServer);
      fs.unlinkSync(thumbPath);

      delete updatedObject.thumbnail;
    }

    if (image) {
      const mimeType = image.type;

      if (mimeType.indexOf("image") === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeOnlyImageFilesAllowed,
          message: `UserSocialMediaController, PATCH - only image files allowed`,
        });
      }

      const { fileData, code } = await Utils.handleImageFile(image);
      if (code === 123) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeExtensionNotAllowed,
          message: `UserSocialMediaController, PATCH - image extension not allowed`,
        });
      }

      const thumbnail = await createThumb(fileData);

      updatedObject.thumbnail = thumbnail;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { socialMediaLinks: socialMediaArray },
      { new: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      socialMediaLinks: updatedUser.socialMediaLinks,
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSocialMediaController, PATCH",
      error,
    });
  }
});

/**
 * @api {delete} /api/v2/user/social-media/:id Delete social media link flom_v1
 * @apiVersion 2.0.10
 * @apiName  Delete social media link flom_v1
 * @apiGroup WebAPI User - Social Media
 * @apiDescription  Delete social media link
 *
 * @apiHeader {String} access-token Users unique access token. Only admin token allowed.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1683120414631,
 *     "data": {
 *         "socialMediaLinks": [
 *             {
 *                 "id": "821385b761ce7159282ae632",
 *                 "title": "Hello worlddddddddddddd",
 *                 "url": "https://www.hello-world.com/hellooooooo",
 *                 "thumbnail": {
 *                     "originalFileName": "EasyImage-wLSpbl6E.webp",
 *                     "nameOnServer": "EasyImage-wLSpbl6E.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1340,
 *                     "height": 75,
 *                     "width": 75,
 *                     "aspectRatio": 1
 *                 },
 *                 "order": 1
 *             },
 *             {
 *                 "id": "4daa962669fa9a040260d929",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "EasyImage-PvxX95Sy.webp",
 *                     "nameOnServer": "EasyImage-PvxX95Sy.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1340,
 *                     "height": 75,
 *                     "width": 75,
 *                     "aspectRatio": 1
 *                 },
 *                 "order": 2
 *             },
 *             {
 *                 "id": "a6f2d6bd8b5b52bcb5130882",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "EasyImage-HM0KEknF.webp",
 *                     "nameOnServer": "EasyImage-HM0KEknF.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1340,
 *                     "height": 75,
 *                     "width": 75,
 *                     "aspectRatio": 1
 *                 },
 *                 "order": 3
 *             },
 *             {
 *                 "id": "bcd63820cd096af7a3c619a0",
 *                 "title": "Hello world",
 *                 "url": "https://www.hello-world.com/hello",
 *                 "thumbnail": {
 *                     "originalFileName": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "nameOnServer": "hArSvGRMExLjkW2hI9JDggjRpZYHXMRp.webp",
 *                     "mimeType": "image/webp",
 *                     "size": 1146,
 *                     "height": 38,
 *                     "width": 75,
 *                     "aspectRatio": 0.5066666666666667
 *                 },
 *                 "order": 4
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
 * @apiError (Errors) 443813  Social media link not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete("/:id", auth({ allowUser: true }), async (request, response) => {
  try {
    const { user } = request;
    const id = request.params.id;
    let orderOfDeleted, thumbnail;

    const newSocialMediaArray = user.socialMediaLinks.filter((media) => {
      if (media.id === id) {
        orderOfDeleted = media.order;
        thumbnail = media.thumbnail;
      }
      return media.id !== id;
    });

    if (thumbnail) {
      const thumbPath = path.resolve(Config.uploadPath, thumbnail.nameOnServer);
      fs.unlinkSync(thumbPath);
    }

    newSocialMediaArray.forEach((media) => {
      if (media.order > orderOfDeleted) media.order -= 1;
    });

    if (newSocialMediaArray.length === user.socialMediaLinks.length) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeSocialMediaDoesNotExist,
        message: `UserSocialMediaController, DELETE - social media not found`,
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id.toString(),
      { socialMediaLinks: newSocialMediaArray },
      { new: true },
    );

    Base.successResponse(response, Const.responsecodeSucceed, {
      socialMediaLinks: updatedUser.socialMediaLinks || [],
    });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "UserSocialMediaController, DELETE",
      error,
    });
  }
});

async function createThumb(image) {
  const imagePath = path.resolve(Config.uploadPath, image.nameOnServer);

  const newFileName = `${Utils.getRandomString(32)}.webp`;
  const thumbPath = path.resolve(Config.uploadPath, newFileName);

  const thumb = await easyimgResize({ src: imagePath, width: 75, dst: thumbPath });
  fs.unlinkSync(imagePath);

  return {
    originalFileName: thumb.name,
    nameOnServer: thumb.name,
    mimeType: "image/" + thumb.type,
    size: thumb.size,
    height: thumb.height,
    width: thumb.width,
    aspectRatio: Utils.roundNumber(thumb.height / thumb.width, 3),
  };
}

module.exports = router;
