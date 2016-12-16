var callbackUrl = "http://localhost:8080/oauth_callback"; // your endpoint

// initialize OAuth
var Evernote = require('evernote');
var client = new Evernote.Client({
  consumerKey: 'my-consumer-key',
  consumerSecret: 'my-consumer-secret',
  sandbox: true, // change to false when you are ready to switch to production
  china: false, // change to true if you wish to connect to YXBJ - most of you won't
});

client.getRequestToken(callbackUrl, function(error, oauthToken, oauthTokenSecret) {
  if (error) {
    // do your error handling here
  }
  // store your token here somewhere - for this example we use req.session
  req.session.oauthToken = oauthToken;
  req.session.oauthTokenSecret = oauthTokenSecret;
  res.redirect(client.getAuthorizeUrl(oauthToken); // send the user to Evernote
}

// at callbackUrl - "http://localhost:3000/oauth_callback" in our example. User sent here after Evernote auth
var client = new Evernote.Client({
  consumerKey: 'my-consumer-key',
  consumerSecret: 'my-consumer-secret',
  sandbox: true,
  china: false,
});
client.getAccessToken(req.session.oauthToken,
  req.session.oauthTokenSecret,
  req.query.oauth_verifier,
function(error, oauthToken, oauthTokenSecret, results) {
  if (error) {
    // do your error handling
  } else {
    // oauthAccessToken is the token you need;
    var authenticatedClient = new Evernote.Client({
      token: oauthToken,
      sandbox: true,
      china: false,
    });
    var noteStore = authenticatedClient.getNoteStore();
    noteStore.listNotebooks().then(function(notebooks) {
      console.log(notebooks); // the user's notebooks!
    });
  }
});