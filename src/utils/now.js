function now() {
  Date.now =
    Date.now ||
    function () {
      return new Date();
    };

  return Date.now();
}

module.exports = now;
