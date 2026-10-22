const TMDB_API_KEY = 'aca5581c3c1261367bad7827b83ffee4'; 
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Fonction pour naviguer entre les onglets
function showSection(sectionId) {
    document.getElementById('home-section').style.display = 'none';
    document.getElementById('search-section').style.display = 'none';
    document.getElementById('player-section').style.display = 'none';
    
    if(sectionId === 'home') document.getElementById('home-section').style.display = 'block';
    if(sectionId === 'search') document.getElementById('search-section').style.display = 'block';
    if(sectionId === 'player') document.getElementById('player-section').style.display = 'block';
}

async function loadHomeCategories() {
    const urlTendances = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`;
    const urlTop250 = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`;

    fetchMovies(urlTendances, 'trending-results');
    fetchMovies(urlTop250, 'classic-results');
}

async function fetchMovies(url, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p style="color:#d4af37;">Chargement...</p>';
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        container.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            data.results.forEach(movie => {
                const movieCard = createMovieCard(movie);
                container.appendChild(movieCard);
            });
        } else {
            container.innerHTML = '<p>Aucun film trouvé.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Erreur de connexion.</p>';
        console.error(error);
    }
}

async function searchMovie() {
    const query = document.getElementById('searchInput').value;
    const year = document.getElementById('yearInput').value;
    const resultsContainer = document.getElementById('search-results');
    
    if (!query) {
        alert("Veuillez entrer au moins un titre !");
        return;
    }

    resultsContainer.innerHTML = '<p style="color:#d4af37;">Recherche en cours...</p>';

    try {
        let apiUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;
        
        if (year) apiUrl += `&primary_release_year=${year}`;

        fetchMovies(apiUrl, 'search-results');
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color: red;">Erreur de connexion.</p>`;
    }
}

function createMovieCard(movie) {
    const div = document.createElement('div');
    div.classList.add('movie-card');
    
    const posterUrl = movie.poster_path ? `${TMDB_IMAGE_BASE}${movie.poster_path}` : 'https://via.placeholder.com/200x300?text=Pas+d+image';
    
    div.innerHTML = `
        <img src="${posterUrl}" alt="${movie.title}">
        <h3>${movie.title}</h3>
    `;
    
    div.onclick = () => playMovie(movie.id);
    return div;
}

async function playMovie(tmdbID) {
    showSection('player');
    const playerContainer = document.getElementById('player-container');
    playerContainer.innerHTML = '<p style="text-align:center; color:#d4af37; padding-top: 50px;">Préparation de la vidéo...</p>';
    
    try {
        const response = await fetch(`${TMDB_BASE_URL}/movie/${tmdbID}/external_ids?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        const imdbID = data.imdb_id;
        
        if (!imdbID) {
            playerContainer.innerHTML = '<p style="text-align:center; color:red;">Désolé, ce film n\'a pas de code vidéo disponible.</p>';
            return;
        }

        const embedUrl = `https://frembed.bar/embed/movie/${imdbID}`;
        
        playerContainer.innerHTML = `
            <iframe src="${embedUrl}" allowfullscreen></iframe>
        `;
    } catch (error) {
        playerContainer.innerHTML = '<p style="text-align:center; color:red;">Erreur lors du chargement de la vidéo.</p>';
    }
}

window.onload = loadHomeCategories;