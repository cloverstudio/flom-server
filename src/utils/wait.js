function wait(sec) {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    }, sec * 1000);
  });
}

module.exports = wait;
