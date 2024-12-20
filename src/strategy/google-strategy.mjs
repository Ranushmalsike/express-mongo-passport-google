import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20';
import dotenv from 'dotenv';
import User from '../schema/schema.mjs';

dotenv.config({ path: './.env' });

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user || false);
  } catch (error) {
    console.error("Error deserializing user:", error);
    done(error, null);
  }
});

// Helper function to fetch user by ID
async function getUserById(id) {
  try {
    const user = await User.findById(id); // Using Mongoose's `findById` method
    return user;
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

// Configure Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/redirect',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find the user by Google ID
        let user = await User.findOne({ google: profile.id });

        if (!user) {
          // Create a new user if not found
          user = new User({
            name: profile.displayName,
            google: profile.id,
          });
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error("Error during Google OAuth:", error);
        return done(error, null);
      }
    }
  )
);

export default passport;
