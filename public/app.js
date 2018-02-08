// Grab the articles as a json
$.getJSON("/articles", function (data) {


  // For each one
  //debugger;
  var obj ;
 
  for (var i = 0; i < data.length; i++) {
   
    // Display the apropos information on the page
    var articleId = data[i]._id;
  
    $("#articles").append("<div class='post-preview'>" +
      "<a href='" + data[i].link + "' target='_blank'><h2 class='post-title'>" + data[i].title + "</h2></a>" +
      "<button id='"+articleId+"' onclick='saveArticle(this)' >Save Article</button></div>"); 

  }
});
    //when click the button, will move the article to the saved articles queue
    function saveArticle(obj) {
      debugger;
      var objID = obj.id;

      //pass the objID to database and change the status from 0 to 1 based on the objID
      $.getJSON("/saved", function (data) {
        // debugger;
      });  
      
      //reload the page
      //send the article to the saved page
    }

$.getJSON("/saved", function (data) {

  var obj; 

  for (var i = 0; i < data.length; i++) {

    var articleId = data[i]._id;

    $("#articles").append("<div class='post-preview'>" +
      "<a href='" + data[i].link + "' target='_blank'><h2 class='post-title'>" + data[i].title + "</h2>" +
      "<button id='"+articleId+"' onclick='deleteArticle(this)' >Delete Article</button><button id='"+articleId+"' onclick='notesArticle(this)' >Article Notes</button></div>");
  }

  function deleteArticle(obj) {
    obj
  }

  function notesArticle() {
    // Whenever someone clicks a noteButton tag
    $(document).on("click", articleId, function () {
      // Empty the notes from the note section
      $("#notes").empty();
      // Save the id from the noteButton tag
      var thisId = $(this).attr("data-id");

      // Now make an ajax call for the Article
      $.ajax({
        method: "GET",
        url: "/articles/" + thisId
      })
        // With that done, add the note information to the page
        .then(function (data) {
          console.log(data);
          // The title of the article
          $("#notes").append("<h2>" + data.title + "</h2>");
          // An input to enter a new title
          $("#notes").append("<input id='titleinput' name='title' >");
          // A textarea to add a new note body
          $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
          // A button to submit a new note, with the id of the article saved to it
          $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");

          // If there's a note in the article
          if (data.note) {
            // Place the title of the note in the title input
            $("#titleinput").val(data.note.title);
            // Place the body of the note in the body textarea
            $("#bodyinput").val(data.note.body);
          }
        });
    });

    // When you click the savenote button
    $(document).on("click", "#savenote", function () {
      // Grab the id associated with the article from the submit button
      var thisId = $(this).attr("data-id");

      // Run a POST request to change the note, using what's entered in the inputs
      $.ajax({
        method: "POST",
        url: "/articles/" + thisId,
        data: {
          // Value taken from title input
          title: $("#titleinput").val(),
          // Value taken from note textarea
          body: $("#bodyinput").val()
        }
      })
        // With that done
        .then(function (data) {
          // Log the response
          console.log(data);
          // Empty the notes section
          $("#notes").empty();
        });

      // Also, remove the values entered in the input and textarea for note entry
      $("#titleinput").val("");
      $("#bodyinput").val("");
    });
  }
})


