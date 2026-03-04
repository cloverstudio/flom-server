"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { Const, countries } = require("#config");
const { User } = require("#models");
const { auth } = require("#middleware");

/**
 * @api {post} /api/v2/shipping/addresses/ Add shipping address flom_v1
 * @apiVersion 2.0.32
 * @apiName  Add shipping address flom_v1
 * @apiGroup WebAPI Shipping
 * @apiDescription  Add shipping address.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}  name          User's name
 * @apiParam {String}  country       User's country
 * @apiParam {String}  countryCode   User's countryCode
 * @apiParam {String}  [region]      User's region (US state - Texas, etc)
 * @apiParam {String}  [regionCode]  User's regionCode (TX, etc)
 * @apiParam {String}  city          User's city
 * @apiParam {String}  road          User's road
 * @apiParam {String}  houseNumber   User's houseNumber
 * @apiParam {String}  postCode      User's postCode
 * @apiParam {Boolean} makeDefault   Make this the default shipping address (default is false unless user has no addresses)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443801 Invalid parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    let addresses = user.shippingAddresses || [];

    const { err, msg, invalidParam, params } = checkAddRequest(request.body, addresses);

    if (err) {
      return Base.newErrorResponse({
        response,
        code: err,
        message: "ShippingAddressController, add - " + msg,
        param: invalidParam,
      });
    }

    if (params.isDefault) {
      addresses = addresses.map((addr) => {
        addr.isDefault = false;
        return addr;
      });
    }
    addresses.push(params);

    await User.findByIdAndUpdate(user._id.toString(), { shippingAddresses: addresses });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ShippingAddressController, add",
      error,
    });
  }
});

/**
 * @api {delete} /api/v2/shipping/addresses/:addressId Remove shipping address flom_v1
 * @apiVersion 2.0.32
 * @apiName  Remove shipping address flom_v1
 * @apiGroup WebAPI Shipping
 * @apiDescription  Remove shipping address.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443950  addressId not found in user's addresses
 * @apiError (Errors) 4000007 Token invalid
 */

router.delete("/:addressId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const addresses = user.shippingAddresses || [];

    const addressId = request.params.addressId || null;

    let isDefaultRemoved = false;
    const filtered = addresses.filter((addr) => {
      if (addr._id.toString() !== addressId) {
        isDefaultRemoved = addr.isDefault;
        return true;
      }

      return false;
    });

    if (filtered.length === addresses.length) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAddressNotFound,
        message: "ShippingAddressController, remove - addressId not found in user's addresses",
      });
    }

    if (isDefaultRemoved && filtered.length > 0) {
      filtered[0].isDefault = true;
    }

    await User.findByIdAndUpdate(user._id.toString(), { shippingAddresses: filtered });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ShippingAddressController, remove",
      error,
    });
  }
});

