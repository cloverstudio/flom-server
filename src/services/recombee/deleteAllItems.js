const { logger } = require("#infra");
const { client, rqs } = require("./client").getClientAndRequest();

async function deleteAllItems() {
  const itemsResponse = await client.send(new rqs.ListItems());

  const deleteRequests = [];

  for (const item of itemsResponse) {
    deleteRequests.push(new rqs.DeleteItem(item));
  }

  // Send deletions in batch (SDK auto-splits into 10,000-size batches)
  await client.send(new rqs.Batch(deleteRequests));

  logger.info(`Deleted ${itemsResponse.length} items.`);
}

module.exports = deleteAllItems;
