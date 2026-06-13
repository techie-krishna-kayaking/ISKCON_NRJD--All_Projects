const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // Find user by email only — NO auto creation
        const user = await User.findOne({ email });

        if (!user) {
          return done(null, false, {
            message:
              "No account found for this Google email. Contact your administrator.",
          });
        }

        if (user.provider !== "google") {
          return done(null, false, {
            message:
              "This account uses email/password login. Please use that instead.",
          });
        }

        if (!user.isActive) {
          return done(null, false, {
            message:
              "Your account has been deactivated. Contact your administrator.",
          });
        }

        // First-time Google login — save googleId
        if (!user.googleId) {
          user.googleId = googleId;
          await user.save();
        } else if (user.googleId !== googleId) {
          return done(null, false, {
            message: "Google account mismatch. Unauthorized.",
          });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
