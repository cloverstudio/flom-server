function stripPrivateData(o) {
  for (const key in o) {
    const child = o[key];
    if (typeof child === "object") {
      stripPrivateData(child);
    } else {
      if (key == "password") o[key] = "*****";
      if (key == "token") o[key] = "*****";
      if (key == "muted") o[key] = null;
      if (key == "blocked") o[key] = null;
    }
  }
}

module.exports = stripPrivateData;
