"use strict";

const router = require("express").Router();
const { logger } = require("#infra");
const Base = require("../../Base");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { auth } = require("#middleware");
const {
  LoginAttempt,
  User,
  Transfer,
  GroupTransfer,
  Payout,
  Product,
  SupportTicket,
  LiveStream,
  Review,
  Auction,
  Order,
} = require("#models");

/**
 * @api {post} /api/v2/support Create support ticket flom_v1
 * @apiVersion 2.0.7
 * @apiName  Create support ticket
 * @apiGroup WebAPI Support
 * @apiDescription  API which is called to create a new support ticket.
 *
 * @apiHeader {String} access-token Users unique access token. For login it is not required to have a token.
 *
 * @apiParam {string} [email] Contact email.
 * @apiParam {string} type Type parameter from the category selected. (login_issue, transaction_issue, payout_issue, report_abuse, content, other, feedback, live_stream, content_comment, bug_report, flom_team_support, auction_issue, content_issue, order_cancellation_request, order_issue)
 * @apiParam {string} description Description of what happened.
 * @apiParam {string} referenceId Reference id. Optional for type is "other", "login_issue" or "flom_team_support". For login it's loginAttemptId,
 * for abuse it's reportedUserId, for transfer it's transferId, for content it's productId, for live stream it's liveStreamId and for content_comment it's reviewId for products and commentId for live streams.
 * @apiParam {number} [errorCode] Error code from pretransfer.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "submitted": true
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 441100 Login attempt not found
 * @apiError (Errors) 441200 UUIDs do not match
 * @apiError (Errors) 443236 Description parameter is missing
 * @apiError (Errors) 443030 ReferenceId parameter is not a valid mongoose id
 * @apiError (Errors) 443040 User to report was not found
 * @apiError (Errors) 443081 Transfer not found
 * @apiError (Errors) 443343 Payout not found
 * @apiError (Errors) 443855 Live stream not found
 * @apiError (Errors) 443393 Review not found
 * @apiError (Errors) 443938 Auction not found
 * @apiError (Errors) 443940 Order not found
 * @apiError (Errors) 443127 Type parameter is missing
 * @apiError (Errors) 443226 Invalid type parameter
 * @apiError (Errors) 443129 ReferenceId parameter is missing
 * @apiError (Errors) 443858 User not allowed to cancel the order
 * @apiError (Errors) 443941 Invalid order status, cannot cancel order after it is marked as shipped/completed
 * @apiError (Errors) 4000007 Token invalid
 */

