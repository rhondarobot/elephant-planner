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
        res.redirect('/agenda');
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

    /* in the agenda route, we would loop through all of the notebooks and find 
        the notebook whose title is EvernotePlanner.
        Grab the notes from that notebook

    */
    app.get('/agenda', isLoggedIn, function(req, res) {

        var authenticatedClient = new Evernote.Client({
          token: req.user.token,
          sandbox: true,
          china: false,
        });
        var noteStore = authenticatedClient.getNoteStore();
        var notebookList = notebookList;
        var epGUID = 'bcb2e5cf-8975-412e-a71c-73d57d332e06';
        noteStore.listNotebooks().then(function(notebooks) {
            evernotePlanner = notebooks;
            // loop over each notebook, find EvernotePlanner, set epGUID to it's guid
            // do the following line, but change notebooks[0].guid to epGUID
            return noteStore.findNotesMetadata({notebookGuid:epGUID},0,250,{includeTitle:true});            
        }).then(function(notes){
                // 
                console.log(notes);
                // find the note that matches today's date in the format of YYYY-mm-dd
                res.render('agenda.ejs', {
                    user : req.user,
                    notes: notes.notes,
                    notebooks: evernotePlanner
                });
        }).catch(function(error){
          console.error(error,'Promise error');
          res.send('error');
        });
    });

    // code for reading notes into events
    /*
    var line = '09:00-10:00 || Thinkful Session with TJ || We are meeting here';
    var eventItems = line.split(' || ');
    eventItems[0]; //09:00-10:00 - The time
    eventItems[1]; //Thinkful Session with TJ - the event title
    eventItems[2]; //We are meeting here... - the event details
    */

    app.get('/notebook/:guid/:title', isLoggedIn, function(req, res){
        var authenticatedClient = new Evernote.Client({
          token: req.user.token,
          sandbox: true,
          china: false,
        });
        var noteStore = authenticatedClient.getNoteStore();
        noteStore.findNotesMetadata({notebookGuid:req.params.guid},0,250,{includeTitle:true}).then(function(notes){
            console.log(notes);
            res.render('notebook.ejs', {
                user : req.user,
                notes: notes.notes,
                title: req.params.title
            });
        }).catch(function(error){
          console.error(error,'Promise error');
          res.send('error');
        });
    });      
    app.get('/notes/:resultSpec', isLoggedIn, function(req,res){
        var authenticatedClient = new Evernote.Client({
          token: req.user.token,
          sandbox: true,
          china: false,
        });
        var getNoteWithResultSpec = authenticatedClient.getNoteStore();
        getNoteWithResultSpec.NoteResultSpec({
            includeContent: true,
            includeResourcesData: true,
            includeNoteAppDataValues: true
        });
            res.render('notes.ejs');
    });
    

    // =====================================
    // NOTEBOOK SECTION ====================
    // =====================================
   
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req,res) {
        req.logout();
        res.redirect('/');
    });
       // process the signup form
    // app.post('/signup', passport.authenticate('local-signup', {
    //     successRedirect : '/profile', // redirect to the secure profile section
    //     failureRedirect : '/signup', // redirect back to the signup page if there is an error
    //     failureFlash : true // allow flash messages
    // }));

 // process the login form
    // app.post('/login', passport.authenticate('local-login', {
    //     successRedirect : '/profile', // redirect to the secure profile section
    //     failureRedirect : '/login', // redirect back to the signup page if there is an error
    //     failureFlash : true // allow flash messages
    // }));
};



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}