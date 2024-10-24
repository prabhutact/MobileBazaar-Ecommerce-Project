
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth2').Strategy;
passport.use(new GoogleStrategy({
    clientID: "758178201442-ur27dq0eomlshke2bjea3pod6ad156r2.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL:  "/auth/google/callback",
    passReqToCallback: true
},
    async function (request, accessToken, refreshToken, profile, done) {
      
        return done (null,profile)
    }
));

passport.serializeUser(function (user, done) {
    done(null, user)
})

passport.deserializeUser(function (user, done) {
    done(null, user)
})