router.post("/", async (request, response) => {
  try {
    const { email, description, type, referenceId, errorCode } = request.body;
    const UUID = request.headers["UUID"] || request.headers["uuid"];
    let user,
      userId,
      userPhoneNumber,
      sendSupportEmail = false,
      supportEmail,
      supportEmailSubject,
      supportEmailObject;

    if (!description) {
      return supportErrorResponse({
        response,
        code: Const.responsecodeNoDescription,
        message: "Support - create ticket, no description",
      });
    }
    if (!type) {
      return supportErrorResponse({
        response,
        code: Const.responsecodeNoTypeParameter,
        message: "Support - create ticket, no type",
      });
    }

    const tokenRequired = {
      transaction_issue: true,
      payout_issue: true,
      report_abuse: true,
      login_issue: false,
      other: false,
      feedback: true,
      content: true,
      international_user: true,
      live_stream: true,
      content_comment: true,
      bug_report: true,
      flom_team_support: false,
      auction_issue: true,
      content_issue: true,
      order_cancellation_request: true,
      order_issue: true,
    };

    const token = request.headers["access-token"];
    if (tokenRequired[type] && !(await isTokenValid(token))) {
      return supportErrorResponse({
        response,
        code: Const.responsecodeSigninInvalidToken,
        message: "Support - create ticket, invalid token",
      });
    }
    if (token) {
      user = await User.findOne({
        "token.token": token,
      });
      if (user) {
        userId = user._id.toString();
        userPhoneNumber = user.phoneNumber;
      }
    }

    const referenceIdRequired = {
      transaction_issue: false,
      payout_issue: true,
      report_abuse: true,
      login_issue: false,
      other: false,
      feedback: false,
      content: true,
      international_user: false,
      live_stream: true,
      content_comment: true,
      bug_report: false,
      flom_team_support: false,
      auction_issue: true,
      content_issue: false,
      order_cancellation_request: true,
      order_issue: true,
    };

    if (referenceIdRequired[type]) {
      if (!referenceId) {
        return supportErrorResponse({
          response,
          code: Const.responsecodeNoReferenceIdParameter,
          message: "Support - create ticket, no referenceId",
        });
      }
      if (type !== "content_comment" && !Utils.isValidObjectId(referenceId)) {
        return supportErrorResponse({
          response,
          code: Const.responsecodeUserIdNotValid,
          message: "Support - create ticket, referenceId not a valid Id",
        });
      }
    }

    let order;

    switch (type) {
      case "login_issue":
        if (referenceId) {
          const loginAttempt = await LoginAttempt.findOne({
            _id: referenceId,
          });
          if (!loginAttempt) {
            return supportErrorResponse({
              response,
              code: Const.responsecodeLoginAttemptNotFound,
              message: "Support - create ticket, loginAttempt not found",
            });
          }
          if (loginAttempt.UUID !== UUID) {
            return supportErrorResponse({
              response,
              code: Const.responsecodeLoginAttemptUUIDsDontMatch,
              message: "Support - create ticket, UUIDs do not match",
            });
          }
          if (loginAttempt.completed === false) {
            userPhoneNumber = loginAttempt.phoneNumber;
            sendSupportEmail = true;
            supportEmail = Config.loginSupportEmail;
            supportEmailSubject = "Login support ticket (Flom v1)";
            supportEmailObject = loginAttempt.toObject();
          }
        }
        break;
      case "report_abuse":
        const reportedUser = await User.findOne({
          _id: referenceId,
        });
        if (!reportedUser) {
          return supportErrorResponse({
            response,
            code: Const.responsecodeUserNotFound,
            message: "Support - create ticket, user not found",
          });
        }

        logger.info(
          `User with id ${userId} reported abuse from user with id ${referenceId} (${
            email || "no email"
          }, ${description}).`,
        );
        break;
      case "transaction_issue":
        if (referenceId) {
          let transfer = await Transfer.findOne({ _id: referenceId });
          if (!transfer) {
            transfer = await GroupTransfer.findOne({ _id: referenceId });
          }
          if (!transfer) {
            return supportErrorResponse({
              response,
              code: Const.responsecodeTransferNotFound,
              message: "Support - create ticket, transfer not found",
            });
          }

          sendSupportEmail = true;
          supportEmail = Config.transactionSupportEmail;
          supportEmailSubject = "Transfer support ticket (Flom v1)";
          supportEmailObject = transfer.toObject();
        }
        break;
      case "payout_issue":
        if (referenceId) {
          const payout = await Payout.findOne({ _id: referenceId });
          if (!payout) {
            return supportErrorResponse({
              response,
              code: Const.responsecodePayoutNotFound,
              message: "Support - create ticket, payout not found",
            });
          }

          sendSupportEmail = true;
          supportEmail = Config.transactionSupportEmail;
          supportEmailSubject = "Payout support ticket (Flom v1)";
          supportEmailObject = payout.toObject();
        }
        break;
      case "content":
        if (referenceId) {
          const product = await Product.findOne({ _id: referenceId, isDeleted: false });
          if (!product) {
            return supportErrorResponse({
              response,
              code: Const.responsecodeProductNotFound,
              message: "Support - create ticket, content not found",
            });
          }

          sendSupportEmail = true;
          supportEmail = Config.transactionSupportEmail;
          supportEmailSubject = "Content support ticket (Flom v1)";
          supportEmailObject = product.toObject();
        }
        break;
      case "live_stream":
        if (referenceId) {
          const liveStream = await LiveStream.findOne({ _id: referenceId }, { comments: 0 });

          if (!liveStream) {
            return supportErrorResponse({
              response,
              code: Const.responsecodeLiveStreamNotFound,
              message: "Support - create ticket, liveStream not found",
            });
          }

          sendSupportEmail = true;
          supportEmail = Config.transactionSupportEmail;
          supportEmailSubject = "Live stream support ticket (Flom v1)";
          supportEmailObject = liveStream.toObject();
        }
        break;
      case "content_comment":
        if (referenceId) {
          const isReview = Utils.isValidObjectId(referenceId);

          if (isReview) {
            const review = await Review.findById(referenceId).lean();

            if (!review) {
              return supportErrorResponse({
                response,
                code: Const.responsecodeReviewNotFound,
                message: "Support - create ticket, review not found",
              });
            }

            supportEmailObject = review;
          } else {
            const liveStream = await LiveStream.findOne({
              "comments.commentId": referenceId,
            }).lean();

            if (!liveStream) {
              return supportErrorResponse({
                response,
                code: Const.responsecodeLiveStreamNotFound,
                message: "Support - create ticket, liveStream not found",
              });
            }

            supportEmailObject = liveStream;
          }

          sendSupportEmail = true;
          supportEmail = Config.transactionSupportEmail;
          supportEmailSubject = "Content comment support ticket (Flom v1)";
        }
        break;
      case "feedback":
      case "other":
      case "international_user":
        break;
      case "flom_team_support":
        sendSupportEmail = true;
        supportEmail = Config.flomTeamSupportEmail;
        supportEmailSubject = "Flom team support ticket";
        break;
      case "auction_issue":
        const auction = await Auction.findOne({ _id: referenceId });

        if (!auction) {
          return supportErrorResponse({
            response,
            code: Const.responsecodeAuctionNotFound,
            message: "Support - create ticket, auction not found",
          });
        }

        sendSupportEmail = true;
        supportEmail = Config.transactionSupportEmail;
        supportEmailSubject = "Auction support ticket (Flom v1)";
        supportEmailObject = auction.toObject();
        break;
      case "content_issue":
        if (referenceId) {
          const product = await Product.findOne({ _id: referenceId, isDeleted: false });
          if (!product) {
            return supportErrorResponse({
              response,
              code: Const.responsecodeProductNotFound,
              message: "Support - create ticket, content not found",
            });
          }

          sendSupportEmail = true;
          supportEmail = Config.transactionSupportEmail;
          supportEmailSubject = "Content issue support ticket (Flom v1)";
          supportEmailObject = product.toObject();
        }
        break;
      case "order_cancellation_request":
      case "order_issue":
        order = await Order.findOne({ _id: referenceId });

        if (!order) {
          return supportErrorResponse({
            response,
            code: Const.responsecodeOrderNotFound,
            message: "Support - create ticket, order not found",
          });
        }

        if (type === "order_cancellation_request" && order.buyer._id.toString() !== userId) {
          return supportErrorResponse({
            response,
            code: Const.responsecodeUserNotAllowed,
            message:
              "Support - create ticket, user not allowed to request cancellation for this order",
          });
        }

        if (
          type === "order_cancellation_request" &&
          (order.status === Const.orderStatus.SHIPPED ||
            order.status === Const.orderStatus.DELIVERED)
        ) {
          return supportErrorResponse({
            response,
            code: Const.responsecodeInvalidOrderStatus,
            message:
              "Support - create ticket, cannot cancel order if status is shipped or delivered, current status: " +
              order.status,
          });
        }

        sendSupportEmail = true;
        supportEmail = Config.transactionSupportEmail;
        supportEmailSubject =
          type === "order_cancellation_request"
            ? "Order cancellation request support ticket (Flom v1)"
            : "Order issue support ticket (Flom v1)";
        supportEmailObject = order.toObject();
        break;
      default:
        return supportErrorResponse({
          response,
          code: Const.responsecodeInvalidTypeParameter,
          message: "Support - create ticket, invalid type parameter",
        });
    }

    const supportTicketData = {
      type,
      status: 1,
      description,
      userId,
      referenceId,
      userPhoneNumber,
      email,
    };

    if (errorCode) {
      supportTicketData.error = { code: errorCode };
    }

    if (user && email) {
      user.email = email;
      await user.save();
    }

    const ticket = await SupportTicket.create(supportTicketData);

    if (type === "order_cancellation_request" || type === "order_issue") {
      await Order.updateOne(
        { _id: referenceId },
        {
          $set: {
            modified: Date.now(),
            supportTicketId: ticket._id.toString(),
            status:
              type === "order_cancellation_request"
                ? Const.orderStatus.CANCELLATION_REQUESTED
                : Const.orderStatus.SUPPORT_TICKET_OPENED,
          },
          $push: {
            events: {
              status:
                type === "order_cancellation_request"
                  ? Const.orderStatus.CANCELLATION_REQUESTED
                  : Const.orderStatus.SUPPORT_TICKET_OPENED,
              user: userId === order.buyer._id.toString() ? "buyer" : "seller",
              userId,
              timeStamp: Date.now(),
            },
          },
        },
      );
    }

    if (sendSupportEmail) {
      const text =
        `Support ticket type: ${type}\n` +
        JSON.stringify({
          supportTicketData,
          supportEmailObject,
        });
      Utils.sendEmailWithSG(supportEmailSubject, text, supportEmail);
    }

    Base.successResponse(response, Const.responsecodeSucceed, { submitted: true });
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SupportController - create ticket",
      error,
    });
  }
});

