/** Compare user IDs safely (UUID strings, legacy _id fields) */
function sameUserId(a, b) {
  if (a == null || b == null) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function isOwner(resource, userId) {
  if (!resource || userId == null) return false;
  const ownerId = resource.createdBy ?? resource.created_by ?? resource.ownerId ?? resource.owner_id;
  return sameUserId(ownerId, userId);
}

function isAdmin(user) {
  return user?.role === 'admin';
}

function canManageResource(resource, user) {
  if (!user) return false;
  const userId = user.id || user._id;
  return isOwner(resource, userId) || isAdmin(user);
}

module.exports = {
  sameUserId,
  isOwner,
  isAdmin,
  canManageResource,
};
