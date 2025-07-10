const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const {getUserByEmail, getUserById} = require("../db/queries/userQueries")

passport.use(new LocalStrategy({usernameField: 'email'}, async (email, password, done) => {
  try {
    const user = await getUserByEmail(email);

    if (!user) {
      return done(null, false, {message: "Incorrect email"})
    }

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return done(null, false, {message: "Incorrect password"})
    }

    return done(null, user)

  } catch (error) {
    return done(error)
  }
}))

passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser(async(id, done) => {
  try {
    const user = await getUserById(id);

    // remove user.password from the user session object
    delete user.password;
    done(null, user)
  } catch (error) {
    done(error)
  }
})