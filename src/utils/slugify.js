const s = require("slugify");
const { logger } = require("#infra");

const excludeList = [
  "flom",
  "flomer",
  "discover",
  "gift",
  "meet",
  "login",
  "api",
  "admin",
  "dashboard",
  "user",
  "users",
  "account",
  "accounts",
  "profile",
  "profiles",
  "settings",
  "support",
  "help",
  "contact",
  "about",
  "terms",
  "privacy",
  "policy",
  "policies",
  "blog",
  "blogs",
  "news",
  "events",
  "event",
  "events",
  "shop",
  "shopping",
  "cart",
  "checkout",
  "payment",
  "payments",
  "order",
  "orders",
  "product",
  "products",
];

function slugify({ text, separator = "-" }) {
  try {
    if (typeof text !== "string" || !text.trim()) {
      return null;
    }

    text = text
      .trim()
      .normalize("NFKD")
      .replace(/[\p{Cf}\p{Cc}]/gu, ""); // Remove control characters and format characters

    if (!text) {
      return null;
    }

    const slug = s(text, {
      trim: true, // Remove leading and trailing whitespace
      replacement: separator, // Replace spaces with the specified separator
      lower: true, // Convert to lowercase
      strict: true, // Remove special characters
    });

    if (excludeList.includes(slug)) {
      return null;
    }

    return slug;
  } catch (error) {
    logger.error("Error in slugify:", error);
    return null;
  }
}

module.exports = slugify;
