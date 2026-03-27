const checkCommunityVisibility = require("./checkCommunityVisibility");
const checkDraftProduct = require("./checkDraftProduct");
const checkTribeVisibility = require("./checkTribeVisibility");
const isLanguageValid = require("./isLanguageValid");
const { handleVideoFile, handleImageFile, handleAudioFile, deleteFile } = require("./handleFiles");
const sendApprovedProductNotifications = require("./sendApprovedProductNotifications");
const sendApprovedProductBonuses = require("./sendApprovedProductBonuses");
const sendNewsletterToSubscribers = require("./sendNewsletterToSubscribers");

module.exports = {
  checkCommunityVisibility,
  checkDraftProduct,
  checkTribeVisibility,
  isLanguageValid,
  handleVideoFile,
  handleImageFile,
  handleAudioFile,
  deleteFile,
  sendApprovedProductNotifications,
  sendApprovedProductBonuses,
  sendNewsletterToSubscribers,
};
