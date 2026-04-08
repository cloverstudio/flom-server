const BadWordsNext = require("bad-words-next");
const badWords = new BadWordsNext();

function hideBadWords(text) {
  const en = require("bad-words-next/data/en.json");
  const fr = require("bad-words-next/data/fr.json");
  const es = require("bad-words-next/data/es.json");

  badWords.add(en);
  badWords.add(fr);
  badWords.add(es);

  return badWords.filter(text);
}

module.exports = hideBadWords;
