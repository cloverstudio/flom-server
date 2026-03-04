function filterExpiredMemberships(userMemberships) {
  if (!userMemberships) return [];
  const timeNow = Date.now();
  return userMemberships.filter(
    (membership) => membership.expirationDate === -1 || membership.expirationDate > timeNow
  );
}

module.exports = filterExpiredMemberships;