/**
 * @api {patch} /api/v2/shipping/addresses/:addressId Update shipping address flom_v1
 * @apiVersion 2.0.32
 * @apiName  Update shipping address flom_v1
 * @apiGroup WebAPI Shipping
 * @apiDescription  Update shipping address.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String}  [name]          User's name
 * @apiParam {String}  [country]       User's country
 * @apiParam {String}  [countryCode]   User's countryCode
 * @apiParam {String}  [region]        User's region (US state - Texas, etc)
 * @apiParam {String}  [regionCode]    User's regionCode (TX, etc)
 * @apiParam {String}  [city]          User's city
 * @apiParam {String}  [road]          User's road
 * @apiParam {String}  [houseNumber]   User's houseNumber
 * @apiParam {String}  [postCode]      User's postCode
 * @apiParam {Boolean} [makeDefault]   Make this the default shipping address (default is false unless user has no addresses)
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1700058064142,
 *     "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443950  addressId not found in user's addresses
 * @apiError (Errors) 443802  Invalid parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch("/:addressId", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const addressId = request.params.addressId || null;

    let addresses = user.shippingAddresses || [];

    if (!addresses.find((addr) => addr._id.toString() === addressId)) {
      return Base.newErrorResponse({
        response,
        code: Const.responsecodeAddressNotFound,
        message: "ShippingAddressController, update - addressId not found in user's addresses",
      });
    }

    const { err, msg, invalidParam, params } = checkUpdateRequest(request.body);

    if (err) {
      return Base.newErrorResponse({
        response,
        code: err,
        message: "ShippingAddressController, update - " + msg,
        param: invalidParam,
      });
    }

    addresses.forEach((addr) => {
      if (addr._id.toString() === addressId) {
        Object.assign(addr, params);
      }

      if (params.isDefault) {
        addr.isDefault = addr._id.toString() === addressId;
      }
    });

    await User.findByIdAndUpdate(user._id.toString(), { shippingAddresses: addresses });

    Base.successResponse(response, Const.responsecodeSucceed);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "ShippingAddressController, update",
      error,
    });
  }
});

function checkAddRequest(body, addresses) {
  let err = null;
  let msg = "";
  let invalidParam = "";
  const params = {};

  if (body.countryCode) body.countryCode = body.countryCode.toUpperCase();

  const {
    name,
    country,
    countryCode,
    region,
    regionCode,
    city,
    road,
    houseNumber,
    postCode,
    makeDefault = false,
  } = body;

  if (!name || typeof name !== "string" || name.length < 2 || name.length > 64) {
    err = Const.responsecodeInvalidParameter;
    msg = "name param is invalid";
    return { err, msg, invalidParam, params };
  }
  params.name = name;

  if (
    !countryCode ||
    typeof countryCode !== "string" ||
    countryCode.length !== 2 ||
    !countries[countryCode]
  ) {
    err = Const.responsecodeInvalidParameter;
    msg = "countryCode param is invalid";
    invalidParam = "countryCode";
    return { err, msg, invalidParam, params };
  }
  params.countryCode = countryCode;

  if (!country || typeof country !== "string" || country.length < 2 || country.length > 64) {
    err = Const.responsecodeInvalidParameter;
    msg = "country param is invalid";
    invalidParam = "country";
    return { err, msg, invalidParam, params };
  }
  params.country = country;

  if (region) {
    if (typeof region !== "string") {
      err = Const.responsecodeInvalidParameter;
      msg = "region param is invalid";
      invalidParam = "region";
      return { err, msg, invalidParam, params };
    }
    params.region = region;
  } else {
    params.region = "";
  }

  if (regionCode) {
    if (typeof regionCode !== "string") {
      err = Const.responsecodeInvalidParameter;
      msg = "regionCode param is invalid";
      invalidParam = "regionCode";
      return { err, msg, invalidParam, params };
    }
    params.regionCode = regionCode;
  } else {
    params.regionCode = "";
  }

  if (!city || typeof city !== "string") {
    err = Const.responsecodeInvalidParameter;
    msg = "city param is invalid";
    invalidParam = "city";
    return { err, msg, invalidParam, params };
  }
  params.city = city;

  if (!road || typeof road !== "string") {
    err = Const.responsecodeInvalidParameter;
    msg = "road param is invalid";
    invalidParam = "road";
    return { err, msg, invalidParam, params };
  }
  params.road = road;

  if (!houseNumber || (typeof houseNumber !== "string" && typeof houseNumber !== "number")) {
    err = Const.responsecodeInvalidParameter;
    msg = "houseNumber param is invalid";
    invalidParam = "houseNumber";
    return { err, msg, invalidParam, params };
  }
  params.houseNumber = houseNumber.toString();

  if (!postCode || typeof postCode !== "string") {
    err = Const.responsecodeInvalidParameter;
    msg = "postCode param is invalid";
    invalidParam = "postCode";
    return { err, msg, invalidParam, params };
  }
  params.postCode = postCode;

  if (typeof makeDefault !== "boolean") {
    err = Const.responsecodeInvalidParameter;
    msg = "makeDefault param is invalid";
    invalidParam = "makeDefault";
    return { err, msg, invalidParam, params };
  }
  params.isDefault = addresses.length === 0 ? true : makeDefault;

  return { params };
}

function checkUpdateRequest(body) {
  let err = null;
  let msg = "";
  let invalidParam = "";
  const params = {};

  if (body.countryCode) body.countryCode = body.countryCode.toUpperCase();

  const {
    name,
    country,
    countryCode,
    region,
    regionCode,
    city,
    road,
    houseNumber,
    postCode,
    makeDefault,
  } = body;

  if (name) {
    if (typeof name !== "string" || name.length < 2 || name.length > 64) {
      err = Const.responsecodeInvalidParameter;
      msg = "name param is invalid";
      return { err, msg, invalidParam, params };
    }
    params.name = name;
  }

  if (countryCode) {
    if (typeof countryCode !== "string" || countryCode.length !== 2 || !countries[countryCode]) {
      err = Const.responsecodeInvalidParameter;
      msg = "countryCode param is invalid";
      invalidParam = "countryCode";
      return { err, msg, invalidParam, params };
    }
    params.countryCode = countryCode;
  }

  if (country) {
    if (typeof country !== "string" || country.length < 2 || country.length > 64) {
      err = Const.responsecodeInvalidParameter;
      msg = "country param is invalid";
      invalidParam = "country";
      return { err, msg, invalidParam, params };
    }
    params.country = country;
  }

  if (region) {
    if (typeof region !== "string") {
      err = Const.responsecodeInvalidParameter;
      msg = "region param is invalid";
      invalidParam = "region";
      return { err, msg, invalidParam, params };
    }
    params.region = region;
  }

  if (regionCode) {
    if (typeof regionCode !== "string") {
      err = Const.responsecodeInvalidParameter;
      msg = "regionCode param is invalid";
      invalidParam = "regionCode";
      return { err, msg, invalidParam, params };
    }
    params.regionCode = regionCode;
  }

  if (city) {
    if (typeof city !== "string") {
      err = Const.responsecodeInvalidParameter;
      msg = "city param is invalid";
      invalidParam = "city";
      return { err, msg, invalidParam, params };
    }
    params.city = city;
  }

  if (road) {
    if (typeof road !== "string") {
      err = Const.responsecodeInvalidParameter;
      msg = "road param is invalid";
      invalidParam = "road";
      return { err, msg, invalidParam, params };
    }
    params.road = road;
  }

  if (houseNumber) {
    if (typeof houseNumber !== "string" && typeof houseNumber !== "number") {
      err = Const.responsecodeInvalidParameter;
      msg = "houseNumber param is invalid";
      invalidParam = "houseNumber";
      return { err, msg, invalidParam, params };
    }
    params.houseNumber = houseNumber.toString();
  }

  if (postCode) {
    if (typeof postCode !== "string") {
      err = Const.responsecodeInvalidParameter;
      msg = "postCode param is invalid";
      invalidParam = "postCode";
      return { err, msg, invalidParam, params };
    }
    params.postCode = postCode;
  }

  if (makeDefault !== undefined) {
    if (typeof makeDefault !== "boolean") {
      err = Const.responsecodeInvalidParameter;
      msg = "makeDefault param is invalid";
      invalidParam = "makeDefault";
      return { err, msg, invalidParam, params };
    }
    params.isDefault = makeDefault;
  }
  return { params };
}

module.exports = router;
