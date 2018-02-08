var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var app = express();
//set handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Our scraping tools
var axios = require("axios");
var cheerio = require("cheerio");
var request = require("request");

// First, tell the console what server.js is doing
console.log("\n******************************************\n" +
"Grabbing every documentary headline, summary, and link\n" +
"from the BBC website:" +
"\n******************************************\n");

// Making a request for nhl.com's homepage
request("http://www.bbc.co.uk/programmes/formats/documentaries/schedules/upcoming", function(error, response, html) {

// Load the body of the HTML into cheerio
var $ = cheerio.load(html);

// Empty array to save our scraped data
var results = [];

// With cheerio, find each programme__title and loop through the results
$("h4.programme__titles").each(function(i, element) {

  var link = $(element).children().attr("resource");
  var title = $(element).children().text();

// Make an object with data we scraped for this h4 and push it to the results array
results.push({
title: title,
link: link
});
});

// After looping through each h4.headline-link, log the results
console.log(results);
});

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
// mongoose.Promise = Promise;
// mongoose.connect("mongodb://localhost/mongoHeadlines", {
//   useMongoClient: true
// });
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// Routes

// A GET route for scraping the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.bbc.co.uk/programmes/formats/documentaries/schedules/upcoming").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("h4.programme__titles").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("resource");

      // how to scrape summary?
      // result.summary = $("p.programme__synopsis text--subtle centi")
      //   .children("span")
      //   .attr("property");

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(mongoHeadlines) {
          // View the added result in the console
          console.log(mongoHeadlines);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          return res.json(err);
        });


    });

    // If we were able to successfully scrape and save an Article, send a message to the client
    res.send("Scrape Complete");
  });
});

//route for getting all the saved articles from db
// app.get("/saved",function(req,res){
//   db.Article.find({"_id": "My Life — Series 8, What Makes Me Tic"})
//     .then(function(mongoHeadlines){
//       res.json(mongoHeadlines);
//     })
//     .catch(function(err){
//       res.json(err);
//     })
//     // If we were able to successfully scrape and save an Article, send a message to the client
//     res.send("Save Complete");
//   db.Article.update({"title": "My Life — Series 8, What Makes Me Tic"}, {$set: {"title":"ziwei"}});                     
//   });

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {

  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(mongoHeadlines) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(mongoHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(mongoHeadlines) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(mongoHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(mongoHeadlines) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(mongoHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated status
app.post("/saved", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Article.findOneAndUpdate({ _id: req.params.id }, { status: 1 })
    .then(function(mongoHeadlines) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(mongoHeadlines);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



 // db.Article.update({"_id": "5a7bb1732f3e7729a8823787"}, {$set: {"__v":1}});



// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