async function isTokenValid(token) {
  if (!token) {
    return false;
  }

  const user = await User.findOne({
    "token.token": token,
  }).lean();
  if (!user) {
    return false;
  }
  const tokenGenerated = user.token[0].generateAt;
  const diff = Utils.now() - tokenGenerated;

  if (diff > Const.tokenValidInterval) {
    return false;
  }
  return true;
}

function supportErrorResponse({ response, code, message }) {
  return Base.newErrorResponse({
    response,
    code,
    message,
  });
}

/**
 * @api {get} /api/v2/support Get support tickets flom_v1
 * @apiVersion 2.0.8
 * @apiName  Get support tickets
 * @apiGroup WebAPI Support
 * @apiDescription  API which is called to get support tickets. Available only to admin page. Admin users need to have have:
 * support ticket reviewer (110), admin or super admin role.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam (Query string) {String} supportTicketId Id of the support ticket
 * @apiParam (Query string) {String} phoneNumber Phone number of the user in the support ticket
 * @apiParam (Query string) {String} type Type of the support ticket (login_issue, transaction_issue, payout_issue, report_abuse, other, feedback, live_stream, refund_request, content_comment, bug_report, flom_team_support, auction_issue, content_issue, order_cancellation_request, order_issue)
 * @apiParam (Query string) {String} status Status of the support ticket (1 - submitted, 2 - in progress, 3 - completed, 4 - supervisor requested, 5 - super admin requested, 6 - rejected)
 * @apiParam (Query string) {String} page Page number. Default 1
 * @apiParam (Query string) {String} itemsPerPage Number of results per page. Default 10
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "supportTickets": [
 *       {
 *         "id": "60ed70d08bd5af72dc742388",
 *         "created": 1626173648459,
 *         "type": "transaction_issue",
 *         "status": 1,
 *         "description": "Heeelp.",
 *         "userId": "6050d57ff69b9e15738a2bbb",
 *         "userPhoneNumber": "+2348020000020",
 *         "email": "luka.d@clover.studio",
 *       },
 *     ],
 *     "pagination": {
 *       "total": 192,
 *       "itemsPerPage": 1
 *     }
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443215 Wrong role
 * @apiError (Errors) 443226 Invalid type parameter
 * @apiError (Errors) 443340 supportTicketId not valid
 * @apiError (Errors) 443342 Status not valid
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.SUPPORT_TICKET_REVIEWER, Const.Role.ADMIN, Const.Role.SUPER_ADMIN],
  }),
  async (request, response) => {
    try {
      let phoneNumber = request.query.phoneNumber;
      const { supportTicketId, type } = request.query;
      const status = +request.query.status || null;
      const page = +request.query.page || 1;
      const itemsPerPage = +request.query.itemsPerPage || Const.newPagingRows;

      const searchQuery = {};

      if (supportTicketId) {
        if (!Utils.isValidObjectId(supportTicketId)) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeSupportTicketIdNotValid,
            message: `SupportController - list, invalid supportTicketId parameter`,
          });
        }
        searchQuery._id = supportTicketId;
      } else if (phoneNumber) {
        phoneNumber = phoneNumber.replace(/\D/g, "");
        if (phoneNumber.startsWith(" ") || phoneNumber.startsWith("0")) {
          phoneNumber = "+" + phoneNumber.substring(1);
        }
        if (!phoneNumber.startsWith("+")) {
          phoneNumber = "+" + phoneNumber;
        }
        const user = await User.findOne({ phoneNumber }, { _id: 1 }).lean();
        if (user) {
          searchQuery.userId = user._id.toString();
        }
      }

      if (status !== null) {
        if ([1, 2, 3, 4, 5, 6].indexOf(status) === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeWrongStatus,
            message: `SupportController - list, invalid status parameter`,
          });
        } else if (status === 5 && request.user.role < Const.Role.SUPER_ADMIN) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeWrongRole,
            message: `SupportController - list, wrong admin role for status 5`,
          });
        } else {
          searchQuery.status = status;
        }
      }
      if (type) {
        if (Config.supportTypes.indexOf(type) === -1) {
          return Base.newErrorResponse({
            response,
            code: Const.responsecodeInvalidTypeParameter,
            message: `SupportController - list, invalid type parameter`,
          });
        } else {
          searchQuery.type = type;
        }
      }

      const supportTickets = await SupportTicket.find(searchQuery)
        .sort({ created: -1 })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .lean();

      const total = await SupportTicket.find(searchQuery).countDocuments();

      const supportTicketsFormatted = [];
      for (let i = 0; i < supportTickets.length; i++) {
        const supportTicket = supportTickets[i];

        let { userPhoneNumber } = supportTicket;
        if (!userPhoneNumber && supportTicket.userId) {
          const user = await User.findOne({ _id: supportTicket.userId }, { phoneNumber: 1 }).lean();
          if (user) {
            userPhoneNumber = user.phoneNumber;
          }
        }
        supportTicketsFormatted.push({
          ...supportTicket,
          userPhoneNumber,
        });
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        supportTickets: supportTicketsFormatted,
        pagination: {
          total,
          itemsPerPage,
        },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SupportController - list",
        error,
      });
    }
  },
);

/**
 * @api {post} /api/v2/support/send-email Send support email flom_v1
 * @apiVersion 2.0.8
 * @apiName  Send support email
 * @apiGroup WebAPI Support
 * @apiDescription  API for sending support email. Available only to admin page. Admin users need to have have:
 * support ticket reviewer (110), admin or super admin role.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String} to Email destination email address
 * @apiParam {String} [subject] Email subject parameter. Default: "Support ticket reply"
 * @apiParam {String} text Email text (body) parameter
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443350 No to parameter
 * @apiError (Errors) 443351 Invalid email in to parameter
 * @apiError (Errors) 443352 No text parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.post(
  "/send-email",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.SUPPORT_TICKET_REVIEWER, Const.Role.ADMIN, Const.Role.SUPER_ADMIN],
  }),
  async (request, response) => {
    try {
      const { to, subject = "Support ticket reply (Flom v1)", text } = request.body;

      if (!to || to === "") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoToParameter,
          message: `SupportController - send email, no to parameter`,
        });
      }
      if (!Utils.isEmail(to)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidEmail,
          message: `SupportController - send email, to is not a valid email`,
        });
      }

      if (!text || text === "") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoTextParameter,
          message: `SupportController - send email, no text parameter`,
        });
      }

      await Utils.sendEmailFromTemplate({
        to,
        subject,
        text,
        templatePath: "src/email-templates/supportEmail.html",
      });

      Base.successResponse(response, Const.responsecodeSucceed, {});
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SupportController, send email",
        error,
      });
    }
  },
);

/**
 * @api {post} /api/v2/support/send-qrios Send Qrios support email flom_v1
 * @apiVersion 2.0.8
 * @apiName  Send Qrios support email
 * @apiGroup WebAPI Support
 * @apiDescription  API for sending Qrios support email. Available only to admin page. Admin users need to have have admin role.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {String} to Email destination email address
 * @apiParam {String} [subject] Email subject parameter. Default: "Support ticket reply"
 * @apiParam {String} text Email text (body) parameter
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {}
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443350 No to parameter
 * @apiError (Errors) 443351 Invalid email in to parameter
 * @apiError (Errors) 443352 No text parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.post(
  "/send-qrios",
  auth({ allowAdmin: true, role: Const.Role.ADMIN }),
  async (request, response) => {
    try {
      const { to, subject = "Support ticket reply (Flom v1)", text } = request.body;

      if (!to || to === "") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoToParameter,
          message: `SupportController - send qrios email, no to parameter`,
        });
      }
      if (!Utils.isEmail(to)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeInvalidEmail,
          message: `SupportController - send qrios email, to is not a valid email`,
        });
      }

      if (!text || text === "") {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeNoTextParameter,
          message: `SupportController - send qrios email, no text parameter`,
        });
      }

      await Utils.sendEmailFromTemplate({
        to,
        from: "website@qrios.com",
        subject,
        text,
        templatePath: "src/email-templates/qriosSupportEmail.html",
      });

      Base.successResponse(response, Const.responsecodeSucceed, {});
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SupportController, send qrios email",
        error,
      });
    }
  },
);

/**
 * @api {get} /api/v2/support/categories Get support categories flom_v1
 * @apiVersion 2.0.6
 * @apiName  Get support categories
 * @apiGroup WebAPI Support
 * @apiDescription  API which is called to get support categories. If token is not present API will return only support categories
 * for guest users (in current case this is login categories). Otherwise returns all the categories.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "version": {
 *     "update": 1, // 0 - no update, 1 - optional update
 *     "popupHiddenLength": 24 // in hours
 *   },
 *   "data": {
 *     "supportCategories": [
 *      { "label": "Transaction issue", "selector": "transactions", "pickerTitle": "Select transaction", "type": "transaction_issue" },
 *      { "label": "Something else", "selector": null, "type": "other" },
 *     ]
 *   }
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

router.get("/categories", async (request, response) => {
  try {
    const token = request.headers["access-token"];
    let user;
    if (await isTokenValid(token)) {
      user = await User.findOne({
        "token.token": token,
      }).lean();
    }

    if (user) {
      return Base.successResponse(response, Const.responsecodeSucceed, {
        supportCategories: Config.supportCategories.map((category) => {
          delete category.token;
          return category;
        }),
      });
    } else {
      const supportCategories = Config.supportCategories.filter((category) => !category.token);
      supportCategories.forEach((category) => {
        delete category.token;
      });
      Base.successResponse(response, Const.responsecodeSucceed, {
        supportCategories,
      });
    }
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "SupportController - get support categories",
      error,
    });
  }
});

/**
 * @api {get} /api/v2/support/:supportTicketId Get support ticket flom_v1
 * @apiVersion 2.0.8
 * @apiName  Get support ticket
 * @apiGroup WebAPI Support
 * @apiDescription  API which is called to get support ticket. Available only to admin page. Admin users need to have have: support ticket reviewer (110), admin or super admin role. If type is content_comment then either "review" or "comment" will be present in response.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiSuccessExample Success Response
 * {
 *     "code": 1,
 *     "time": 1730211950711,
 *     "data": {
 *         "supportTicket": {
 *             "_id": "6720e1ee70267e8cb0f981d4",
 *             "created": 1730208238406,
 *             "files": [],
 *             "type": "content_comment",
 *             "status": 1,
 *             "description": "reportam za test",
 *             "userId": "63dcc7f3bcc5921af87df5c2",
 *             "referenceId": "67176ab5f1d95ba708afad3c",
 *             "userPhoneNumber": "+2348020000004",
 *             "email": "marko.r@clover.studio",
 *             "__v": 0,
 *             "user": {
 *                 "id": "63dcc7f3bcc5921af87df5c2",
 *                 "username": "marko_04",
 *                 "groups": [
 *                     "5caf311bec0abb18999bd755"
 *                 ],
 *                 "location": {
 *                     "type": "Point",
 *                     "coordinates": [
 *                         15.949005114263901,
 *                         45.80276313955941
 *                     ]
 *                 },
 *                 "blockedProducts": 0,
 *                 "locationVisibility": false,
 *                 "name": "marko_04",
 *                 "status": 1,
 *                 "phoneNumber": "+2348020000004",
 *                 "typeAcc": 1,
 *                 "description": "short introduction",
 *                 "email": "marko.r@clover.studio",
 *                 "countryCode": "NG",
 *                 "internationalUser": true,
 *                 "featured": {
 *                     "countryCode": "default",
 *                     "types": []
 *                 }
 *             },
 *             "review": {
 *                 "_id": "67176ab5f1d95ba708afad3c",
 *                 "user_id": "63dceca0c30542684f1b7b68",
 *                 "product_id": "66cf22c0c5b1dc5afe6dd226",
 *                 "type": 2,
 *                 "blessPacket": {
 *                     "id": "63e2371994deb3742b0140e0",
 *                     "emoji": {
 *                         "originalFileName": "bless26.webp",
 *                         "nameOnServer": "bless26.webp",
 *                         "size": 142174,
 *                         "width": 480,
 *                         "height": 270,
 *                         "mimeType": "image/webp"
 *                     },
 *                     "smallEmoji": {
 *                         "originalFileName": "bless26.webp",
 *                         "nameOnServer": "bless26.webp",
 *                         "size": 142174,
 *                         "width": 480,
 *                         "height": 270,
 *                         "mimeType": "image/webp"
 *                     },
 *                     "isDeleted": false,
 *                     "keywords": "",
 *                     "created": 1675769625480,
 *                     "title": "Front",
 *                     "amount": 20,
 *                     "creditsAmount": 50,
 *                     "position": 22,
 *                     "emojiFileName": "bless26.webp",
 *                     "smallEmojiFileName": "bless26.webp",
 *                     "link": "https://v1.flom.dev/api/v2/bless/emojis/bless26.webp"
 *                 },
 *                 "comment": "Svdb\nVsvdbdnyjks   Ynynynynny\nYmmymym\nSmsmsmsm\nSmamsmsms",
 *                 "created": 1729587893687,
 *                 "files": [],
 *                 "__v": 0,
 *                 "isDeleted": false,
 *                 "rawComment": "Svdb\nVsvdbdnyjks   Ynynynynny\nYmmymym\nSmsmsmsm\nSmamsmsms",
 *                 "sender": {
 *                     "_id": "63dceca0c30542684f1b7b68",
 *                     "name": "mer19abc",
 *                     "created": 1675422880810,
 *                     "phoneNumber": "+2348020000019",
 *                     "userName": "mer19abc",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "thumb_n38hIbTQpmLT_1724400654916.jpg",
 *                             "size": 43868,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "eN3zSN1c5jjhdFnkVVY98KbDV2ZjGvO9"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "thumb_n38hIbTQpmLT_1724400654916.jpg",
 *                             "size": 55598,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "SofEJ4ki2ilzECEYnD2QjI0fV6GZMtu1"
 *                         }
 *                     }
 *                 }
 *             },
 *             "comment": {
 *                 "sender": {
 *                     "_id": "63e10fd117885e15aa47be24",
 *                     "avatar": {
 *                         "picture": {
 *                             "nameOnServer": "fJMk4huz89i2lqyghZIlOW6UYdzdb2Mk",
 *                             "size": 0,
 *                             "code": 0,
 *                             "time": 0
 *                         },
 *                         "thumbnail": {
 *                             "nameOnServer": "kUC8FvC6dz3tALwPpCSY5xuFET5y9H4o",
 *                             "size": 0,
 *                             "code": 0,
 *                             "time": 0
 *                         },
 *                         "code": 0,
 *                         "time": 0
 *                     },
 *                     "created": 1675694033760,
 *                     "phoneNumber": "+2348020000018",
 *                     "userName": "met18"
 *                 },
 *                 "commentId": "78871dbd-2aa0-46cd-9112-cca5420ccf6b",
 *                 "commentType": "message",
 *                 "created": 1727692544176,
 *                 "messageData": {
 *                     "text": "Svawg"
 *                 },
 *                 "isDeleted": false
 *             }
 *         }
 *     }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443215 Wrong role
 * @apiError (Errors) 443340 supportTicketId not valid
 * @apiError (Errors) 443341 Support ticket with supportTicketId not found
 * @apiError (Errors) 4000007 Token invalid
 */

