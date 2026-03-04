const { Const } = require("#config");

function generateSocialMediaWithLinks({ socialMedia }) {
  let socMediaArray = [];

  if (socialMedia && socialMedia.length) {
    const linkTemplate = Const.socialMediaLinkTemplate;
    for (let i = 0; i < socialMedia.length; i++) {
      if (!socialMedia[i]) continue;

      const links = linkTemplate[socialMedia[i]?.type];
      const username = socialMedia[i]?.username;
      if (links && username) {
        if (links.profileWebUrl) {
          socialMedia[i].profileWebUrl = links.profileWebUrl.replace("{username}", username);
        }
        if (links.profileIOSUrl) {
          socialMedia[i].profileIOSUrl = links.profileIOSUrl.replace("{username}", username);
        }
        if (links.profileAndroidUrl) {
          socialMedia[i].profileAndroidUrl = links.profileAndroidUrl.replace(
            "{username}",
            username
          );
        }
      }

      socMediaArray.push(socialMedia[i]);
    }
  }
  return socMediaArray;
}

module.exports = generateSocialMediaWithLinks;
