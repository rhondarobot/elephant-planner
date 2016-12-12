// app/routes.js
var Evernote = require('evernote');
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    // app.post('/login', do all our passport stuff here);
    
    // =====================================
    // AUTHENTICATION SECTION ==============
    // =====================================
    // we will be using the code from the Evernote API
    app.get('/auth/evernote',
      passport.authenticate('evernote'));

    app.get('/auth/evernote/callback', 
      passport.authenticate('evernote', { failureRedirect: '/' }),
      function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('/profile');
      });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    // app.post('/signup', do all our passport stuff here);

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {

        var authenticatedClient = new Evernote.Client({
          token: req.user.token,
          sandbox: true,
          china: false,
        });
        var noteStore = authenticatedClient.getNoteStore();
        noteStore.listNotebooks().then(function(notebooks) {
            return noteStore.findNotesMetadata({notebookGuid:'3c3613fe-1d44-4e40-a79c-b7e81578b4f9'},0,250,{includeTitle:true});            
        }).then(function(notes){
                console.log(notes);
                res.render('profile.ejs', {
                    user : req.user,
                    notebooks: notes.notes // get the user out of session and pass to template
                });
        }).catch(function(error){
          console.error(error,'Promise error');
          res.send('error');
        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
       // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

 // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
};



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}