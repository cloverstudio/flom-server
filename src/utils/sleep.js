function sleep(msec) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    }, msec);
  });
}

module.exports = sleep;
