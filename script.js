
const OMDB_API_KEY = 'e0cf604e';

async function searchMovie() {
    const query = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('results');
    const playerContainer = document.getElementById('player-container');
    
    resultsContainer.innerHTML = '';
    playerContainer.innerHTML = '';

    if (!query) return;

    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();

        if (data.Response === "True") {
            data.Search.forEach(movie => {
                const movieElement = document.createElement('div');
                movieElement.classList.add('movie-card');
                
                movieElement.innerHTML = `
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=Pas+d+image'}" alt="${movie.Title}">
                    <h3>${movie.Title} (${movie.Year})</h3>
                `;
                
                movieElement.onclick = () => playMovie(movie.imdbID);
                resultsContainer.appendChild(movieElement);
            });
        } else {
            resultsContainer.innerHTML = `<p style="color: #e50914;">Erreur de l'API : ${data.Error}</p>`;
        }
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color: #e50914;">Erreur de connexion. Vérifiez votre internet.</p>`;
        console.error("Erreur lors de la recherche :", error);
    }
}

function playMovie(imdbID) {
    const playerContainer = document.getElementById('player-container');
    document.getElementById('results').innerHTML = '';
    
    const embedUrl = `https://frembed.bar/embed/movie/?id=${imdbID}`;
    
    playerContainer.innerHTML = `
        <h2>Bon visionnage !</h2>
        <iframe src="${embedUrl}" allowfullscreen></iframe>
        <button onclick="searchMovie()" style="margin-top: 20px; padding: 10px; cursor: pointer;">Retour aux résultats</button>
    `;
    
    playerContainer.scrollIntoView({ behavior: 'smooth' });
}