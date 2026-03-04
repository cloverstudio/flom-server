module.exports = {
  // Lazy-load all recombee functions via getter
  get recombee() {
    return require("./recombee");
  },

  // Other services can stay normal
  get Localizer() {
    return require("./localizer");
  },

  get scheduler() {
    return require("./scheduler");
  },

  get authorizeNet() {
    return require("./authorize-net");
  },
};
