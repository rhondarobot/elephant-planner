// config/passport.js

// load all the things we need
var EvernoteStrategy   = require('passport-evernote');//evernoteStrategy (passport.use replace with first code and add the 2 routes--login: auth/evernote)

// load up the user model
var User            = require('../app/models/user');
// expose this function to our app using module.exports
module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
    // =========================================================================
    // LOCAL SIGNUP USING SANDBOX===============================================
    // =========================================================================
    // new EvernoteStrategy({
    //   requestTokenURL: 'https://sandbox.evernote.com/oauth',
    //   accessTokenURL: 'https://sandbox.evernote.com/oauth',
    //   userAuthorizationURL: 'https://sandbox.evernote.com/OAuth.action',
    //   consumerKey: 'rhonda',
    //   consumerSecret: '63f07416743f18db',
    //   callbackURL: "http://localhost:8080/auth/evernote/callback"
    // },
    // function(token, tokenSecret, profile, cb) {
    //     User.findOrCreate({ evernoteId: profile.id }, function (err, user) {
    //       return cb(err, user);
    //     });
    //   }
    // ); //?
    passport.use(new EvernoteStrategy({//should the E in evernote be capitalized like the example of new LocalStrategy?
        // by default, local strategy uses username and password, we will override with email
        requestTokenURL: 'https://sandbox.evernote.com/oauth',
        accessTokenURL: 'https://sandbox.evernote.com/oauth',
        userAuthorizationURL: 'https://sandbox.evernote.com/OAuth.action',
        consumerKey: 'rhonda-3605',
        consumerSecret: '47299cd28f534d36',
        callbackURL: "http://localhost:8080/auth/evernote/callback"
    },
    function(token, tokenSecret, profile, cb) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {
            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({ evernoteId: profile.id }, function (err, user) {
                  if(!user){
                    User.create({evernoteId:profile.id,token:token,secret:tokenSecret}, function(err, user){
                        return cb(err, user);      
                    });
                  } else {
                    user.token = token;
                    user.secret = tokenSecret;
                    user.save();
                    return cb(err, user);
                  }
            });
        });
    }));
};
/*    
    //******USE THIS CODE WHEN GOING TO PRODUCTION*******
    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    passport.use(new EvernoteStrategy({
        consumerKey: 'request new consumerKey when ready for production',
        consumerSecret: 'request new consumerSecret when ready for production',
        callbackURL: 'http://127.0.0.1:3000/auth/evernote/callback'
      },
      function(token, tokenSecret, profile, cb) {
        User.findOrCreate({ evernoteId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));
    passport.use('local-signup', new evernoteStrategy({//should the E in evernote be capitalized like the example of new LocalStrategy?
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'evernoteID',//evernoteID
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.evernoteID' :  evernoteID}, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                return done(null, false, req.flash('signupMessage', 'That ID is already taken.'));
            } else {

                // if there is no user with that email
                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.local.evernoteID    = evernoteID;
                newUser.local.password = newUser.generateHash(password);

                // save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }

        });    

        });

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new EvernoteStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'evernoteID',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, evernoteID, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.evernoteID' :  evernoteID }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // all is well, return successful user
            return done(null, user);
        });

    }));

}; END OF PRODUCTION CODE
*/




