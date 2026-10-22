const OMDB_API_KEY = 'e0cf604e';

function showSection(sectionId) {
    // On cache toutes les sections
    document.getElementById('home-section').style.display = 'none';
    document.getElementById('search-section').style.display = 'none';
    document.getElementById('player-section').style.display = 'none';
    
    if(sectionId === 'home') document.getElementById('home-section').style.display = 'block';
    if(sectionId === 'search') document.getElementById('search-section').style.display = 'block';
    if(sectionId === 'player') document.getElementById('player-section').style.display = 'block';
}

async function loadHomeCategories() {
    const trendingKeywords = ['Batman', 'Avengers', 'Spider', 'Star Wars', 'Lord of the rings'];
    const classicKeywords = ['Godfather', 'Matrix', 'Alien', 'Terminator', 'Jurassic', 'Indiana Jones'];
    
    const randomTrend = trendingKeywords[Math.floor(Math.random() * trendingKeywords.length)];
    const randomClassic = classicKeywords[Math.floor(Math.random() * classicKeywords.length)];

    fetchCategory(randomTrend, 'trending-results');
    fetchCategory(randomClassic, 'classic-results');
}

async function fetchCategory(keyword, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '<p>Chargement...</p>';
    
    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(keyword)}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();

        if (data.Response === "True") {
            container.innerHTML = '';
            data.Search.forEach(movie => {
                const movieCard = createMovieCard(movie);
                container.appendChild(movieCard);
            });
        }
    } catch (error) {
        container.innerHTML = '<p>Erreur de chargement.</p>';
    }
}

async function searchMovie() {
    const query = document.getElementById('searchInput').value;
    const year = document.getElementById('yearInput').value;
    const type = document.getElementById('typeInput').value;
    const resultsContainer = document.getElementById('search-results');
    
    if (!query) {
        alert("Veuillez entrer au moins un titre !");
        return;
    }

    resultsContainer.innerHTML = '<p>Recherche en cours...</p>';

    try {
        let apiUrl = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`;
        if (year) apiUrl += `&y=${year}`;
        if (type) apiUrl += `&type=${type}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        resultsContainer.innerHTML = '';

        if (data.Response === "True") {
            data.Search.forEach(movie => {
                const movieCard = createMovieCard(movie);
                resultsContainer.appendChild(movieCard);
            });
        } else {
            resultsContainer.innerHTML = `<p style="color: #d4af37;">${data.Error}</p>`;
        }
    } catch (error) {
        resultsContainer.innerHTML = `<p style="color: red;">Erreur de connexion.</p>`;
    }
}

function createMovieCard(movie) {
    const div = document.createElement('div');
    div.classList.add('movie-card');
    div.innerHTML = `
        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=Pas+d+image'}" alt="${movie.Title}">
        <h3>${movie.Title}</h3>
    `;
    div.onclick = () => playMovie(movie.imdbID);
    return div;
}

function playMovie(imdbID) {
    showSection('player');
    const playerContainer = document.getElementById('player-container');
    const embedUrl = `https://frembed.bar/embed/movie/${imdbID}`;
    
    playerContainer.innerHTML = `
        <iframe src="${embedUrl}" allowfullscreen></iframe>
    `;
}

window.onload = loadHomeCategories;