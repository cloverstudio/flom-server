function getLocalDateString(timestamp) {
  const time = new Date(timestamp);
  const year = time.getFullYear();
  const month = time.getMonth() + 1;
  const day = time.getDate();

  const monthFixed = month.toString().length === 1 ? `0${month}` : month;
  const dayFixed = day.toString().length === 1 ? `0${day}` : day;

  return `${year}-${monthFixed}-${dayFixed}`;
}

module.exports = getLocalDateString;
