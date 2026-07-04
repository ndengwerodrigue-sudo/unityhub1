export { isSameUserId } from './post';

export function isResourceOwner(resource, user) {
  if (!resource || !user) return false;
  const ownerId = resource.createdBy ?? resource.created_by ?? resource.ownerId;
  const userId = user.id ?? user._id;
  return String(ownerId).trim().toLowerCase() === String(userId).trim().toLowerCase();
}

export function getUserId(user) {
  return user?.id ?? user?._id ?? null;
}
