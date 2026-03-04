const { countries } = require("#config");

const languages = [];

async function isLanguageValid(language) {
  if (languages.length === 0) {
    for (const countryCode in countries) {
      const country = countries[countryCode];
      languages.push(...country.languages);
    }
  }

  if (!language) return false;

  return languages.includes(language);
}

module.exports = isLanguageValid;
