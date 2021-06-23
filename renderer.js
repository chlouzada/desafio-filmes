const tmdb_url = "https://api.themoviedb.org/3/";
const tmdb_top = "movie/top_rated";
const tmdb_trendind = "trending/movie/week";
const tmdb_image = "https://image.tmdb.org/t/p/w500";
const locale = "pt-BR";
const api_key = "0f6d8485e4e96212071d0548796a9818";

const omdb_url = "http://www.omdbapi.com/";
const api_keyOMDb = "a0eda058";

const el_movies = document.querySelector(".movies");

async function getMovies() {
  let request = new Request(
    tmdb_url + tmdb_trendind + "?api_key=" + api_key + "&language=" + locale
  );
  // const request = new Request("./teste.json");

  const response = await fetch(request);
  const data = await response.json();

  return data["results"];
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
  let movies;
  try {
    movies = await getMovies();
    outputMovies(movies);
  } catch (er) {
    console.log("Erro");
    console.log(er);
  }
});
