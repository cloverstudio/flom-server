const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { User, Organization, UserContact } = require("#models");

const permissionLogic = require("./permissionLogic");
const getUserOnlineStatus = require("./getUsersOnlineStatus");

async function searchUser(baseUser, keyword, page) {
  try {
    let result;

    if (Config.phoneNumberSignin) {
      result = await searchContacts(baseUser, keyword, page);
    } else if (/.*@.*/.test(keyword)) {
      result = await searchPerson(baseUser, keyword, page);
    } else {
      result = await searchOrganization(baseUser, keyword, page);
    }

    return result;
  } catch (error) {
    logger.error("searchUser error: ", error);
    return;
  }
}

async function searchPerson(baseUser, keyword, page) {
  try {
    const splitted = keyword.split("@");
    const userId = splitted[0];
    const organizationId = splitted[1];

    if (!userId || !organizationId) {
      return { list: [], count: 0 };
    }

    const organization = await Organization.findOne({ organizationId }).lean();
    const user = await User.findOne({
      userid: userId,
      organizationId: organization._id.toString(),
    }).lean();

    if (user && organization) {
      return { list: [user], count: 1 };
    } else {
      return { list: [], count: 0 };
    }
  } catch (error) {
    logger.error("searchPerson error: ", error);
    return { list: [], count: 0 };
  }
}

async function searchOrganization(baseUser, keyword, page) {
  try {
    const user = baseUser;
    const organizationId = baseUser.organizationId;

    const userDeps = await permissionLogic.getDepartments(user._id.toString());
    const groups = Array.from(new Set(user.groups.concat(userDeps)));
    const query = {
      organizationId: organizationId,
      status: 1,
      groups: { $in: groups },
      _id: { $ne: user._id },
    };
    if (!keyword) {
      query["$or"] = [
        { name: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        { sortName: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        { description: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
      ];
    }

    const users = await User.find(query)
      .skip(Const.pagingRows * page)
      .sort({ sortName: "asc" })
      .limit(Const.pagingRows)
      .lean();

    const count = await User.countDocuments(query);

    const userIds = users.map((u) => u._id.toString());
    const onlineStatusArray = await getUserOnlineStatus(userIds);
    users.forEach((u) => {
      u.onlineStatus =
        onlineStatusArray.find((s) => s.userId.toString() === u._id.toString()).onlineStatus ||
        null;
    });

    return { list: users, count: count };
  } catch (error) {
    logger.error("searchOrganization error: ", error);
    return { list: [], count: 0 };
  }
}

async function searchContacts(baseUser, keyword, page) {
  try {
    const user = baseUser;

    const userContacts = await UserContact.find({ userId: user._id.toString() }).lean();

    const query = {
      _id: { $in: userContacts.map((uc) => uc.contactId) },
    };

    if (!keyword) {
      query["$or"] = [
        { name: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        { sortName: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        { description: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
      ];
    }

    const users = await User.find(query)
      .skip(Const.pagingRows * page)
      .sort({ sortName: "asc" })
      .limit(Const.pagingRows)
      .lean();

    const count = await User.countDocuments(query);

    const fixedUsers = users.map((u) => {
      const contact = userContacts.find((uc) => uc.contactId === u._id.toString());
      if (contact) u.name = contact.name;

      return u;
    });

    const userIds = fixedUsers.map((u) => u._id.toString());
    const onlineStatusArray = await getUserOnlineStatus(userIds);
    fixedUsers.forEach((u) => {
      u.onlineStatus =
        onlineStatusArray.find((s) => s.userId.toString() === u._id.toString()).onlineStatus ||
        null;
    });

    return { list: fixedUsers, count: count };
  } catch (error) {
    logger.error("searchContacts error: ", error);
    return { list: [], count: 0 };
  }
}

module.exports = searchUser;