router.get(
  "/:supportTicketId",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.SUPPORT_TICKET_REVIEWER, Const.Role.ADMIN, Const.Role.SUPER_ADMIN],
  }),
  async (request, response) => {
    try {
      const { supportTicketId } = request.params;

      if (!Utils.isValidObjectId(supportTicketId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketIdNotValid,
          message: `SupportController - get by id, invalid supportTicketId parameter`,
        });
      }

      const supportTicket = await SupportTicket.findOne({ _id: supportTicketId }).lean();
      if (!supportTicket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketNotFound,
          message: `SupportController - get by id, support ticket with ${supportTicketId} not found`,
        });
      }

      if (supportTicket.status === 5 && request.user.role < Const.Role.SUPER_ADMIN) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeWrongRole,
          message: `SupportController - get by id, wrong admin role for status 5`,
        });
      }

      let { userPhoneNumber } = supportTicket;
      let user, username, id;
      if (supportTicket.userId) {
        user = await User.findOne(
          { _id: supportTicket.userId },
          {
            name: 1,
            firstName: 1,
            lastName: 1,
            description: 1,
            status: 1,
            groups: 1,
            phoneNumber: 1,
            typeAcc: 1,
            location: 1,
            locationVisibility: 1,
            userName: 1,
            countryCode: 1,
            email: 1,
            featured: 1,
            blockedProducts: 1,
            internationalUser: 1,
          },
        ).lean();
        if (user) {
          userPhoneNumber = user.phoneNumber;
          username = user.userName;
          id = user._id.toString();
          delete user.userName;
          delete user._id;
        }
      }

      let review, comment;

      if (supportTicket.type === "content_comment") {
        const refId = supportTicket.referenceId;

        if (Utils.isValidObjectId(refId)) {
          review = await Review.findById(refId).lean();

          review.sender = await User.findById(review.user_id, {
            _id: 1,
            phoneNumber: 1,
            userName: 1,
            name: 1,
            avatar: 1,
            created: 1,
          }).lean();
        } else {
          const liveStream = await LiveStream.findOne({ "comments.commentId": refId }).lean();

          for (const item of liveStream.comments) {
            if (item.commentId === refId) {
              comment = item;
            }
          }
        }
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        supportTicket: {
          ...supportTicket,
          userPhoneNumber,
          user: { id, username, ...user },
          review,
          comment,
        },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SupportController - get by id",
        error,
      });
    }
  },
);

