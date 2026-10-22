// Remplace 'DEMO_KEY' par ta clé API OMDb (tu peux en obtenir une gratuite sur omdbapi.com)
const OMDB_API_KEY = 'e0cf604e'; // J'ai mis une clé publique de test, mais crée la tienne si elle s'épuise

async function searchMovie() {
    const query = document.getElementById('searchInput').value;
    const resultsContainer = document.getElementById('results');
    const playerContainer = document.getElementById('player-container');
    
    // On vide les résultats précédents et le lecteur
    resultsContainer.innerHTML = '';
    playerContainer.innerHTML = '';

    if (!query) return;

    try {
        // 1. On appelle l'API OMDb pour chercher le film
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${OMDB_API_KEY}`);
        const data = await response.json();

        if (data.Response === "True") {
            // 2. On parcourt chaque film trouvé
            data.Search.forEach(movie => {
                // On crée une "carte" pour le film
                const movieElement = document.createElement('div');
                movieElement.classList.add('movie-card');
                
                // On ajoute l'image et le titre. On ajoute un événement "onclick" pour lancer la vidéo
                movieElement.innerHTML = `
                    <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/200x300?text=Pas+d+image'}" alt="${movie.Title}">
                    <h3>${movie.Title} (${movie.Year})</h3>
                `;
                
                // Quand on clique sur la carte du film, on appelle la fonction playMovie avec l'ID IMDb
                movieElement.onclick = () => playMovie(movie.imdbID);
                
                resultsContainer.appendChild(movieElement);
            });
        } else {
            resultsContainer.innerHTML = `<p>Aucun film trouvé.</p>`;
        }
    } catch (error) {
        console.error("Erreur lors de la recherche :", error);
    }
}

function playMovie(imdbID) {
    const playerContainer = document.getElementById('player-container');
    
    // On efface les résultats de recherche pour faire de la place au lecteur
    document.getElementById('results').innerHTML = '';
    
    // 3. On injecte l'iframe de Frembed (ou un autre fournisseur) en utilisant l'ID IMDb
    // Remarque : Remplace l'URL de frembed par la structure exacte demandée par l'API que tu utilises.
    const embedUrl = `https://frembed.pro/api/film.php?id=${imdbID}`;
    
    playerContainer.innerHTML = `
        <h2>Bon visionnage !</h2>
        <iframe src="${embedUrl}" allowfullscreen></iframe>
        <button onclick="searchMovie()" style="margin-top: 20px; padding: 10px;">Retour aux résultats</button>
    `;
    
    // On fait défiler la page vers le lecteur vidéo
    playerContainer.scrollIntoView({ behavior: 'smooth' });
}