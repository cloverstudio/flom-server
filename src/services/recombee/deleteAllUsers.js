const { logger } = require("#infra");
const { client, rqs } = require("./client").getClientAndRequest();

async function deleteAllUsers() {
  const usersResponse = await client.send(new rqs.ListUsers());

  const deleteRequests = [];

  for (const user of usersResponse) {
    deleteRequests.push(new rqs.DeleteUser(user));
  }

  // Send deletions in batch (SDK auto-splits into 10,000-size batches)
  await client.send(new rqs.Batch(deleteRequests));

  logger.info(`Deleted ${usersResponse.length} users.`);
}

module.exports = deleteAllUsers;