/**
 * @api {patch} /api/v2/support/:supportTicketId Update support ticket status flom_v1
 * @apiVersion 2.0.8
 * @apiName  Update support ticket status
 * @apiGroup WebAPI Support
 * @apiDescription  API which is called to update support ticket status. Available only to admin page. Admin users need to have have:
 * support ticket reviewer (110), admin or super admin role.
 *
 * @apiHeader {String} access-token Users unique access token.
 *
 * @apiParam {Number} status Support ticket status (1 - submitted, 2 - in progress, 3 - completed, 4 - supervisor requested, 5 - super admin requested, 6 - rejected)
 *
 * @apiSuccessExample Success Response
 * {
 *   "code": 1,
 *   "time": 1590000125608,
 *   "data": {
 *     "supportTicket":{
 *       "id": "60ed70d08bd5af72dc742388",
 *       "created": 1626173648459,
 *       "type": "transaction_issue",
 *       "status": 1,
 *       "description": "Heeelp.",
 *       "userId": "6034e1c050d293417149305f",
 *       "userPhoneNumber": "+2348020000008",
 *       "email": "luka.d@clover.studio",
 *       "error": {
 *         code: 443120
 *       },
 *       "user":
 *         "id": "6034e1c050d293417149305f",
 *         "username": "eightmanoy",
 *         "groups": [
 *           "5caf311bec0abb18999bd755"
 *         ],
 *         "location": {
 *           "type": "Point",
 *           "coordinates": [
 *             0,
 *             0
 *           ]
 *         },
 *         "locationVisibility": false,
 *         "name": "+2348*****0008",
 *         "status": 1,
 *         "phoneNumber": "+2348020000008",
 *         "countryCode": "NG",
 *         "email": "Bababab@bab.bass",
 *         "firstName": "Eight",
 *         "lastName": "Man",
 *         "description": "Bababaabab",
 *         "blockedProducts": 0,
 *         "internationalUser": true
 *       }
 *     },
 *   }
 * }
 *
 * @apiSuccessExample {json} Error Response
 * {
 *   "code": ErrorCode,
 *   "time": 1590000125608
 *  }
 *
 * @apiError (Errors) 443215 Wrong role
 * @apiError (Errors) 443340 supportTicketId not valid
 * @apiError (Errors) 443341 Support ticket with supportTicketId not found
 * @apiError (Errors) 443342 Wrong status parameter
 * @apiError (Errors) 4000007 Token invalid
 */

