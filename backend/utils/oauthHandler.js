const crypto = require('crypto');
const User = require('../models/User');

async function resolveOAuthUser(provider, profile, linkUserId = null) {
  const providerId = String(profile.id);
  const email = profile.emails?.find((e) => e.verified)?.value
    || profile.emails?.[0]?.value
    || profile._json?.email
    || null;
  const emailVerified = !!profile.emails?.find((e) => e.verified)?.value
    || provider === 'google';
  const name = profile.displayName || profile.username || profile.name?.givenName || `${provider} User`;
  const avatar = profile.photos?.[0]?.value || profile._json?.avatar_url || '';
  const username = profile.username || profile._json?.login || null;
  const profileUrl = profile.profileUrl || profile._json?.html_url || null;

  const oauthMeta = {
    provider,
    providerId,
    providerUsername: username,
    profileUrl,
    email,
    emailVerified,
    name,
    avatar,
  };

  if (linkUserId) {
    const user = await User.findById(linkUserId);
    if (!user) throw new Error('User not found for linking');
    await User.linkOAuthProvider(linkUserId, oauthMeta);
    await User.updateLastLogin(linkUserId);
    return User.findById(linkUserId);
  }

  let user = await User.findByOAuthProvider(provider, providerId);
  if (user) {
    await User.updateLastLogin(user.id);
    return user;
  }

  if (email) {
    user = await User.findOne({ email });
    if (user) {
      await User.linkOAuthProvider(user.id, oauthMeta);
      if (emailVerified) await User.setEmailVerified(user.id, true);
      await User.updateLastLogin(user.id);
      return User.findById(user.id);
    }
  }

  user = await User.createFromOAuth(oauthMeta);
  await User.updateLastLogin(user.id);
  return user;
}

module.exports = { resolveOAuthUser };
