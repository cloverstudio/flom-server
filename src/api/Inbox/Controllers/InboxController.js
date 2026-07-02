"use strict";

const router = require("express").Router();
const Base = require("../../Base");
const { logger } = require("#infra");
const { Const, countries } = require("#config");
const Utils = require("#utils");
const Logics = require("#logics");
const { auth } = require("#middleware");
const { User, Order, ConversionRate, History, Room, FlomMessage } = require("#models");

/**
 * @api {get} /api/v2/inbox Get users inbox flom_v1
 * @apiVersion 2.0.34
 * @apiName Get Users Inbox
 * @apiGroup WebAPI Inbox
 * @apiDescription API for retrieving user's inbox
 *
 * @apiHeader {String} access-token Users unique access-token.
 *
 * @apiParam (Query string) {String} type   Type of inbox to return: "waiting", "follow_up", "paid", "all"
 * @apiParam (Query string) {String} [page] Page number for pagination (only applies to "all")
 * @apiParam (Query string) {String} [size] Number of items per page (only applies to "all")
 *
 * @apiSuccessExample {json} Success Response
 * {
 *     "code": 1,
 *     "time": 1782979086379,
 *     "data": {
 *         "histories": [
 *             {
 *                 "_id": "66ea5fcffca2c88a97896b6d",
 *                 "userId": "641d9c333478cf0d6a500547",
 *                 "chatId": "66d97b44e2c10ebf1671cf62",
 *                 "chatType": 5,
 *                 "lastUpdate": 0,
 *                 "lastUpdateUnreadCount": 1776346276402,
 *                 "unreadCount": 0,
 *                 "keyword": "Admin broadcasts for Pero_B",
 *                 "__v": 0,
 *                 "updatedAt": "2026-04-16T13:31:16.402Z",
 *                 "channel": "internal",
 *                 "broadcast": {
 *                     "_id": "66d97b44e2c10ebf1671cf62",
 *                     "name": "Broadcast (admin)",
 *                     "created": 1725528900166,
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "thumb_dVf6mRnbYDeq_1726559169726.jpg",
 *                             "size": 82922,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "oVehijJNnxhulpej3xwkTMpyWk4pszWc"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "thumb_dVf6mRnbYDeq_1726559169726.jpg",
 *                             "size": 82922,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "Txg8DbdS8Y5lJVqdCqYPERekXH11LGjX"
 *                         }
 *                     },
 *                     "owner": {
 *                         "_id": "5e08f8029d384b04a30b23aa",
 *                         "bankAccounts": [
 *                             {
 *                                 "merchantCode": "10292530",
 *                                 "name": "Global",
 *                                 "accountNumber": "50040477",
 *                                 "code": "",
 *                                 "selected": true,
 *                                 "lightningUserName": "10292530",
 *                                 "lightningAddress": "10292530@v2.flom.dev",
 *                                 "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XQERJV34XVCQ4A8HMC"
 *                             }
 *                         ],
 *                         "created": 1611424384851,
 *                         "phoneNumber": "+2348888888888",
 *                         "userName": "Flom",
 *                         "avatar": {
 *                             "picture": {
 *                                 "originalName": "flom support.png",
 *                                 "size": 5375,
 *                                 "mimeType": "image/png",
 *                                 "nameOnServer": "1MT1Exu7iyzxHXqWLzpKEOdkUF4NiO1p"
 *                             },
 *                             "thumbnail": {
 *                                 "originalName": "flom support.png",
 *                                 "size": 14100,
 *                                 "mimeType": "image/png",
 *                                 "nameOnServer": "S0eQ6MNaxVqqs5cjgRMcmH3HYFmy0ELK"
 *                             }
 *                         }
 *                     }
 *                 }
 *             },
 *             {
 *                 "_id": "69b15a608a663c5d9a53483f",
 *                 "userId": "641d9c333478cf0d6a500547",
 *                 "chatId": "63dce956c30542684f1b7b63",
 *                 "chatType": 1,
 *                 "lastUpdate": 1782979069293,
 *                 "lastUpdateUser": {
 *                     "_id": "641d9c333478cf0d6a500547",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "123456789",
 *                             "code": "",
 *                             "merchantCode": "15097219",
 *                             "selected": true,
 *                             "lightningUserName": "15097219",
 *                             "lightningAddress": "15097219@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3X5CRJDEJXYUSUCH8XQ"
 *                         },
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "12345566788",
 *                             "code": "",
 *                             "merchantCode": "13049191",
 *                             "selected": false,
 *                             "lightningUserName": "13049191",
 *                             "lightningAddress": "13049191@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XVCRGWF38YCSF9LLGD"
 *                         },
 *                         {
 *                             "accountNumber": "1234567890",
 *                             "code": "",
 *                             "merchantCode": "11785147",
 *                             "bankName": "Privredna Banka Zagreb",
 *                             "selected": false
 *                         }
 *                     ],
 *                     "name": "Pero_B",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "created": 1679662131487,
 *                     "phoneNumber": "+385958710207",
 *                     "description": "short intro",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "thumb_BedAkDabpbbc_1725992338552.jpg",
 *                             "size": 102495,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "lrT846BCuxt1AjNw0MY3npXd2Dv4lsgd"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "thumb_BedAkDabpbbc_1725992338552.jpg",
 *                             "size": 106009,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "uBEan9SlXpkDVJaNyT4spMQ4O6f5Qy3o"
 *                         }
 *                     },
 *                     "whatsApp": {
 *                         "reference": "PNsPrEruqT",
 *                         "receivedUnknownRecipientNotice": true,
 *                         "followupMessageSent": false,
 *                         "windowExpiresAt": null
 *                     },
 *                     "slug": "pero_b"
 *                 },
 *                 "lastMessage": {
 *                     "messageId": "6a4619fd6cf5e63f09c5e4bd",
 *                     "message": "test porukaaaa",
 *                     "created": 1782979069260,
 *                     "type": 1,
 *                     "sentTo": [
 *                         "63dce956c30542684f1b7b63"
 *                     ]
 *                 },
 *                 "unreadCount": 0,
 *                 "keyword": "ivoperic, test porukaaaa",
 *                 "firstMessageUserId": "641d9c333478cf0d6a500547",
 *                 "createdAt": "2026-03-11T12:04:48.311Z",
 *                 "updatedAt": "2026-07-02T07:57:49.294Z",
 *                 "__v": 0,
 *                 "lastUpdateUnreadCount": 1782979061672,
 *                 "channel": "internal",
 *                 "orderStatus": null,
 *                 "orderPrice": null,
 *                 "user": {
 *                     "_id": "63dce956c30542684f1b7b63",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "4111111111111111",
 *                             "code": "",
 *                             "merchantCode": "17642555",
 *                             "selected": true,
 *                             "lightningUserName": "17642555",
 *                             "lightningAddress": "17642555@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XUMRGV34X56S3ZC8LY"
 *                         }
 *                     ],
 *                     "created": 1675422038225,
 *                     "phoneNumber": "+385976376676",
 *                     "userName": "ivoperic",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1705559328.jpg",
 *                             "size": 1024276,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "WWhFE3HPFfpzRm32Ili2OKMOU3qeU6Gg"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1705559328.jpg",
 *                             "size": 92122,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "aKZQoxdnrCgnS5W4zeQ1S4eiN6C1pmXV"
 *                         }
 *                     },
 *                     "onlineStatus": null,
 *                     "lastSeen": 1780480994282
 *                 }
 *             },
 *             {
 *                 "_id": "6a1684e3d396d78fe85b4b75",
 *                 "userId": "641d9c333478cf0d6a500547",
 *                 "chatId": "6a1684e3d396d78fe85b4b66",
 *                 "chatType": 3,
 *                 "lastUpdate": 1782979050719,
 *                 "lastUpdateUser": {
 *                     "_id": "641d9c333478cf0d6a500547",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "123456789",
 *                             "code": "",
 *                             "merchantCode": "15097219",
 *                             "selected": true,
 *                             "lightningUserName": "15097219",
 *                             "lightningAddress": "15097219@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3X5CRJDEJXYUSUCH8XQ"
 *                         },
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "12345566788",
 *                             "code": "",
 *                             "merchantCode": "13049191",
 *                             "selected": false,
 *                             "lightningUserName": "13049191",
 *                             "lightningAddress": "13049191@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XVCRGWF38YCSF9LLGD"
 *                         },
 *                         {
 *                             "accountNumber": "1234567890",
 *                             "code": "",
 *                             "merchantCode": "11785147",
 *                             "bankName": "Privredna Banka Zagreb",
 *                             "selected": false
 *                         }
 *                     ],
 *                     "name": "Pero_B",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "created": 1679662131487,
 *                     "phoneNumber": "+385958710207",
 *                     "description": "short intro",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "thumb_BedAkDabpbbc_1725992338552.jpg",
 *                             "size": 102495,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "lrT846BCuxt1AjNw0MY3npXd2Dv4lsgd"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "thumb_BedAkDabpbbc_1725992338552.jpg",
 *                             "size": 106009,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "uBEan9SlXpkDVJaNyT4spMQ4O6f5Qy3o"
 *                         }
 *                     },
 *                     "whatsApp": {
 *                         "reference": "PNsPrEruqT",
 *                         "receivedUnknownRecipientNotice": true,
 *                         "followupMessageSent": false,
 *                         "windowExpiresAt": null
 *                     },
 *                     "slug": "pero_b"
 *                 },
 *                 "lastMessage": {
 *                     "messageId": "6a4619ea6cf5e63f09c5e490",
 *                     "message": "push test room",
 *                     "created": 1782979050667,
 *                     "type": 1,
 *                     "sentTo": [
 *                         "63dce956c30542684f1b7b63",
 *                         "63e0d656a62453346de15e37",
 *                         "64522d0ce8032549d6f9abba",
 *                         "63e10fd117885e15aa47be24",
 *                         "644ba7c76349be19eb08b12f",
 *                         "63e3771e2a439852f927d4a0",
 *                         "63dceca0c30542684f1b7b68"
 *                     ]
 *                 },
 *                 "unreadCount": 0,
 *                 "keyword": "push test, push test room",
 *                 "createdAt": "2026-05-27T05:45:07.633Z",
 *                 "updatedAt": "2026-07-02T07:57:32.088Z",
 *                 "__v": 0,
 *                 "lastUpdateUnreadCount": 1782978994938,
 *                 "orderStatus": null,
 *                 "orderPrice": null,
 *                 "room": {
 *                     "_id": "6a1684e3d396d78fe85b4b66",
 *                     "users": [
 *                         "63dce956c30542684f1b7b63",
 *                         "63e0d656a62453346de15e37",
 *                         "64522d0ce8032549d6f9abba",
 *                         "63e10fd117885e15aa47be24",
 *                         "641d9c333478cf0d6a500547",
 *                         "644ba7c76349be19eb08b12f",
 *                         "63e3771e2a439852f927d4a0",
 *                         "63dceca0c30542684f1b7b68"
 *                     ],
 *                     "owner": "63dceca0c30542684f1b7b68",
 *                     "admins": [
 *                         "63dceca0c30542684f1b7b68"
 *                     ],
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "name": "push test",
 *                     "created": 1779860707608,
 *                     "modified": 1779863207060,
 *                     "createdAt": "2026-05-27T05:45:07.611Z",
 *                     "updatedAt": "2026-05-27T06:26:49.108Z",
 *                     "__v": 0,
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "/private/var/mobile/Containers/Shared/AppGroup/D9301B18-6320-4D9B-AB05-7569B3D63767/files/images/IMG_jywP1LAE1779863206644.JPG",
 *                             "size": 633066,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "KvTAZW1yHVEoPjxdyTsFYemT8poUGnJb"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "/private/var/mobile/Containers/Shared/AppGroup/D9301B18-6320-4D9B-AB05-7569B3D63767/files/images/IMG_jywP1LAE1779863206644.JPG",
 *                             "size": 633066,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "I5LNxDgEOgE9qCyuFEHJ4gLiOFg3hPHw"
 *                         }
 *                     }
 *                 }
 *             },
 *             {
 *                 "_id": "6601864203e994d38aa8f3b4",
 *                 "userId": "641d9c333478cf0d6a500547",
 *                 "chatId": "63dccc42bcc5921af87df5ce",
 *                 "chatType": 1,
 *                 "lastUpdate": 1774007326061,
 *                 "lastUpdateUser": {
 *                     "_id": "641d9c333478cf0d6a500547",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "123456789",
 *                             "code": "",
 *                             "merchantCode": "15097219",
 *                             "selected": true,
 *                             "lightningUserName": "15097219",
 *                             "lightningAddress": "15097219@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3X5CRJDEJXYUSUCH8XQ"
 *                         },
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "12345566788",
 *                             "code": "",
 *                             "merchantCode": "13049191",
 *                             "selected": false,
 *                             "lightningUserName": "13049191",
 *                             "lightningAddress": "13049191@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XVCRGWF38YCSF9LLGD"
 *                         },
 *                         {
 *                             "accountNumber": "1234567890",
 *                             "code": "",
 *                             "merchantCode": "11785147",
 *                             "bankName": "Privredna Banka Zagreb",
 *                             "selected": false
 *                         }
 *                     ],
 *                     "name": "Pero_B",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "created": 1679662131487,
 *                     "phoneNumber": "+385958710207",
 *                     "description": "short intro",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "thumb_BedAkDabpbbc_1725992338552.jpg",
 *                             "size": 102495,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "lrT846BCuxt1AjNw0MY3npXd2Dv4lsgd"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "thumb_BedAkDabpbbc_1725992338552.jpg",
 *                             "size": 106009,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "uBEan9SlXpkDVJaNyT4spMQ4O6f5Qy3o"
 *                         }
 *                     }
 *                 },
 *                 "lastMessage": {
 *                     "messageId": "69bd341ea18ecb0ee9df0b2c",
 *                     "message": "test",
 *                     "created": 1774007325988,
 *                     "type": 1,
 *                     "sentTo": [
 *                         "63dccc42bcc5921af87df5ce"
 *                     ],
 *                     "seen": true
 *                 },
 *                 "keyword": "Major_Kira_Nerys, test",
 *                 "unreadCount": 0,
 *                 "firstMessageUserId": "63dccc42bcc5921af87df5ce",
 *                 "__v": 0,
 *                 "lastUpdateUnreadCount": 1779450797500,
 *                 "updatedAt": "2026-05-22T11:53:17.500Z",
 *                 "channel": "internal",
 *                 "orderStatus": "delivered",
 *                 "orderPrice": {
 *                     "countryCode": "NG",
 *                     "currency": "NGN",
 *                     "value": 100
 *                 },
 *                 "user": {
 *                     "_id": "63dccc42bcc5921af87df5ce",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "Global",
 *                             "accountNumber": "1234567890",
 *                             "code": "011",
 *                             "merchantCode": "16766337",
 *                             "selected": true,
 *                             "lightningUserName": "16766337",
 *                             "lightningAddress": "16766337@v2.flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7A3J9ENXCMMD9EJX2A309EMK2MRV944KUMMHDCHKCMN4WFK8QTE3XCMNVD3NXVMSFNA96T"
 *                         }
 *                     ],
 *                     "created": 1675414594155,
 *                     "phoneNumber": "+2347087677188",
 *                     "userName": "Major_Kira_Nerys",
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
 *                     "onlineStatus": null,
 *                     "lastSeen": 1779262856066
 *                 }
 *             },
 *             {
 *                 "_id": "655de75deae8965ceae9bbf2",
 *                 "userId": "641d9c333478cf0d6a500547",
 *                 "chatId": "63e0d656a62453346de15e37",
 *                 "chatType": 1,
 *                 "lastUpdate": 1745487998241,
 *                 "lastUpdateUser": {
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1675941548.jpg",
 *                             "size": 2459644,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "gSAor1NEcOI80CxOyiWIUDdtWBDufdmS"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1675941548.jpg",
 *                             "size": 102000,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "giQmiVnX13ZmjjmHTHxCRlOItmZIWiOL"
 *                         }
 *                     },
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "40200168",
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7ENVDAKJUER9WCHJUAM9D3KZ66MWDAMKUTMVDE6HYMRS9U6RQV3SXQCNVWQV2YVW6"
 *                         }
 *                     ],
 *                     "_id": "63e0d656a62453346de15e37",
 *                     "name": "Mer01",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "created": 1675679318902,
 *                     "phoneNumber": "+2348020000001",
 *                     "description": ""
 *                 },
 *                 "lastMessage": {
 *                     "messageId": "680a087e260b2f88c80e74cf",
 *                     "message": "test333333333333",
 *                     "created": 1745487998136,
 *                     "type": 1,
 *                     "sentTo": [
 *                         "641d9c333478cf0d6a500547"
 *                     ],
 *                     "seen": true
 *                 },
 *                 "keyword": "Mer01, test333333333333",
 *                 "unreadCount": 0,
 *                 "firstMessageUserId": "641d9c333478cf0d6a500547",
 *                 "__v": 0,
 *                 "lastUpdateUnreadCount": 1776877603853,
 *                 "updatedAt": "2026-04-22T17:06:43.853Z",
 *                 "channel": "internal",
 *                 "orderStatus": "shipped",
 *                 "orderPrice": {
 *                     "countryCode": "NG",
 *                     "currency": "NGN",
 *                     "value": 100
 *                 },
 *                 "user": {
 *                     "_id": "63e0d656a62453346de15e37",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "merchantCode": "40200168",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7ENVDAKJUER9WCHJUAM9D3KZ66MWDAMKUTMVDE6HYMRS9U6RQV3SXQCNVWQV2YVW6"
 *                         }
 *                     ],
 *                     "created": 1675679318902,
 *                     "phoneNumber": "+2348020000001",
 *                     "userName": "Mer01",
 *                     "avatar": {
 *                         "picture": {
 *                             "originalName": "imageA_1675941548.jpg",
 *                             "size": 2459644,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "gSAor1NEcOI80CxOyiWIUDdtWBDufdmS"
 *                         },
 *                         "thumbnail": {
 *                             "originalName": "imageA_1675941548.jpg",
 *                             "size": 102000,
 *                             "mimeType": "image/png",
 *                             "nameOnServer": "giQmiVnX13ZmjjmHTHxCRlOItmZIWiOL"
 *                         }
 *                     },
 *                     "onlineStatus": null,
 *                     "lastSeen": 1782890849530
 *                 }
 *             },
 *             {
 *                 "_id": "64eddc9616dfc872d2cae50a",
 *                 "userId": "641d9c333478cf0d6a500547",
 *                 "chatId": "63dceca0c30542684f1b7b68",
 *                 "chatType": 1,
 *                 "lastUpdate": 1729587893802,
 *                 "lastUpdateUser": {
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
 *                     },
 *                     "bankAccounts": [
 *                         {
 *                             "merchantCode": "40200168",
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7ENVDAKJUER9WCHJUAM9D3KZ66MWDAMKUTMVDE6HYMRS9U6RQV3SXQCNVWQV2YVW6"
 *                         }
 *                     ],
 *                     "_id": "63dceca0c30542684f1b7b68",
 *                     "name": "mer19abc",
 *                     "organizationId": "5caf3119ec0abb18999bd753",
 *                     "created": 1675422880810,
 *                     "phoneNumber": "+2348020000019",
 *                     "description": "kgkvkvkvlbjvjvkvkvjvjv kvkvkvkv ist eine von den meisten anderen"
 *                 },
 *                 "lastMessage": {
 *                     "messageId": "67176ab5ef1d3ed765ce0f75",
 *                     "message": "https://v1.flom.dev/api/v2/bless/emojis/bless26.webp",
 *                     "created": 1729587893790,
 *                     "type": 114,
 *                     "sentTo": [
 *                         "641d9c333478cf0d6a500547"
 *                     ],
 *                     "seen": true
 *                 },
 *                 "keyword": "mer19abc, https://v1.flom.dev/api/v2/ble",
 *                 "unreadCount": 0,
 *                 "firstMessageUserId": "63dceca0c30542684f1b7b68",
 *                 "__v": 0,
 *                 "lastUpdateUnreadCount": 1775761175649,
 *                 "updatedAt": "2026-04-09T18:59:35.649Z",
 *                 "channel": "internal",
 *                 "orderStatus": "shipped",
 *                 "orderPrice": {
 *                     "countryCode": "NG",
 *                     "currency": "NGN",
 *                     "value": 100
 *                 },
 *                 "user": {
 *                     "_id": "63dceca0c30542684f1b7b68",
 *                     "bankAccounts": [
 *                         {
 *                             "name": "SampleAcc",
 *                             "accountNumber": "1503567574679",
 *                             "code": "",
 *                             "merchantCode": "40200168",
 *                             "selected": true,
 *                             "lightningUserName": "40200168",
 *                             "lightningAddress": "40200168@flom.dev",
 *                             "lightningUrlEncoded": "LNURL1DP68GURN8GHJ7ENVDAKJUER9WCHJUAM9D3KZ66MWDAMKUTMVDE6HYMRS9U6RQV3SXQCNVWQV2YVW6"
 *                         }
 *                     ],
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
 *                     },
 *                     "onlineStatus": null,
 *                     "lastSeen": 1782936199640
 *                 }
 *             }
 *         ],
 *         "paginationData": {
 *             "total": 5,
 *             "hasNext": false,
 *             "page": 1,
 *             "size": 11
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
 * @apiError (Errors) 443226 Invalid type parameter
 * @apiError (Errors) 4000007 Token not valid
 */

