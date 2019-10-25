var cheerio = require("cheerio");
var nightmare = require('nightmare');
var express = require('express');
var ejs = require('ejs');
var mongojs = require('mongojs');
var bodyParser = require('body-parser');
var request = require('request');
var methodOverride = require('method-override')
var path = require('path');
var axios = require('axios');


// Express package
var app = express();
app.use(express.static("assets"));
//////////////////////////////////////////////////////////////////////

// set the view engine to ejs
app.set('view engine', 'ejs');

//////////////////////////////////////////////////////////////////////

// Method Override Package
app.use(methodOverride('_method'))

//////////////////////////////////////////////////////////////////////

//Body Parser package
//to be able to use app.post
//body-parser allows us to access the body of a request, which we need when doing a post route	

//integrate body-parser with express

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//////////////////////////////////////////////////////////////////////

var PORT = process.env.PORT || 3000;

//connect to mongo

// Database configuration
var databaseUrl = process.env.MONGODB_URI || "news_db";
var collections = ["articles"];

// Hook mongojs config to db variable
var db = mongojs(databaseUrl, collections);

// Log any mongojs errors to console
db.on("error", function (error) {
  console.log("Database Error:", error);
});

//////////////////////////////////////////////////////////////////////

app.get('/', function (req, res) {
  res.render('pages/home');
});

//////////////////////////////////////////////////////////////////////


// The page's Response is passed as our promise argument.
app.get('/verge', function (req, res) {
  console.log("\n***********************************\n" +
    "Grabbing every thread name and link\n" +
    "from The Verge:" +
    "\n***********************************\n");

  axios.get("https://www.theverge.com/archives").then(function (response) {

    // Load the Response into cheerio and save it to a variable
    // '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
    var $ = cheerio.load(response.data);

    // An empty array to save the data that we'll scrape
    var results = [];

    console.log("Pre-Each")
    // With cheerio, find each p-tag with the "title" class
    // (i: iterator. element: the current element)
    $("div.c-compact-river__entry ").each(function (i, element) {
      console.log("During Each")

      // Save the text of the element in a "title" variable
      var title = $(element).children().eq(0).children().eq(1).children().eq(0).children().eq(0).text();

      // Save the link of the element in a "link" variable
      var link = $(element).children().eq(0).children().eq(0).attr("href");


      results.push({
        title: title,
        link: link
      });
    });
    console.log("Post-Each")

    // Log the results once you've looped through each of the elements found with cheerio
    console.log(results);

    res.json(results)
  });


});

//////////////////////////////////////////////////////////////////////

app.post("/songs", function (req, res) {
  //validation here
  // req.body.songName.length > 1

  // Insert the song into the songs collection
  db.articles.insert({ link: req.body.link, title: req.body.title }, function (error, articles) {
    // Log any errors
    if (error) {
      console.log(error);
    } else {
      //the reason why we are sending the savedSong back is because we now have an _id to give to the client
      res.json(articles);
    }
  });
});



// Listen on port 3000
app.listen(PORT, function () {
  console.log('🌎 ==> Now listening on PORT %s! Visit http://localhost:%s in your browser!', PORT, PORT);
});
