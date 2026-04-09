"use strict";

const { logger } = require("#infra");
const { Const, Config } = require("#config");
const Utils = require("#utils");
const { Room, User } = require("#models");
const { updateHistory } = require("#logics");
const { socketApi } = require("#sockets");
const mediaHandler = require("#media");

const formatTribe = (tribe) => {
  delete tribe.__v;

  tribe.numberOfMembers = tribe.members.accepted.length;

  return tribe;
};

const checkUsers = async ({ members, membersWithRoles, ownerId, requestUserId }) => {
  const usersRoles = new Map();
  let userIds = [];

  if (membersWithRoles) {
    let membersWithRolesParsed;
    try {
      membersWithRolesParsed = JSON.parse(membersWithRoles);
    } catch (error) {
      return {
        code: Const.responsecodeTribeMembersWithRolesParsing,
        message: `membersWithRoles parsing error`,
      };
    }

    const membersWithRolesChecked = membersWithRolesParsed.filter(
      (member) =>
        Utils.isValidObjectId(member?.id) &&
        member?.id !== requestUserId &&
        Const.tribeMemberRoles.indexOf(member?.role) !== -1,
    );
    if (membersWithRolesParsed.length !== membersWithRolesChecked.length) {
      return {
        code: Const.responsecodeTribeInvalidMembersToInvite,
        message: `invalid membersWithRoles parameter`,
      };
    }

    membersWithRolesChecked.forEach((member) => {
      usersRoles.set(member.id, member.role);
      userIds.push(member.id);
    });
  } else {
    userIds =
      typeof members === "string"
        ? members.split(",").filter((id) => Utils.isValidObjectId(id) && id !== requestUserId)
        : [];

    userIds.forEach((id) => usersRoles.set(id, Const.tribeMemberRoleMember));
  }

  let ninQuery = [];
  if (ownerId) ninQuery.push(ownerId);

  const usersFromDb = await User.find(
    { _id: { $in: userIds, $nin: ninQuery } },
    { _id: 1, pushToken: 1 },
  ).lean();

  const formattedUsers = usersFromDb.map((user) => {
    const userId = user._id.toString();
    return { id: userId, role: usersRoles.get(userId) };
  });
  return { formattedUsers, usersToNotify: usersFromDb };
};

const createTribeGroupChat = async ({ owner, tribeName, tribeDescription, image }) => {
  const ownerId = owner._id.toString();
  let avatar = {
    picture: {},
    thumbnail: {},
  };

  if (Object.keys(image).length > 0) {
    avatar = await handleTribeImage(image);
  }

  const groupChat = await Room.create({
    type: Const.chatTypeRoom,
    tribeRoom: 1,
    owner: ownerId,
    admins: [ownerId],
    organizationId: owner.ownerOrganizationId,
    users: [ownerId],
    name: tribeName,
    description: tribeDescription,
    avatar,
  });

  const groupChatObj = groupChat.toObject();

  await updateHistory.newRoom(groupChatObj);
  socketApi.emitToUser(ownerId, "new_room", { conversation: groupChatObj });

  return groupChatObj;
};

const handleTribeImage = async (image) => {
  try {
    const {
      originalName,
      size: pictureSize,
      mimeType: pictureMimeType,
      nameOnServer: pictureNameOnServer,
      thumbnailName,
    } = image;

    const avatar = {
      picture: {
        originalName,
        size: pictureSize,
        mimeType: pictureMimeType,
        nameOnServer: pictureNameOnServer,
      },
    };

    const { size } = await mediaHandler.getImageInfo(Config.uploadPath + "/" + thumbnailName);

    avatar.thumbnail = {
      originalName,
      size,
      mimeType: "image/jpeg",
      nameOnServer: thumbnailName,
    };

    return avatar;
  } catch (error) {
    logger.error(error);
    throw new Error("Error in handleAvatar");
  }
};

module.exports = {
  formatImageData: (file) => ({
    originalName: file.name,
    size: file.size,
    mimeType: file.type,
    nameOnServer: `upload_${file.path.split("upload_")[1]}`,
    link: `${Config.uploadPath}/upload_${file.path.split("upload_")[1]}`,
  }),

  formatNewTribe: (tribe) => formatTribe(tribe.toObject()),
  formatTribes: (tribes) =>
    tribes.map((tribe) => {
      const t = { ...formatTribe(tribe) };
      delete t.members;
      delete t.description;
      delete t.created;
      delete t.roomId;
      return t;
    }),
  formatTribeForOwner: (tribe) => ({
    ...formatTribe(tribe),
    userStatus: Const.tribeUserStatus.accepted,
  }),
  formatTribeForMember: (tribe) => ({
    ...formatTribe(tribe),
    members: { accepted: tribe.members.accepted },
    userStatus: Const.tribeUserStatus.accepted,
  }),
  formatTribeForOthers: (tribe, status) => {
    const t = {
      ...formatTribe(tribe),
      userStatus: status,
    };
    delete t.members;
    return t;
  },
  checkUsers,
  createTribeGroupChat,
  handleTribeImage,
};
