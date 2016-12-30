// app/routes.js
const Evernote = require('evernote');
// var ejsLint=require('./server.js');
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
        var day = new Date();
        var today = day.getFullYear() + '-' + (day.getMonth()+1) + '-' + day.getDate();
        res.redirect('/agenda/'+today);
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

    app.post('/event', function(req,res){
        getNote(req.user,req.body.date,function(note){
            var newEvent = "<li>"+req.body.start+" - "+req.body.end+" || "+req.body.title+" || "+req.body.description+"</li>";

            var matches = note.content.match(/<ul(.*?)<\/ul>/g);
            if(matches){
                var result = matches.map(function(val){
                   return val.replace(/<\/ul>/g,newEvent+'</ul>');
                });
                note.content='<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note>'+result[0]+'</en-note>';
            } else {
                note.content='<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><ul>'+newEvent+'</ul></en-note>';
            }

            saveNote(req.user,note, function(data){
                console.log(data);
                res.redirect('/agenda/'+req.body.date);
            });
        });
    });

    app.get('/agenda/:date', isLoggedIn, function(req, res) {

        getNote(req.user,req.params.date,function(note){
            var events = [];
            if(note.content){
                var lines = note.content.split(/<.*?>/);
                for (var i = 0; i < lines.length; i++) {
                    if(lines[i]!==""){
                        var pieces = lines[i].split(" || ");
                        var times = pieces[0].split(" - ");
                        var event = {
                            start: times[0],
                            end: times[1],
                            title: pieces[1],
                            description: (pieces.length > 2) ? pieces[2] : ''
                        };
                        events.push(event);
                    }
                }

                // sort our events by start time
                events.sort(keysrt('start'));
            }

            res.render('agenda.ejs', {
                user : req.user,
                note: note,
                date: req.params.date,
                yesterday: new Date(req.params.date),
                today: new Date(),
                events: events
            });

        // app.put('/agenda/:date',isLoggedIn, function(req,res) {
        //     getNote(req.user,req.params.date,function(note){
                
        //     }) 
        // })   
        });

    });


   
    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req,res) {
        req.logout();
        res.redirect('/');
    });
};



// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

function keysrt(key,desc) {
  return function(a,b){
   return desc ? ~~(a[key] < b[key]) : ~~(a[key] > b[key]);
  };
}

function saveNote(user,note,cb){
    var authenticatedClient = new Evernote.Client({
      token: user.token,
      sandbox: true,
      china: false,
    });
    var noteStore = authenticatedClient.getNoteStore();
    noteStore.updateNote(note).then(function(data){
        cb(data);
    });

}

function getNote(user,date,cb){
    var authenticatedClient = new Evernote.Client({
          token: user.token,
          sandbox: true,
          china: false,
        });
    var noteStore = authenticatedClient.getNoteStore();
    var todaysNote;
    var noteGUID = 0;
    var epGUID;
    noteStore.listNotebooks().then(function(notebooks) {
        for (var i = 0; i < notebooks.length; i++) {
            if(notebooks[i].name == 'Evernote Planner'){
                epGUID = notebooks[i].guid;
            }
        }
        return noteStore.findNotesMetadata({notebookGuid:epGUID},0,250,{includeTitle:true});            
    }).then(function(notes){
            for (var i = 0; i < notes.notes.length; i++) {
                if(notes.notes[i].title == date){
                    noteGUID = notes.notes[i].guid;
                }
            }
            if(noteGUID!==0){
                return noteStore.getNoteWithResultSpec(noteGUID,{includeContent:true});                
            } else {
                return noteStore.createNote({title:date,notebookGuid:epGUID,content:'<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note></en-note>'});
            }
    }).then(function(note){
            cb(note);
    }).catch(function(error){
      console.error(error);
      res.send('error');
    });
}