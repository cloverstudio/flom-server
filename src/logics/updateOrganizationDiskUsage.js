// UpdateOrganizationDiskUsage

const { logger } = require("#infra");
const { Organization } = require("#models");

async function updateOrganizationDiskUsage(organizationId, size) {
  try {
    const org = await Organization.findById(organizationId);

    if (!org) return;

    if (org.diskUsage) org.diskUsage += size;
    else org.diskUsage = size;

    await org.save();

    return;
  } catch (error) {
    logger.error("updateOrganizationDiskUsage error: ", error);
    return;
  }
}

module.exports = updateOrganizationDiskUsage;
