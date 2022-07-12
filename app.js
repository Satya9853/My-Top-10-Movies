const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const request = require("request");
const app = express();
require("dotenv").config();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("static"));

// 1) API KEY
api_key = process.env.API_KEY;

// 2) Connecting to database
mongoose.connect(
  "mongodb+srv://satya:satya9853@cluster0.ipeor.mongodb.net/movies"
);

// 3) Creating Collection Schema
const movie_schema = mongoose.Schema({
  title: String,
  year: Number,
  description: String,
  rating: Number,
  ranking: Number,
  review: String,
  img_url: String,
  movie_id: String,
});

// 4) Creating Collection Model
const movie_model = mongoose.model("top_movies", movie_schema);

// ROUTING SECTION

// 1) Home Route
app.get("/", (req, res) => {
  movie_model
    .find({})
    .sort([["rating", -1]])
    .exec((err, data) => {
      if (err) {
        console.log(err);
      } else {
        res.render("index", { movie_list: data });
      }
    });
});

// 2) Add Route
app.get("/add", (req, res) => {
  res.render("add");
});
app.post("/select", (req, res) => {
  const url = `https://api.themoviedb.org/3/search/movie${api_key}&query=`;
  query = req.body.movieName;
  request.get(url + query, (response, data) => {
    const movie_list = JSON.parse(data.body).results;
    res.render("select", { list: movie_list });
  });
});

// 4) Find Movie Route
app.get("/find", (req, res) => {
  const url = "https://api.themoviedb.org/3/movie/";
  let find_id = req.query.id;
  request.get(url + find_id + api_key, (response, data) => {
    movie_detail = JSON.parse(data.body);
    const title = movie_detail.original_title;
    const poster_path = movie_detail.poster_path;
    const year = movie_detail.release_date.split("-")[0];
    const description = movie_detail.overview;

    const new_movie = new movie_model({
      title: title,
      year: Number(year),
      description: description,
      img_url: "https://image.tmdb.org/t/p/w500/" + poster_path,
      movie_id: find_id,
    });
    new_movie.save((err) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully added");
        movie_model.findOne({ title: title }, (err, data) => {
          res.redirect(`/review?id=${data.id}`);
        });
      }
    });
  });
});

// 5) Review Route
app
  .route("/review")
  .get((req, res) => {
    id = req.query.id;
    res.render("edit", { id: id });
  })

  .post((req, res) => {
    id = req.body.id;
    rating = req.body.rating;
    review = req.body.review;

    movie_model.updateOne(
      { _id: id },
      { rating: rating, review: review },
      (err) => {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/");
        }
      }
    );
  });

// 6) Delete Route
app.get("/delete", (req, res) => {
  del_movie_id = req.query.id;
  movie_model.deleteOne({ _id: del_movie_id }, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("success");
      res.redirect("/");
    }
  });
});


// Listen Port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 8000;
}
app.listen(port);
