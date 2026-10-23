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
    const resultsContainer = document.getElementById('search-results');
    
    if (!query) {
        alert("Veuillez entrer au moins un titre !");
        return;
    }

    resultsContainer.innerHTML = '<p style="color:#d4af37;">Recherche en cours...</p>';

    try {
        let apiUrl = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;
        

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

let currentImdbId = '';
let currentTmdbId = '';
let currentMediaType = 'movie';

async function searchMovie() {
    const query = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('search-results');
    
    if (!query) {
        alert("Veuillez entrer au moins un titre !");
        return;
    }

    resultsContainer.innerHTML = '<p style="color:#d4af37;">Recherche en cours...</p>';

    try {
        let apiUrl = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR`;
        fetchMovies(apiUrl, 'search-results');
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color: red;">Erreur de connexion.</p>`;
    }
}

function createMovieCard(item) {
    const mediaType = item.media_type || 'movie';
    if (mediaType !== 'movie' && mediaType !== 'tv') return document.createElement('div');

    const div = document.createElement('div');
    div.classList.add('movie-card');
    
    const title = item.title || item.name;
    const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE}${item.poster_path}` : 'https://via.placeholder.com/200x300?text=Pas+d+image';
    
    div.innerHTML = `
        <img src="${posterUrl}" alt="${title}">
        <h3>${title}</h3>
    `;
    
    div.onclick = () => playMovie(item.id, mediaType);
    return div;
}

async function playMovie(id, mediaType = 'movie') {
    showSection('player');
    currentTmdbId = id;
    currentMediaType = mediaType;
    
    const playerContainer = document.getElementById('player-container');
    const tvControls = document.getElementById('tv-controls');
    
    playerContainer.innerHTML = '<p style="text-align:center; color:#d4af37; padding-top: 50px;">Préparation de la vidéo...</p>';
    
    // Affiche ou masque les champs Saison/Épisode
    if (mediaType === 'tv') {
        tvControls.style.display = 'block';
        document.getElementById('seasonInput').value = 1;
        document.getElementById('episodeInput').value = 1;
    } else {
        tvControls.style.display = 'none';
    }
    
    try {
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const response = await fetch(`${TMDB_BASE_URL}/${endpoint}/${id}/external_ids?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        
        currentImdbId = data.imdb_id;
        
        if (!currentImdbId && !currentTmdbId) {
            playerContainer.innerHTML = '<p style="text-align:center; color:red;">Désolé, aucune vidéo disponible.</p>';
            return;
        }

        changeServer('moviez');
    } catch (error) {
        playerContainer.innerHTML = '<p style="text-align:center; color:red;">Erreur lors du chargement de la vidéo.</p>';
    }
}

function updateEpisode() {
    const activeBtn = document.querySelector('.server-btn.active');
    const serverName = activeBtn ? activeBtn.id.replace('btn-', '') : 'moviez';
    changeServer(serverName);
}

function changeServer(serverName) {
    if (!currentTmdbId) return;
    
    const playerContainer = document.getElementById('player-container');
    let embedUrl = '';
    
    document.getElementById('btn-frembed').classList.remove('active');
    document.getElementById('btn-moviez').classList.remove('active');
    document.getElementById(`btn-${serverName}`).classList.add('active');
    
    const season = document.getElementById('seasonInput') ? document.getElementById('seasonInput').value : 1;
    const episode = document.getElementById('episodeInput') ? document.getElementById('episodeInput').value : 1;

    if (serverName === 'frembed') {
        if (!currentImdbId) {
            playerContainer.innerHTML = '<p style="text-align:center; color:red;">Source indisponible.</p>';
            return;
        }
        if (currentMediaType === 'tv') {
            embedUrl = `https://frembed.bar/embed/tv/${currentImdbId}/${season}/${episode}`;
        } else {
            embedUrl = `https://frembed.bar/embed/movie/${currentImdbId}`;
        }
    } else if (serverName === 'moviez') {
        if (currentMediaType === 'tv') {
            embedUrl = `https://api.moviez.ac/serie/${currentTmdbId}/${season}/${episode}`;
        } else {
            embedUrl = `https://api.moviez.ac/${currentTmdbId}`;
        }
    }
    
    playerContainer.innerHTML = `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" referrerpolicy="origin" allowfullscreen></iframe>`;
}
window.onload = loadHomeCategories;