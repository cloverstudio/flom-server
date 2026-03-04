const i18next = require("i18next");
const Backend = require("i18next-fs-backend");

i18next.use(Backend).init({
  fallbackLng: "en",
  preload: [
    "am",
    "ar",
    "en",
    "es",
    "fr",
    "ha",
    "hr",
    "ht",
    "ig",
    "ja",
    "ko",
    "kua",
    "my",
    "pcm",
    "pi",
    "pl",
    "pt",
    "tn",
    "vi",
    "yo",
    "zh",
  ],
  ns: ["errors", "strings"],
  backend: {
    loadPath: __dirname + "/../locales/{{lng}}/{{ns}}.json",
  },
});

function localizeText({ text, lang, param, param2, target }) {
  return i18next.t(text, { lng: lang, param, param2, ns: target });
}

class Localizer {
  constructor(lang) {
    this.lang = lang ?? "en";
  }

  e(text, param, param2) {
    return localizeText({ text, lang: this.lang, param, param2, target: "errors" });
  }
  s(text, param, param2) {
    return localizeText({ text, lang: this.lang, param, param2, target: "strings" });
  }
}

module.exports = Localizer;