router.patch(
  "/:supportTicketId",
  auth({
    allowAdmin: true,
    includedRoles: [Const.Role.SUPPORT_TICKET_REVIEWER, Const.Role.ADMIN, Const.Role.SUPER_ADMIN],
  }),
  async (request, response) => {
    try {
      const { supportTicketId } = request.params;
      const status = +request.body.status;

      if (!Utils.isValidObjectId(supportTicketId)) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketIdNotValid,
          message: `SupportController - update status, invalid supportTicketId parameter`,
        });
      }

      if ([1, 2, 3, 4, 5, 6].indexOf(status) === -1) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeWrongStatus,
          message: `SupportController - update status, wrong status parameter`,
        });
      }

      const supportTicket = await SupportTicket.findById(supportTicketId).lean();

      if (!supportTicket) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeSupportTicketNotFound,
          message: `SupportController - update status, support ticket with ${supportTicketId} not found`,
        });
      }

      if (supportTicket.status === 5 && request.user.role < Const.Role.SUPER_ADMIN) {
        return Base.newErrorResponse({
          response,
          code: Const.responsecodeWrongRole,
          message: `SupportController - update status, wrong admin role for status 5`,
        });
      }

      const updatedSupportTicket = await SupportTicket.findOneAndUpdate(
        { _id: supportTicketId },
        { $set: { status } },
        { new: true, lean: true },
      );

      let { userPhoneNumber } = updatedSupportTicket;
      let user, username, id;
      if (updatedSupportTicket.userId) {
        user = await User.findOne(
          { _id: updatedSupportTicket.userId },
          {
            name: 1,
            firstName: 1,
            lastName: 1,
            description: 1,
            status: 1,
            groups: 1,
            phoneNumber: 1,
            typeAcc: 1,
            location: 1,
            locationVisibility: 1,
            userName: 1,
            countryCode: 1,
            email: 1,
            featured: 1,
            blockedProducts: 1,
            internationalUser: 1,
          },
        ).lean();
        if (user) {
          userPhoneNumber = user.phoneNumber;
          username = user.userName;
          id = user._id.toString();
          delete user.userName;
          delete user._id;
        }
      }

      if (
        status === 6 &&
        (supportTicket.type === "order_cancellation_request" ||
          supportTicket.type === "order_issue")
      ) {
        const order = await Order.findById(supportTicket.referenceId).lean();

        await Order.updateOne(
          { _id: supportTicket.referenceId },
          {
            $set: {
              modified: Date.now(),
              status: order.events.at(-2)?.status || order.status,
            },
            $push: {
              events: {
                status: order.events.at(-2)?.status || order.status,
                user: "admin",
                userId: request.user._id.toString(),
                timeStamp: Date.now(),
              },
            },
          },
        );
      }

      Base.successResponse(response, Const.responsecodeSucceed, {
        supportTicket: {
          ...updatedSupportTicket,
          userPhoneNumber,
          user: { id, username, ...user },
        },
      });
    } catch (error) {
      Base.newErrorResponse({
        response,
        message: "SupportController - update status",
        error,
      });
    }
  },
);

module.exports = router;
