const tmdb_url = "https://api.themoviedb.org/3/";
const tmdb_top = "movie/top_rated";
const tmdb_trendind = "trending/movie/week";
const tmdb_image = "https://image.tmdb.org/t/p/w500";
const locale = "pt-BR";
const api_key = "0f6d8485e4e96212071d0548796a9818";

const omdb_url = "http://www.omdbapi.com/";
const api_keyOMDb = "a0eda058";

const el_movies = document.querySelector(".movies");

async function requestAPI(request) {
  const response = await fetch(request);
  const data = await response.json();
  return data;
}

async function getMovies() {
  // let request = new Request(
  //   tmdb_url + tmdb_trendind + "?api_key=" + api_key + "&language=" + locale
  // );
  const request = new Request("./teste.json");
  const data = await requestAPI(request);
  return data["results"];
}

async function getRatingsOMdbApi(movies) {
  let ratingsOMdb = [];

  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];
    const request = new Request(
      omdb_url + "?apikey=" + api_keyOMDb + "&t=" + movie["original_title"]
    );
    const data = await requestAPI(request);
    if (data["Error"] == "Movie not found!") ratingsOMdb.push(null);
    else {
      const ratings = data["Ratings"];
      let ratingsConverted = [];
      ratings.forEach((rating) => {
        let src;
        if (rating["Source"] == "Internet Movie Database") src = "imdb";
        if (rating["Source"] == "Rotten Tomatoes") src = "rotten";
        if (rating["Source"] == "Metacritic") src = "meta";
        ratingsConverted.push([src, convertRating(rating["Value"])]);
      });
      ratingsOMdb.push(ratingsConverted);
    }
  }

  return ratingsOMdb;
}

function scoreEval(movies, ratings) {
  let score = [];
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    if (ratings[i] == null) score[i] = movie['vote_average'];
    else {
      score[i] = movie['vote_average'];
      for (let j = 0; j < ratings[i].length; j++) {score[i] += ratings[i][j][1]};
      score[i] = (score[i] / (ratings[i].length + 1)).toFixed(1)
    }
  }

  return score;
}

function convertRating(string) {
  let rating;

  if (string == "100%" || string == "100/100" || string == "10/10") return 10;

  if (string[1] == ".") rating = parseFloat(string.slice(0, 3));
  else rating = parseFloat(string.slice(0, 2)) / 10;

  return rating;
}

function outputMovies(movies) {
  let output = "";
  movies.forEach((movie, index) => {
    output += `
              <div>
                <img src=${tmdb_image}${movie["poster_path"]} alt="Poster ${movie["title"]}"/>
                <h2>${movie["title"]}</h2>
                <p>${movie["vote_average"]}</p>
              </div>
              `;
  });
  el_movies.innerHTML = output;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const movies = await getMovies();
    const omdb_ratings = await getRatingsOMdbApi(movies);
    let score = [];
    
    score = scoreEval(movies,omdb_ratings)
    
    outputMovies(movies);

  } catch (er) {
    console.log("Erro");
    console.log(er);
  }
});
