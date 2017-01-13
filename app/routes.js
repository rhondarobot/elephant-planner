// app/routes.js
const Evernote = require('evernote');
var moment = require('moment');
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
        // var day = new Date();
        // var today = day.getFullYear() + '-' + (day.getMonth()+1) + '-' + day.getDate();
        var dates = getDates();
        res.redirect('/agenda/'+dates.today);
      });

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });


// /edit-event post route

    app.post('/event', function(req,res){
        getNote(req.user,req.body.date,function(note){
            var randomID = Math.floor((Math.random() * 99999999999) + 1);
            var newEvent = "<li>"+randomID+" || " + req.body.start+" - "+req.body.end+" || "+req.body.title+" || "+req.body.description+"</li>";
            var matches = note.content.match(/<ul(.*?)<\/ul>/g);
            if(matches){
                var result = matches.map(function(val){
                   return val.replace(/<\/ul>/g,newEvent+'</ul>');
                });
                note.content='<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note>'+result[0]+'</en-note>';
            } else {
                // 1 || 2300 - 2330 || Meet with Rhonda || On ScreenHero to complete EP
                // 2 || 2300 - 2330 || Meet with Rhonda || On ScreenHero to complete EP
                // 3 || 2300 - 2330 || Meet with Rhonda || On ScreenHero to complete EP
                // 4 || 2300 - 2330 || Meet with Rhonda || On ScreenHero to complete EP
                note.content='<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><ul>'+newEvent+'</ul></en-note>';
            }
            saveNote(req.user,note, function(data){
                console.log(data);
                res.redirect('/agenda/'+req.body.date);
            });
        });
    });

    app.post('/edit-event', function(req,res){
        getNote(req.user,req.body.date,function(note){
            var id = req.body.eventId;
            var newEvent = "<li>"+id+" || " + req.body.start+" - "+req.body.end+" || "+req.body.title+" || "+req.body.description+"</li>";
            var re = new RegExp("<li>"+id+"(.*?)<\/li>"); 
            note.content = note.content.replace(re,newEvent);
            console.log('id',id);
            console.log('newEvent',newEvent);
            console.log('re',re);
            console.log('note.content',note.content);
            saveNote(req.user,note, function(data){
                res.redirect('/agenda/'+req.body.date);
            });
        });
    });

    app.delete('/event', function(req,res){
        getNote(req.user,req.body.date,function(note){
            var id = req.body.id;
            var re = new RegExp("<li>"+id+"(.*?)<\/li>"); 
            note.content = note.content.replace(re,"");
            saveNote(req.user,note, function(data){
                res.send({});
            });
        });
    });

    // app.post('/edit-event', function(req, res){
    //     getNote(req.user,req.body.date,function(note){
    //         // var editEvent = function{
    //         //     for(var s = 0; s < req.body.start; s++) {
    //         //         for(var e = 0; e < req.)
    //         // }
    //         // "<li>"+req.body.start+" - "+req.body.end+" || "+req.body.title+" || "+req.body.description+"</li>";

    //         var matches = note.content.match(/<ul(.*?)<\/ul>/g);
    //         if(matches){
    //             var result = matches.map(function(val){
    //                return val.replace(/<\/ul>/g,newEvent+'</ul>');
    //             });
    //             note.content='<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note>'+result[0]+'</en-note>';
    //         } else {
    //             note.content='<!DOCTYPE en-note SYSTEM "http://xml.evernote.com/pub/enml2.dtd"><en-note><ul>'+newEvent+'</ul></en-note>';
    //         }
    //     saveNote(req.user,note, function(data){
    //         console.log(data);
    //         res.redirect('/agenda/'+req.body.date);
    //     });
    // });
    app.get('/agenda/:date', isLoggedIn, function(req, res) {
        console.log('here');
        getNote(req.user,req.params.date,function(note){
            var events = [];
            if(note.content){
                var lines = note.content.split(/<.*?>/);
                for (var i = 0; i < lines.length; i++) {
                    if(lines[i]!==""){
                        var pieces = lines[i].split(" || ");
                        var times = pieces[1].split(" - ");
                        var event = {
                            id: pieces[0],
                            start: times[0],
                            end: times[1],
                            title: pieces[2],
                            description: (pieces.length > 2) ? pieces[3] : ''
                        };
                        events.push(event);
                    }
                }

                // sort our events by start time
                events.sort(keysrt('start'));
            }
            
            var dates = getDates(req.params.date);

            res.render('agenda.ejs', {
                user : req.user,
                note: note,
                dates: dates,
                events: events
            });
        });

    });

    function getDates(date){
        date = (typeof date === 'undefined') ? moment() : date;
        var dates = {};
        var textFormat = 'MMMM Do YYYY';
        var dateFormat = 'YYYY-M-D';
        dates.today = moment(date).format(dateFormat);
        dates.todayText = moment(date).format(textFormat);
        dates.yesterdayText = moment(date).subtract(1, 'days').format(textFormat);
        dates.yesterday = moment(date).subtract(1, 'days').format(dateFormat);
        dates.tomorrowText = moment(date).add(1, 'days').format(textFormat);
        dates.tomorrow = moment(date).add(1, 'days').format(dateFormat);
        return dates;
    }

    app.get('/testdate', function(req,res){
        res.send(getDates());
    });

    app.get('/date/:date', function(req,res){
        var date = req.params.date;
        var dates = {};
        var textFormat = 'MMMM Do YYYY';
        var dateFormat = 'YYYY-M-D';
        dates.today = moment(date).format(dateFormat);
        dates.todayText = moment(date).format(textFormat);
        dates.yesterdayText = moment(date).subtract(1, 'days').format(textFormat);
        dates.yesterday = moment(date).subtract(1, 'days').format(dateFormat);
        dates.tomorrowText = moment(date).add(1, 'days').format(textFormat);
        dates.tomorrow = moment(date).add(1, 'days').format(dateFormat);
        // return dates;
        
        res.send(dates);
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

function getDate(today){

}

function getNote(user,date,cb){
    console.log('228');
    var authenticatedClient = new Evernote.Client({
          token: user.token,
          sandbox: true,
          china: false,
        });
    console.log('234');
    var noteStore = authenticatedClient.getNoteStore();
    console.log('236');
    var todaysNote;
    var noteGUID = 0;
    var epGUID;
    noteStore.listNotebooks().then(function(notebooks) {
        console.log('241');
        for (var i = 0; i < notebooks.length; i++) {
            if(notebooks[i].name == 'Evernote Planner'){
                epGUID = notebooks[i].guid;
            }
        }
        return noteStore.findNotesMetadata({notebookGuid:epGUID},0,250,{includeTitle:true});            
    }).then(function(notes){
        console.log('249');
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
        console.log('261');
            cb(note);
    }).catch(function(error){
      console.error(error);
      res.send('error');
    });
}