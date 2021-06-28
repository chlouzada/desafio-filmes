const tmdb_url = "https://api.themoviedb.org/3/";
const tmdb_top = "movie/top_rated";
const tmdb_trendind = "trending/movie/week";
const tmdb_search = "search/movie";
const tmdb_image = "https://image.tmdb.org/t/p/w500";
const locale = "pt-BR";

const omdb_url = "http://www.omdbapi.com/";
const api_key = "0f6d8485e4e96212071d0548796a9818";
const api_keyOMDb = "a0eda058";

const el_top = document.querySelector(".top");
const el_trend = document.querySelector(".trend");
const el_movies = document.querySelector(".movies");
const el_pages = document.querySelector(".paginate");
const el_page_counter = document.querySelector(".paginate p");
const el_page_btn = document.querySelectorAll(".paginate a");
const el_inputSearch = document.querySelector("input");
const el_buscar = document.querySelector(".search");

let pages;
let lastQuery;

let isLoading = false;

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
 * Gera URL para Request ao TMDB
 */
function urlTMDB(top = true, string = "", page = 1) {
  let url = "";
  if (string.length)
    url =
      tmdb_url +
      tmdb_search +
      "?api_key=" +
      api_key +
      "&language=" +
      locale +
      "&query=" +
      string +
      "&page=" +
      page;
  else if (top)
    url =
      tmdb_url +
      tmdb_top +
      "?api_key=" +
      api_key +
      "&language=" +
      locale +
      "&page=" +
      page;
  else
    url =
      tmdb_url +
      tmdb_trendind +
      "?api_key=" +
      api_key +
      "&language=" +
      locale +
      "&page=" +
      page;

  lastQuery = [top, string, page];
  return url;
}

/**
 *
 * Carrega os filmes do TMDB
 */
async function getMovies(top, string = "", page) {
  let request = new Request(urlTMDB(top, string, page));
  const data = await requestAPI(request);
  pages = data["total_pages"];
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
    output += `
              <div class="movie-item">
                <img src=${tmdb_image}${element["movie"]["poster_path"]} alt="Poster ${element["movie"]["title"]}"/>
                <div class="movie-title"><h2>${element["movie"]["title"]}</h2><p>${element["movie"]["original_title"]}</p></div>
                <div class="score"><p>${element["score"]}</p></div>
                <div class="ratings">
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

/**
 *
 * Carrega a lista de filmes
 */
async function loadMovies(top = true, string = "", page = 1) {
  try {
    toggleLoading();
    const movies = await getMovies(top, string, page);
    const omdb_ratings = await getRatingsOMdbApi(movies);

    let score = scoreEval(movies, omdb_ratings);
    const sorted = sortMovies(movies, omdb_ratings, score);

    if (page == 1) el_page_btn[0].style.display = "none";
    else el_page_btn[0].style.display = "block";

    toggleLoading();

    el_page_counter.innerHTML = `
                                ${page} de ${pages}
                                `;

    outputMovies(sorted);
  } catch (er) {
    console.log("Erro");
    console.log(er);
  }
}

/**
 *
 * Animação de loading
 */
function toggleLoading() {
  if (isLoading == false) {
    el_movies.classList.add("loading");
    el_movies.innerHTML = "";
    el_pages.style.display = "none";
    isLoading = true;
  } else {
    el_movies.classList.remove("loading"); // End Loading
    el_pages.style.display = "flex";
    isLoading = false;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadMovies(true);

  el_top.addEventListener("click", function () {
    loadMovies();
  });

  el_trend.addEventListener("click", function () {
    loadMovies(false);
  });

  el_buscar.addEventListener("click", function () {
    loadMovies(false, el_inputSearch.value);
  });

  el_page_btn[0].addEventListener("click", function () {
    loadMovies(lastQuery[0], lastQuery[1], lastQuery[2] - 1);
  });

  el_page_btn[1].addEventListener("click", function () {
    loadMovies(lastQuery[0], lastQuery[1], lastQuery[2] + 1);
  });
});
