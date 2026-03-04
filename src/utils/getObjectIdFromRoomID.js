function getObjectIdFromRoomID(roomID) {
  const splited = roomID.split("-");
  if (splited.length > 1) return splited[1];

  return null;
}

module.exports = getObjectIdFromRoomID;
