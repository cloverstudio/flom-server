const { Tag } = require("#models");

async function handleTags({ oldTags = "", newTags = "" }) {
  if (!newTags) {
    return { tags: "", tagIds: [] };
  }

  const oldTagsArray = parseTags(oldTags);
  const newTagsArray = parseTags(newTags);
  const tagsSet = new Set([...oldTagsArray, ...newTagsArray]);
  const tagsArray = Array.from(tagsSet);

  const tagsMap = {};

  const tagsFromDb = await Tag.find({ name: { $in: tagsArray } }).lean();
  tagsFromDb?.forEach((tag) => {
    tagsMap[tag.name] = {
      id: tag._id.toString(),
      count: tag.count,
    };
  }, {});

  const tagsToAdd = [],
    tagsToDelete = [],
    tagsToIncrease = [],
    tagsToDecrease = [];

  for (const tag of oldTagsArray) {
    if (!newTagsArray.includes(tag)) {
      if (tagsMap[tag] && tagsMap[tag].count > 1) {
        tagsToDecrease.push(tag);
      } else {
        tagsToDelete.push(tag);
      }
    }
  }

  for (const tag of newTagsArray) {
    if (!oldTagsArray.includes(tag)) {
      if (tagsMap[tag]) {
        tagsToIncrease.push(tag);
      } else {
        tagsToAdd.push(tag);
      }
    }
  }

  const newTagsInDb = await Tag.create(
    tagsToAdd.map((tag) => {
      return { name: tag, count: 1 };
    })
  );
  newTagsInDb?.forEach((tag) => {
    tagsMap[tag.name] = { id: tag._id.toString(), count: tag.count };
  });

  await Tag.deleteMany({ name: { $in: tagsToDelete } });
  await Tag.updateMany({ name: { $in: tagsToIncrease } }, { $inc: { count: 1 } });
  await Tag.updateMany({ name: { $in: tagsToDecrease } }, { $inc: { count: -1 } });

  return {
    tags: "#" + newTagsArray.join(" #"),
    tagIds: newTagsArray.map((tag) => tagsMap[tag]?.id),
  };
}

function parseTags(tags) {
  if (!tags) return [];

  //remove blank spaces
  tags = tags.trim();
  //if ends with #, remove it
  if (tags.endsWith("#")) {
    tags = tags.substring(0, tags.length - 2);
  }
  //if there are blank spaces after # is removed, remove them
  tags = tags.trim();

  const arrayOfTags = tags.split(" ").filter((tag) => tag !== "");
  //remove # before each tag to get only name
  for (let i = 0; i < arrayOfTags.length; i++) {
    if (arrayOfTags[i] === "#") continue;
    if (arrayOfTags[i].startsWith("#")) arrayOfTags[i] = arrayOfTags[i].substring(1);
  }

  return arrayOfTags || [];
}

module.exports = handleTags;
