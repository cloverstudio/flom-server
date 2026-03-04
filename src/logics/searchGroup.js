const { logger } = require("#infra");
const { Const } = require("#config");
const Utils = require("#utils");
const { Group, User } = require("#models");

const permissionLogic = require("./permissionLogic");

async function searchGroup(baseUser, keyword, page) {
  try {
    const result = {};

    const user = baseUser;
    const userId = user._id.toString();
    const organizationId = user.organizationId;

    const departments = await permissionLogic.getDepartments(userId);
    result.departmentIds = departments;

    const conditions = {
      $and: [{ organizationId }, { $or: [{ users: userId }, { _id: { $in: departments } }] }],
    };

    if (keyword) {
      conditions["$and"].push({
        $or: [
          { name: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
          { description: new RegExp("^.*" + Utils.escapeRegExp(keyword) + ".*$", "i") },
        ],
      });
    }

    const groups = await Group.find(conditions)
      .skip(Const.pagingRows * page)
      .sort({ sortName: "asc" })
      .limit(Const.pagingRows)
      .lean();
    result.list = groups;

    const count = await Group.countDocuments(conditions);
    result.count = count;

    const userIds = new Set();
    groups.forEach((group) => {
      group.users.forEeach((id) => userIds.add(id));
    });

    const usersFromGroups = await User.find({ _id: { $in: Array.from(userIds) } }).lean();

    groups.forEach((group, i) => {
      result.list.users = Array.from(new Set(...group.users));

      const groupUsers = usersFromGroups.filter((u) => group.users.includes(u._id.toString()));
      result.list[i].usersCount = group.users.length;
      result.list[i].userModels = groupUsers.slice(0, 4);
    });

    return result;
  } catch (error) {
    logger.error("searchGroup error: ", error);
    return;
  }
}

module.exports = searchGroup;
