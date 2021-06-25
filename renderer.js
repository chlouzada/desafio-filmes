const tmdb_url = "https://api.themoviedb.org/3/";
const tmdb_top = "movie/top_rated";
const tmdb_trendind = "trending/movie/week";
const tmdb_image = "https://image.tmdb.org/t/p/w500";
const locale = "pt-BR";

const omdb_url = "http://www.omdbapi.com/";
const api_key = "0f6d8485e4e96212071d0548796a9818";
const api_keyOMDb = "a0eda058";

const el_movies = document.querySelector(".movies");

/**
 *
 * Realiza o fetch a API e retorna o JSON da resposta
 */
async function requestAPI(request) {
  const response = await fetch(request);
  const data = await response.json();
  return data;
}

/**
 *
 *
 */
async function getMovies() {
  // let request = new Request(
  //   tmdb_url + tmdb_trendind + "?api_key=" + api_key + "&language=" + locale
  // );
  const request = new Request("./teste.json");
  const data = await requestAPI(request);
  return data["results"];
}

/**
 *
 * Gera uma Array de ratings a partir do request a API do OMdb
 */
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

/**
 *
 * Calcula o score de todos os filmes com base nas avaliações do TMDb e as do OMDB
 */
function scoreEval(movies, ratings) {
  let score = [];
  for (let i = 0; i < movies.length; i++) {
    const movie = movies[i];

    if (ratings[i] == null) score[i] = movie["vote_average"];
    else {
      score[i] = movie["vote_average"];
      for (let j = 0; j < ratings[i].length; j++) {
        score[i] += ratings[i][j][1];
      }
      score[i] = parseFloat((score[i] / (ratings[i].length + 1)).toFixed(1));
    }
  }

  return score;
}

/**
 *
 * Padrozina a Rating de um filme
 */
function convertRating(string) {
  let rating;

  if (string == "100%" || string == "100/100" || string == "10/10") return 10;

  if (string[1] == ".") rating = parseFloat(string.slice(0, 3));
  else rating = parseFloat(string.slice(0, 2)) / 10;

  return rating;
}

/**
 *
 * Injeta o trecho com os dados dos filmes no HTML
 */
function outputMovies(movies) {
  let output = "";
  movies.forEach((element, index) => {
    const tmdb = element["movie"]["vote_average"];
    const ratings = element["ratings"];
    let imdb = "-";
    let rotten = "-";
    let meta = "-";
    if (ratings)
      ratings.forEach((r) => {
        if (r[0] == "imdb") imdb = r[1];
        if (r[0] == "rotten") rotten = r[1];
        if (r[0] == "meta") meta = r[1];
      });

    console.log(ratings);
    output += `
              <div>
                <img src=${tmdb_image}${element["movie"]["poster_path"]} alt="Poster ${element["movie"]["title"]}"/>
                <h2>${element["movie"]["title"]}</h2>
                <div class="ratings">
                  <p>${element["score"]}</p>
                  <p>${tmdb}</p>
                  <p>${imdb}</p>
                  <p>${rotten}</p>
                  <p>${meta}</p>
                </div>
              </div>
              `;
  });
  el_movies.innerHTML = output;
}

/**
 *
 * Ordena os filmes em ordem decrescente de acordo com o score
 */
function sortMovies(movies, ratings, score) {
  let unsorted = new Array();
  for (let index = 0; index < score.length; index++) {
    unsorted.push({
      score: score[index],
      movie: movies[index],
      ratings: ratings[index],
    });
  }

  unsorted.sort(function (a, b) {
    return b.score - a.score;
  });

  return unsorted;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const movies = await getMovies();
    const omdb_ratings = await getRatingsOMdbApi(movies);
    let score = scoreEval(movies, omdb_ratings);

    const sorted = sortMovies(movies, omdb_ratings, score);

    outputMovies(sorted);
  } catch (er) {
    console.log("Erro");
    console.log(er);
  }
});