router.get("/", auth({ allowUser: true }), async function (request, response) {
  try {
    const { user } = request;
    const { type, page: p, size: s } = request.query;

    let page;
    if (!p || isNaN(+p) || +p < 1) {
      page = 1;
    } else {
      page = +p;
    }

    let size;
    if (!s || isNaN(+s) || +s < 1) {
      size = Const.newPagingRows;
    } else {
      size = +s;
    }

    const res = await getInbox({ user, type, page, size });

    if (res.errCode) {
      return Base.newErrorResponse({
        response,
        code: res.errCode,
        message: "InboxController, " + res.errMsg,
      });
    }

    const responseData = {
      histories: res.histories,
    };

    if (res.paginationData) {
      responseData.paginationData = res.paginationData;
    }

    Base.successResponse(response, Const.responsecodeSucceed, responseData);
  } catch (error) {
    Base.newErrorResponse({
      response,
      message: "InboxController",
      error,
    });
  }
});

async function getInbox({ user, type, page, size }) {
  if (type === "all") {
    return await getAllInbox({ user, page, size });
  }

  try {
    const userId = user._id.toString();

    if (!type || !["waiting", "follow_up", "paid", "all"].includes(type)) {
      return { errCode: Const.responsecodeInvalidTypeParameter, errMsg: "invalid type: " + type };
    }

    const query = { "seller._id": userId };

    switch (type) {
      case "waiting":
        query.status = {
          $in: [Const.orderStatus.PAYMENT_PENDING, Const.orderStatus.PAYMENT_FAILED],
        };
        break;
      case "follow_up":
        query.status = { $in: [Const.orderStatus.PAYMENT_COMPLETED, Const.orderStatus.SHIPPED] };
        break;
      case "paid":
        query.status = {
          $in: [Const.orderStatus.PAYMENT_COMPLETED, Const.orderStatus.SHIPPED],
        };
        break;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    const existingBuyerIds = [];
    const orderToBuyerIdMap = {};
    const mostRecentOrdersForUniqueBuyers = orders.filter((order) => {
      const shouldInclude = !existingBuyerIds.includes(order.buyer._id);
      if (shouldInclude) {
        existingBuyerIds.push(order.buyer._id);
        orderToBuyerIdMap[order.buyer._id] = order;
      }
      return shouldInclude;
    });

    const uniqueBuyerIds = Array.from(new Set(existingBuyerIds));
    const histories = await History.find({ userId, chatId: { $in: uniqueBuyerIds }, chatType: 1 })
      .sort({ lastUpdate: -1 })
      .lean();

    const otherUsers = await User.find(
      { _id: { $in: uniqueBuyerIds } },
      { _id: 1, userName: 1, created: 1, phoneNumber: 1, avatar: 1, bankAccounts: 1 },
    ).lean();
    const otherUsersMap = {};
    otherUsers.forEach((otherUser) => {
      otherUsersMap[otherUser._id.toString()] = otherUser;
    });

    histories.forEach((history) => {
      history.orderStatus = orderToBuyerIdMap[history.chatId]?.status || null;
      history.orderPrice = orderToBuyerIdMap[history.chatId]?.price || null;
      history.user = otherUsersMap[history.chatId] || null;
      if (history.user) {
        history.user._id = history.user._id.toString();
      }
    });

    return { histories };
  } catch (error) {
    logger.error("InboxController, getInbox", error);
    return { histories: [] };
  }
}

async function getAllInbox({ user, page, size }) {
  try {
    const userId = user._id.toString();
    const userName = user.userName;

    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    const inactiveOrderStatuses = [
      Const.orderStatus.DELIVERED,
      Const.orderStatus.CLOSED_BY_SUPPORT,
      Const.orderStatus.CANCELED,
    ];

    const activeBuyerIds = [];
    const uniqueBuyerIds = [];
    const mostRecentOrderToBuyerIdMap = {};
    orders.forEach((order) => {
      const shouldInclude = !uniqueBuyerIds.includes(order.buyer._id);
      if (shouldInclude) {
        uniqueBuyerIds.push(order.buyer._id);
        mostRecentOrderToBuyerIdMap[order.buyer._id] = order;
      }

      if (!inactiveOrderStatuses.includes(order.status)) {
        activeBuyerIds.push(order.buyer._id);
      }
    });

    const uniqueActiveBuyerIds = Array.from(new Set(activeBuyerIds));

    const histories = await History.find({
      userId,
      chatType: { $ne: Const.chatTypeBroadcastAdmin },
      $or: [
        { chatId: { $in: uniqueActiveBuyerIds }, chatType: Const.chatTypePrivate },
        { lastUpdate: { $gte: Date.now() - 1000 * 60 * 60 * 24 } },
      ],
    })
      .sort({ lastUpdate: -1 })
      .skip((page - 1) * size)
      .limit(size)
      .lean();

    const uniqueChatIds = Array.from(new Set(histories.map((history) => history.chatId)));

    const otherUserIds = [],
      roomIds = [];

    histories.forEach((history) => {
      if (history.chatType === Const.chatTypePrivate) {
        if (history.chatId && !otherUserIds.includes(history.chatId)) {
          otherUserIds.push(history.chatId);
        }
      }
      if (history.chatType === Const.chatTypeRoom) {
        if (history.chatId && !roomIds.includes(history.chatId)) {
          roomIds.push(history.chatId);
        }
      }
    });

    const otherUsers = await User.find(
      { _id: { $in: otherUserIds } },
      { _id: 1, userName: 1, created: 1, phoneNumber: 1, avatar: 1, bankAccounts: 1 },
    ).lean();
    const otherUsersMap = {};
    otherUsers.forEach((otherUser) => {
      otherUsersMap[otherUser._id.toString()] = otherUser;
    });

    const rooms = await Room.find({ _id: { $in: roomIds } }).lean();
    const roomsMap = {};
    rooms.forEach((room) => {
      roomsMap[room._id.toString()] = room;
    });

    const onlineStatuses = await Logics.getUsersOnlineStatus(otherUserIds);

    histories.forEach((history) => {
      history.orderStatus = mostRecentOrderToBuyerIdMap[history.chatId]?.status || null;
      history.orderPrice = mostRecentOrderToBuyerIdMap[history.chatId]?.price || null;

      if (history.chatType === Const.chatTypePrivate) {
        history.user = otherUsersMap[history.chatId] || null;
        if (history.user) {
          history.user._id = history.user._id.toString();
        }

        const onlineStatusObj = onlineStatuses.find((status) => status.userId === history.chatId);
        if (onlineStatusObj) {
          history.user.onlineStatus = onlineStatusObj.onlineStatus;
          history.user.lastSeen = onlineStatusObj.lastSeen || null;
        } else {
          history.user.onlineStatus = null;
          history.user.lastSeen = null;
        }
      }
      if (history.chatType === Const.chatTypeRoom) {
        history.room = roomsMap[history.chatId] || null;
      }
    });

    const total = await History.countDocuments({
      userId,
      chatType: { $ne: Const.chatTypeBroadcastAdmin },
      $or: [
        { chatId: { $in: uniqueActiveBuyerIds }, chatType: Const.chatTypePrivate },
        { lastUpdate: { $gte: Date.now() - 1000 * 60 * 60 * 24 } },
      ],
    });

    if (page === 1) {
      await addBroadcastHistory({ histories, userId, userName });
    }

    const paginationData = {
      total,
      hasNext: page * size < total,
      page,
      size: page === 1 ? size + 1 : size,
    };

    return { histories, paginationData };
  } catch (error) {
    logger.error("InboxController, getAllInbox", error);
    return { histories: [], paginationData: {} };
  }
}

async function addBroadcastHistory({ histories, userId, userName }) {
  try {
    const adminBroadcastRoom = await Room.findOne({
      type: Const.chatTypeBroadcastAdmin,
    }).lean();

    const broadcastHistory = await History.findOne({
      userId: userId.toString(),
      chatId: adminBroadcastRoom._id.toString(),
      chatType: Const.chatTypeBroadcastAdmin,
    }).lean();

    const owner = await User.findById(adminBroadcastRoom.owner, {
      userName: 1,
      phoneNumber: 1,
      created: 1,
      avatar: 1,
      bankAccounts: 1,
    }).lean();

    const newHistory = broadcastHistory
      ? broadcastHistory
      : (
          await History.create({
            userId: userId.toString(),
            chatId: adminBroadcastRoom._id.toString(),
            chatType: Const.chatTypeBroadcastAdmin,
            lastUpdate: 0,
            lastUpdateUnreadCount: 0,
            unreadCount: 0,
            keyword: `Admin broadcasts for ${userName}`,
          })
        ).toObject();

    newHistory.broadcast = {
      _id: adminBroadcastRoom._id.toString(),
      name: adminBroadcastRoom.name,
      created: adminBroadcastRoom.created,
      avatar: adminBroadcastRoom.avatar,
      owner: owner,
    };

    histories.unshift(newHistory);
  } catch (error) {
    logger.error("InboxController, addBroadcastHistory", error);
    return;
  }
}

module.exports = router;
