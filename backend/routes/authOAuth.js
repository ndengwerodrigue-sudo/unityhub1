const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { resolveOAuthUser } = require('../utils/oauthHandler');
const { getGoogleCallbackUrl, getGithubCallbackUrl } = require('../utils/oauthUrls');

function setupOAuthRoutes(router, { getFrontendBase, createOAuthCode, sessionSecret }) {
  const getFrontendCallbackUrl = () => `${getFrontendBase()}/oauth/callback`;

  const oauthErrorRedirect = (message) =>
    `${getFrontendCallbackUrl()}?error=${encodeURIComponent(message)}`;

  const verifyLinkToken = (token, provider) => {
    try {
      const payload = jwt.verify(token, sessionSecret());
      if (payload.purpose !== 'oauth-link' || payload.provider !== provider) return null;
      return payload.userId;
    } catch {
      return null;
    }
  };

  const handleOAuthCallback = (provider) => async (req, res) => {
    try {
      const profile = req.user;
      const linkUserId = readState(req.query.state);

      if (linkUserId) {
        const user = await User.findById(linkUserId);
        if (!user) {
          return res.redirect(oauthErrorRedirect('Account not found'));
        }
        await resolveOAuthUser(provider, profile, linkUserId);
        return res.redirect(`${getFrontendBase()}/profile?connected=${provider}`);
      }

      const user = await resolveOAuthUser(provider, profile);
      const code = await createOAuthCode(user.id);
      return res.redirect(`${getFrontendCallbackUrl()}?code=${code}`);
    } catch (err) {
      console.error(`${provider} OAuth callback error:`, err);
      const msg = err.message?.includes('duplicate') || err.code === '23505'
        ? 'This account is already linked to another user.'
        : 'OAuth sign-in failed. Please try again.';
      return res.redirect(oauthErrorRedirect(msg));
    }
  };

  const buildState = (linkUserId) => {
    if (!linkUserId) return undefined;
    return jwt.sign({ linkUserId, purpose: 'oauth-state' }, sessionSecret(), { expiresIn: '10m' });
  };

  const readState = (state) => {
    if (!state) return null;
    try {
      const payload = jwt.verify(state, sessionSecret());
      if (payload.purpose !== 'oauth-state') return null;
      return payload.linkUserId;
    } catch {
      return null;
    }
  };

  try {
    const passport = require('passport');
    const session = require('express-session');
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    const GitHubStrategy = require('passport-github2').Strategy;

    const hasGoogle = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
    const hasGithub = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;

    if (hasGoogle || hasGithub) {
      if (hasGoogle) console.log('Google OAuth callback:', getGoogleCallbackUrl());
      if (hasGithub) console.log('GitHub OAuth callback:', getGithubCallbackUrl());
      router.use(session({
        secret: sessionSecret(),
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 10 * 60 * 1000,
        },
      }));
      router.use(passport.initialize());
      router.use(passport.session());

      passport.serializeUser((user, done) => done(null, user));
      passport.deserializeUser((obj, done) => done(null, obj));

      if (hasGoogle) {
        passport.use(new GoogleStrategy({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: getGoogleCallbackUrl(),
          scope: ['profile', 'email'],
        }, (accessToken, refreshToken, profile, done) => {
          profile.profileUrl = profile.profileUrl || null;
          done(null, profile);
        }));

        router.get('/google', (req, res, next) => {
          const linkUserId = req.query.link ? verifyLinkToken(req.query.link, 'google') : null;
          if (req.query.link && !linkUserId) {
            return res.redirect(oauthErrorRedirect('Link session expired. Please try connecting again.'));
          }
          passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false,
            state: buildState(linkUserId),
          })(req, res, next);
        });

        router.get('/google/callback',
          passport.authenticate('google', {
            failureRedirect: oauthErrorRedirect('Google sign-in was cancelled or failed'),
            session: false,
          }),
          handleOAuthCallback('google')
        );
      } else {
        router.get('/google', (_req, res) => res.status(501).json({ message: 'Google OAuth not configured' }));
      }

      if (hasGithub) {
        passport.use(new GitHubStrategy({
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: getGithubCallbackUrl(),
          scope: ['user:email'],
        }, (accessToken, refreshToken, profile, done) => {
          profile.profileUrl = profile.profileUrl || profile._json?.html_url || null;
          done(null, profile);
        }));

        router.get('/github', (req, res, next) => {
          const linkUserId = req.query.link ? verifyLinkToken(req.query.link, 'github') : null;
          if (req.query.link && !linkUserId) {
            return res.redirect(oauthErrorRedirect('Link session expired. Please try connecting again.'));
          }
          passport.authenticate('github', {
            scope: ['user:email'],
            session: false,
            state: buildState(linkUserId),
          })(req, res, next);
        });

        router.get('/github/callback',
          passport.authenticate('github', {
            failureRedirect: oauthErrorRedirect('GitHub sign-in was cancelled or failed'),
            session: false,
          }),
          handleOAuthCallback('github')
        );
      } else {
        router.get('/github', (_req, res) => res.status(501).json({ message: 'GitHub OAuth not configured' }));
      }
    } else {
      router.get('/google', (_req, res) => res.status(501).json({ message: 'Google OAuth not configured' }));
      router.get('/github', (_req, res) => res.status(501).json({ message: 'GitHub OAuth not configured' }));
    }
  } catch (e) {
    console.warn('OAuth setup skipped:', e.message);
    router.get('/google', (_req, res) => res.status(501).json({ message: 'Google OAuth not available' }));
    router.get('/github', (_req, res) => res.status(501).json({ message: 'GitHub OAuth not available' }));
  }
}

module.exports = { setupOAuthRoutes };
