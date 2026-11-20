/**
 * NAFY STREAM — Architecture Moderne & Fluide
 * Intégration TMDB API & Multi-serveurs de streaming
 */

const TMDB_API_KEY = 'aca5581c3c1261367bad7827b83ffee4';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

// ÉTAT DE L'APPLICATION
const state = {
    currentSection: 'home',
    previousSection: 'home',
    
    // Lecteur actuel
    player: {
        tmdbId: null,
        imdbId: null,
        mediaType: 'movie', // 'movie' ou 'tv'
        title: '',
        season: 1,
        episode: 1,
        server: 'moviez',
        details: null
    },

    // Modal actuel
    activeModalItem: null,

    // Catalogue & Pagination
    browse: {
        type: 'movie',      // 'movie', 'tv', 'trending', 'top_rated', 'genre'
        genreId: null,
        genreName: '',
        sortBy: 'popularity.desc',
        page: 1,
        totalPages: 1,
        isLoading: false
    },

    // Recherche
    search: {
        query: '',
        filter: 'all',
        results: [],
        debounceTimer: null
    },

    // Ma Liste / Watchlist
    watchlist: []
};

// Genre Maps TMDB (Films & Séries)
const GENRE_MAP = {
    28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie',
    80: 'Crime', 99: 'Documentaire', 18: 'Drame', 10751: 'Famille',
    14: 'Fantastique', 36: 'Histoire', 27: 'Horreur', 10402: 'Musique',
    9648: 'Mystère', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'Téléfilm',
    53: 'Thriller', 10752: 'Guerre', 37: 'Western',
    10759: 'Action & Aventure', 10762: 'Enfants', 10763: 'Actualité',
    10764: 'Télé-réalité', 10765: 'Sci-Fi & Fantastique', 10766: 'Feuilleton',
    10767: 'Talk-show', 10768: 'Guerre & Politique'
};

/* ========================================================
   INITIALISATION
   ======================================================== */
document.addEventListener('DOMContentLoaded', () => {
    initWatchlist();
    setupEventListeners();
    loadHomePage();
});

function setupEventListeners() {
    // Barre de recherche globale
    const searchInput = document.getElementById('globalSearchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    const clearBtn = document.getElementById('clearSearchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSearchSubmit(searchInput.value);
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
        mobileSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleSearchSubmit(mobileSearchInput.value);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            if (state.currentSection === 'search') {
                navigateTo(state.previousSection || 'home');
            }
        });
    }

    // Fermeture modal avec Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeInfoModal();
        }
    });
}

/* ========================================================
   NAVIGATION ENTRE SECTIONS
   ======================================================== */
function navigateTo(sectionId, updateHistory = true) {
    if (state.currentSection !== sectionId) {
        state.previousSection = state.currentSection;
    }
    state.currentSection = sectionId;

    // Masque toutes les sections
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    
    // Mise à jour de la classe active sur les liens nav
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.dataset.target === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Affiche la section cible
    if (sectionId === 'home') {
        document.getElementById('home-section').style.display = 'block';
    } else if (sectionId === 'movies') {
        document.getElementById('browse-section').style.display = 'block';
        loadCatalogView('movie', 'Films');
    } else if (sectionId === 'series') {
        document.getElementById('browse-section').style.display = 'block';
        loadCatalogView('tv', 'Séries TV');
    } else if (sectionId === 'trending') {
        document.getElementById('browse-section').style.display = 'block';
        loadCatalogView('trending', 'Tendances de la semaine');
    } else if (sectionId === 'watchlist') {
        document.getElementById('watchlist-section').style.display = 'block';
        renderWatchlist();
    } else if (sectionId === 'search') {
        document.getElementById('search-section').style.display = 'block';
    } else if (sectionId === 'player') {
        document.getElementById('player-section').style.display = 'block';
    }
}

function returnFromPlayer() {
    // Arrête le flux vidéo lors du retour
    const container = document.getElementById('player-container');
    if (container) container.innerHTML = '';
    
    navigateTo(state.previousSection === 'player' ? 'home' : (state.previousSection || 'home'));
}

function toggleMobileSearch() {
    const drawer = document.getElementById('mobileSearchDrawer');
    drawer.classList.toggle('open');
    if (drawer.classList.contains('open')) {
        document.getElementById('mobileSearchInput').focus();
    }
}

/* ========================================================
   GESTION DE L'ACCUEIL & DES CARROUSELS
   ======================================================== */
async function loadHomePage() {
    // 1. Hero Banner
    loadHeroBanner();

    // 2. Carrousels
    fetchCarousel(`${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=fr-FR`, 'trending-carousel');
    fetchCarousel(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`, 'movies-carousel', 'movie');
    fetchCarousel(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`, 'series-carousel', 'tv');
    fetchCarousel(`${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=fr-FR&page=1`, 'toprated-carousel', 'movie');
}

// Chargement du Hero Banner avec le #1 en tendance
async function loadHeroBanner() {
    try {
        const res = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=fr-FR`);
        const data = await res.json();
        
        if (!data.results || data.results.length === 0) return;
        
        // Sélectionne le premier titre avec backdrop disponible
        const item = data.results.find(m => m.backdrop_path && (m.overview || m.title || m.name)) || data.results[0];
        const isTv = item.media_type === 'tv' || (!item.title && item.name);
        const title = item.title || item.name;
        const year = (item.release_date || item.first_air_date || '2026').substring(0, 4);
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.0';

        const backdropEl = document.getElementById('heroBackdrop');
        const titleEl = document.getElementById('heroTitle');
        const overviewEl = document.getElementById('heroOverview');
        const typeBadge = document.getElementById('heroTypeBadge');
        const ratingBadge = document.getElementById('heroRatingBadge');
        const yearBadge = document.getElementById('heroYearBadge');
        const genresEl = document.getElementById('heroGenres');
        const playBtn = document.getElementById('heroPlayBtn');
        const infoBtn = document.getElementById('heroInfoBtn');
        const bookmarkBtn = document.getElementById('heroBookmarkBtn');

        if (item.backdrop_path) {
            backdropEl.style.backgroundImage = `url('${TMDB_BACKDROP_BASE}${item.backdrop_path}')`;
        }

        titleEl.textContent = title;
        overviewEl.textContent = item.overview || "Découvrez ce titre incontournable disponible dès maintenant en haute définition.";
        typeBadge.textContent = isTv ? 'SÉRIE' : 'FILM';
        ratingBadge.innerHTML = `<i class="fa-solid fa-star"></i> ${rating}`;
        yearBadge.textContent = year;

        // Tags de genres
        genresEl.innerHTML = '';
        if (item.genre_ids) {
            item.genre_ids.slice(0, 3).forEach(gid => {
                if (GENRE_MAP[gid]) {
                    const span = document.createElement('span');
                    span.className = 'hero-genre-tag';
                    span.textContent = GENRE_MAP[gid];
                    genresEl.appendChild(span);
                }
            });
        }

        // Actions du Hero
        playBtn.onclick = () => playMedia(item.id, isTv ? 'tv' : 'movie');
        infoBtn.onclick = () => openInfoModal(item.id, isTv ? 'tv' : 'movie');
        
        updateBookmarkBtnIcon(bookmarkBtn, item.id);
        bookmarkBtn.onclick = () => {
            toggleWatchlist(item, isTv ? 'tv' : 'movie');
            updateBookmarkBtnIcon(bookmarkBtn, item.id);
        };

    } catch (err) {
        console.error("Erreur lors du chargement du Hero Banner :", err);
    }
}

// Remplissage d'un carrousel horizontal
async function fetchCarousel(url, containerId, forcedType = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Squelettes de chargement temporaires
    container.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');

    try {
        const response = await fetch(url);
        const data = await response.json();

        container.innerHTML = '';
        if (data.results && data.results.length > 0) {
            data.results.forEach(item => {
                const mediaType = forcedType || item.media_type || (item.name ? 'tv' : 'movie');
                if (mediaType === 'person') return;
                const card = createMediaCard(item, mediaType);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="text-muted" style="padding: 20px;">Aucun contenu disponible pour le moment.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="color: #e50914; padding: 20px;">Impossible de charger les contenus.</p>';
        console.error("Erreur carousel :", error);
    }
}

// Défilement du carrousel
function scrollCarousel(containerId, direction) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75 * direction;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
}

/* ========================================================
   CRÉATION D'UNE CARTE FILM / SÉRIE MODERNE
   ======================================================== */
function createMediaCard(item, mediaType = 'movie') {
    const card = document.createElement('div');
    card.className = 'media-card';
    
    const title = item.title || item.name || 'Titre inconnu';
    const releaseDate = item.release_date || item.first_air_date || '';
    const year = releaseDate ? releaseDate.substring(0, 4) : '—';
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '—';
    const isTv = mediaType === 'tv';
    const typeLabel = isTv ? 'SÉRIE' : 'FILM';
    
    const posterUrl = item.poster_path 
        ? `${TMDB_IMAGE_BASE}${item.poster_path}`
        : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=60';

    const isSaved = isMediaInWatchlist(item.id);

    card.innerHTML = `
        <div class="card-poster-wrapper">
            <img src="${posterUrl}" alt="${escapeHtml(title)}" loading="lazy">
            <div class="card-badges-top">
                <span class="card-rating-badge"><i class="fa-solid fa-star"></i> ${rating}</span>
                <span class="card-type-badge">${typeLabel}</span>
            </div>
            <button class="card-bookmark-btn ${isSaved ? 'saved' : ''}" title="${isSaved ? 'Retirer de Ma Liste' : 'Ajouter à Ma Liste'}" onclick="event.stopPropagation(); handleCardBookmark(this, ${item.id})">
                <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
            </button>
            <div class="card-hover-overlay">
                <div class="card-play-btn"><i class="fa-solid fa-play"></i></div>
            </div>
        </div>
        <div class="card-info">
            <h3 class="card-title" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>
            <div class="card-meta-line">
                <span>${year}</span>
                <span>${typeLabel}</span>
            </div>
        </div>
    `;

    // Attache l'objet complet pour le bouton bookmark
    card._mediaData = item;
    card._mediaType = mediaType;

    // Clic principal : ouvre la fiche d'infos
    card.onclick = () => openInfoModal(item.id, mediaType);

    return card;
}

function handleCardBookmark(btn, id) {
    const card = btn.closest('.media-card');
    if (!card || !card._mediaData) return;
    
    const item = card._mediaData;
    const mediaType = card._mediaType || 'movie';
    const isNowSaved = toggleWatchlist(item, mediaType);

    if (isNowSaved) {
        btn.classList.add('saved');
        btn.querySelector('i').className = 'fa-solid fa-bookmark';
        btn.title = 'Retirer de Ma Liste';
    } else {
        btn.classList.remove('saved');
        btn.querySelector('i').className = 'fa-regular fa-bookmark';
        btn.title = 'Ajouter à Ma Liste';

        // Si nous sommes dans la vue Ma Liste, rafraîchit la grille
        if (state.currentSection === 'watchlist') {
            renderWatchlist();
        }
    }
}

/* ========================================================
   FILTRE PAR GENRE
   ======================================================== */
function filterByGenre(genreId, pillElement, genreName = '') {
    document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
    pillElement.classList.add('active');

    if (genreId === null) {
        // Retour à l'accueil standard
        if (state.currentSection !== 'home') navigateTo('home');
        return;
    }

    state.browse.type = 'genre';
    state.browse.genreId = genreId;
    state.browse.genreName = genreName;
    state.browse.page = 1;

    navigateTo('movies');
    loadCatalogView('genre', `Genre : ${genreName}`);
}

/* ========================================================
   VUE CATALOGUE & PAGINATION
   ======================================================== */
async function loadCatalogView(type, title) {
    state.browse.type = type;
    state.browse.page = 1;

    document.getElementById('browseTitle').textContent = title;
    document.getElementById('browseSubtitle').textContent = `Explorez notre sélection complète en haute définition`;

    const grid = document.getElementById('browseGrid');
    grid.innerHTML = Array(12).fill('<div class="skeleton-card"></div>').join('');

    await fetchCatalogData(true);
}

async function fetchCatalogData(reset = false) {
    if (state.browse.isLoading) return;
    state.browse.isLoading = true;

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadingIcon = loadMoreBtn ? loadMoreBtn.querySelector('.loading-icon') : null;
    if (loadingIcon) loadingIcon.style.display = 'inline-block';

    let url = '';
    const page = state.browse.page;
    const sort = state.browse.sortBy || 'popularity.desc';

    if (state.browse.type === 'movie') {
        url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=fr-FR&sort_by=${sort}&page=${page}`;
    } else if (state.browse.type === 'tv') {
        url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&language=fr-FR&sort_by=${sort}&page=${page}`;
    } else if (state.browse.type === 'trending') {
        url = `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`;
    } else if (state.browse.type === 'top_rated') {
        url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=fr-FR&page=${page}`;
    } else if (state.browse.type === 'genre') {
        url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=fr-FR&with_genres=${state.browse.genreId}&sort_by=${sort}&page=${page}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        state.browse.totalPages = data.total_pages || 1;
        const grid = document.getElementById('browseGrid');

        if (reset) grid.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach(item => {
                const defaultType = state.browse.type === 'tv' ? 'tv' : 'movie';
                const mediaType = item.media_type || defaultType;
                if (mediaType === 'person') return;
                const card = createMediaCard(item, mediaType);
                grid.appendChild(card);
            });

            if (loadMoreBtn) {
                loadMoreBtn.style.display = state.browse.page < state.browse.totalPages ? 'inline-flex' : 'none';
            }
        } else if (reset) {
            grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">Aucun contenu trouvé dans cette catégorie.</p>';
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        }
    } catch (err) {
        console.error("Erreur catalogue :", err);
    } finally {
        state.browse.isLoading = false;
        if (loadingIcon) loadingIcon.style.display = 'none';
    }
}

function loadMoreBrowse() {
    if (state.browse.page < state.browse.totalPages) {
        state.browse.page += 1;
        fetchCatalogData(false);
    }
}

function onSortChange() {
    const select = document.getElementById('browseSortSelect');
    state.browse.sortBy = select.value;
    state.browse.page = 1;
    fetchCatalogData(true);
}

/* ========================================================
   RECHERCHE EN TEMPS RÉEL (DEBOUNCE + FILTRES)
   ======================================================== */
function handleSearchInput(query) {
    const clearBtn = document.getElementById('clearSearchBtn');
    if (clearBtn) clearBtn.style.display = query.length > 0 ? 'block' : 'none';

    clearTimeout(state.search.debounceTimer);
    if (!query || query.trim().length === 0) return;

    state.search.debounceTimer = setTimeout(() => {
        executeSearch(query.trim());
    }, 350);
}

function handleSearchSubmit(query) {
    if (!query || query.trim().length === 0) return;
    executeSearch(query.trim());
}

async function executeSearch(query) {
    state.search.query = query;
    navigateTo('search');

    document.getElementById('searchQueryLabel').textContent = `"${query}"`;
    const countLabel = document.getElementById('searchResultsCount');
    const grid = document.getElementById('searchResultsGrid');
    
    countLabel.textContent = 'Recherche en cours...';
    grid.innerHTML = Array(8).fill('<div class="skeleton-card"></div>').join('');

    try {
        const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=fr-FR&page=1`;
        const res = await fetch(url);
        const data = await res.json();

        state.search.results = (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
        renderSearchResults();

    } catch (err) {
        grid.innerHTML = '<p style="color: #e50914; grid-column: 1/-1; text-align: center;">Erreur lors de la recherche.</p>';
        console.error("Erreur recherche :", err);
    }
}

function filterSearchResults(filterType) {
    state.search.filter = filterType;
    document.querySelectorAll('.filter-tab').forEach(tab => {
        if (tab.dataset.filter === filterType) tab.classList.add('active');
        else tab.classList.remove('active');
    });
    renderSearchResults();
}

function renderSearchResults() {
    const grid = document.getElementById('searchResultsGrid');
    const countLabel = document.getElementById('searchResultsCount');
    
    let filtered = state.search.results;
    if (state.search.filter !== 'all') {
        filtered = filtered.filter(item => item.media_type === state.search.filter);
    }

    countLabel.textContent = `${filtered.length} résultat(s) disponible(s)`;
    grid.innerHTML = '';

    if (filtered.length > 0) {
        filtered.forEach(item => {
            const card = createMediaCard(item, item.media_type);
            grid.appendChild(card);
        });
    } else {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
                <h3>Aucun résultat trouvé</h3>
                <p>Essayez avec un autre titre ou vérifiez l'orthographe.</p>
            </div>
        `;
    }
}

/* ========================================================
   MODAL D'INFORMATIONS & BANDE-ANNONCE
   ======================================================== */
async function openInfoModal(id, mediaType = 'movie') {
    const modal = document.getElementById('infoModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Rénitialisation des champs
    document.getElementById('modalTitle').textContent = 'Chargement...';
    document.getElementById('modalOverview').textContent = '';
    document.getElementById('modalTrailerContainer').style.display = 'none';
    document.getElementById('modalTrailerIframe').src = '';
    document.getElementById('modalCastList').innerHTML = '';
    document.getElementById('modalGenresList').innerHTML = '';

    try {
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const url = `${TMDB_BASE_URL}/${endpoint}/${id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=credits,videos,external_ids`;
        const res = await fetch(url);
        const data = await res.json();

        state.activeModalItem = { ...data, media_type: mediaType };

        const title = data.title || data.name;
        const year = (data.release_date || data.first_air_date || '—').substring(0, 4);
        const rating = data.vote_average ? data.vote_average.toFixed(1) : '—';
        const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : (data.number_of_seasons ? `${data.number_of_seasons} saison(s)` : '—');
        
        // Bannière
        const banner = document.getElementById('modalBanner');
        if (data.backdrop_path) {
            banner.style.backgroundImage = `url('${TMDB_BACKDROP_BASE}${data.backdrop_path}')`;
        } else if (data.poster_path) {
            banner.style.backgroundImage = `url('${TMDB_IMAGE_BASE}${data.poster_path}')`;
        }

        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalRating').innerHTML = `<i class="fa-solid fa-star"></i> ${rating}`;
        document.getElementById('modalYear').textContent = year;
        document.getElementById('modalType').textContent = mediaType === 'tv' ? 'Série TV' : 'Film';
        document.getElementById('modalRuntime').textContent = runtime;
        document.getElementById('modalOverview').textContent = data.overview || "Aucun synopsis disponible pour ce titre.";
        
        document.getElementById('modalReleaseDate').textContent = data.release_date || data.first_air_date || 'Non communiquée';
        document.getElementById('modalVotes').textContent = `${rating} / 10 (${data.vote_count || 0} avis)`;
        document.getElementById('modalStatus').textContent = data.status || 'Disponible';

        // Genres
        const genresList = document.getElementById('modalGenresList');
        genresList.innerHTML = '';
        if (data.genres) {
            data.genres.forEach(g => {
                const span = document.createElement('span');
                span.className = 'genre-tag-item';
                span.textContent = g.name;
                genresList.appendChild(span);
            });
        }

        // Bande-annonce (YouTube)
        const trailerContainer = document.getElementById('modalTrailerContainer');
        const trailerIframe = document.getElementById('modalTrailerIframe');
        if (data.videos && data.videos.results && data.videos.results.length > 0) {
            const trailer = data.videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || data.videos.results[0];
            if (trailer && trailer.key) {
                trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}?rel=0`;
                trailerContainer.style.display = 'block';
            }
        }

        // Casting principal
        const castList = document.getElementById('modalCastList');
        castList.innerHTML = '';
        if (data.credits && data.credits.cast) {
            data.credits.cast.slice(0, 6).forEach(actor => {
                const chip = document.createElement('span');
                chip.className = 'cast-chip';
                chip.textContent = `${actor.name} (${actor.character || 'Rôle'})`;
                castList.appendChild(chip);
            });
        }

        // Bouton Regarder
        const playBtn = document.getElementById('modalPlayBtn');
        playBtn.onclick = () => {
            closeInfoModal();
            playMedia(id, mediaType, data);
        };

        // Bouton Ma Liste
        const bookmarkBtn = document.getElementById('modalBookmarkBtn');
        updateBookmarkBtnText(bookmarkBtn, id);
        bookmarkBtn.onclick = () => {
            toggleWatchlist(data, mediaType);
            updateBookmarkBtnText(bookmarkBtn, id);
        };

    } catch (err) {
        console.error("Erreur détails modal :", err);
    }
}

function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // Coupe la vidéo YouTube de la bande-annonce
    document.getElementById('modalTrailerIframe').src = '';
}

function closeModalOnBackdrop(e) {
    if (e.target.id === 'infoModal') {
        closeInfoModal();
    }
}

/* ========================================================
   LECTEUR VIDÉO AVANCÉ & GESTION MULTI-SERVEURS
   ======================================================== */
async function playMedia(id, mediaType = 'movie', preloadedData = null) {
    state.player.tmdbId = id;
    state.player.mediaType = mediaType;
    state.player.season = 1;
    state.player.episode = 1;

    navigateTo('player');

    // Panneau de contrôle Séries TV
    const tvControls = document.getElementById('tv-controls-panel');
    if (mediaType === 'tv') {
        tvControls.style.display = 'block';
    } else {
        tvControls.style.display = 'none';
    }

    try {
        // Récupère les external_ids pour l'imdb_id (requis par certains serveurs comme Frembed)
        const endpoint = mediaType === 'tv' ? 'tv' : 'movie';
        const res = await fetch(`${TMDB_BASE_URL}/${endpoint}/${id}?api_key=${TMDB_API_KEY}&language=fr-FR&append_to_response=external_ids,credits,similar`);
        const data = await res.json();
        
        state.player.details = data;
        state.player.imdbId = data.external_ids ? data.external_ids.imdb_id : null;

        // Mise à jour de l'UI du lecteur
        const title = data.title || data.name;
        state.player.title = title;
        const year = (data.release_date || data.first_air_date || '2026').substring(0, 4);

        document.getElementById('playerMediaTitle').textContent = title;
        document.getElementById('playerMediaYear').textContent = year;
        document.getElementById('playerMediaBadge').textContent = mediaType === 'tv' ? 'SÉRIE' : 'FILM';
        
        document.getElementById('playerPosterImg').src = data.poster_path 
            ? `${TMDB_IMAGE_BASE}${data.poster_path}`
            : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=60';
        
        document.getElementById('playerDetailRating').innerHTML = `<i class="fa-solid fa-star"></i> ${data.vote_average ? data.vote_average.toFixed(1) : '8.0'}`;
        document.getElementById('playerDetailRuntime').textContent = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : (data.number_of_seasons ? `${data.number_of_seasons} Saison(s)` : 'HD');
        document.getElementById('playerDetailRelease').textContent = year;
        document.getElementById('playerDetailOverview').textContent = data.overview || 'Bon visionnage sur Nafy Stream !';

        // Genres sous le lecteur
        const genresContainer = document.getElementById('playerDetailGenres');
        genresContainer.innerHTML = '';
        if (data.genres) {
            data.genres.forEach(g => {
                const span = document.createElement('span');
                span.className = 'genre-tag-item';
                span.textContent = g.name;
                genresContainer.appendChild(span);
            });
        }

        // Casting sous le lecteur
        const castContainer = document.getElementById('playerDetailCast');
        castContainer.innerHTML = '';
        if (data.credits && data.credits.cast) {
            data.credits.cast.slice(0, 5).forEach(a => {
                const chip = document.createElement('span');
                chip.className = 'cast-chip';
                chip.textContent = a.name;
                castContainer.appendChild(chip);
            });
        }

        // Bouton bookmark dans le player
        const bookmarkBtn = document.getElementById('playerBookmarkBtn');
        updateBookmarkBtnIcon(bookmarkBtn, id);
        bookmarkBtn.onclick = () => {
            toggleWatchlist(data, mediaType);
            updateBookmarkBtnIcon(bookmarkBtn, id);
        };

        // Si Série TV : peuple le sélecteur de saisons et charge les épisodes
        if (mediaType === 'tv') {
            setupSeasonSelector(data.seasons || []);
        }

        // Recommandations similaires
        renderSimilarCarousel(data.similar ? data.similar.results : []);

        // Lance la lecture sur le serveur actif (défaut : Moviez)
        changeServer(state.player.server);

    } catch (err) {
        console.error("Erreur chargement lecteur :", err);
        const container = document.getElementById('player-container');
        container.innerHTML = `<div class="player-loader"><p style="color:#e50914;">Erreur lors de la préparation de la vidéo.</p></div>`;
    }
}

// Configuration des saisons pour une série
function setupSeasonSelector(seasons) {
    const seasonSelect = document.getElementById('seasonSelect');
    seasonSelect.innerHTML = '';

    // Filtre les saisons régulières (exclut souvent les bonus Saison 0 si souhaité ou les inclut)
    const validSeasons = seasons.filter(s => s.season_number > 0);
    const listToUse = validSeasons.length > 0 ? validSeasons : seasons;

    listToUse.forEach(s => {
        const option = document.createElement('option');
        option.value = s.season_number;
        option.textContent = s.name || `Saison ${s.season_number}`;
        seasonSelect.appendChild(option);
    });

    state.player.season = listToUse.length > 0 ? listToUse[0].season_number : 1;
    loadEpisodesForSeason(state.player.season);
}

async function onSeasonChange() {
    const seasonSelect = document.getElementById('seasonSelect');
    state.player.season = parseInt(seasonSelect.value, 10);
    state.player.episode = 1;
    await loadEpisodesForSeason(state.player.season);
    changeServer(state.player.server);
}

// Charge les épisodes d'une saison depuis TMDB
async function loadEpisodesForSeason(seasonNumber) {
    const container = document.getElementById('episodesContainer');
    const label = document.getElementById('episodesCountLabel');
    container.innerHTML = '<span class="text-muted" style="font-size:0.85rem;">Chargement des épisodes...</span>';

    try {
        const url = `${TMDB_BASE_URL}/tv/${state.player.tmdbId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=fr-FR`;
        const res = await fetch(url);
        const data = await res.json();

        container.innerHTML = '';

        if (data.episodes && data.episodes.length > 0) {
            label.textContent = `Saison ${seasonNumber} (${data.episodes.length} épisodes) :`;
            data.episodes.forEach(ep => {
                const chip = document.createElement('button');
                chip.className = `episode-chip ${ep.episode_number === state.player.episode ? 'active' : ''}`;
                chip.textContent = `Ép. ${ep.episode_number}${ep.name ? ' : ' + ep.name : ''}`;
                chip.onclick = () => {
                    document.querySelectorAll('.episode-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    state.player.episode = ep.episode_number;
                    changeServer(state.player.server);
                };
                container.appendChild(chip);
            });
        } else {
            // Mode de secours si TMDB n'a pas le détail des épisodes
            label.textContent = `Saison ${seasonNumber} :`;
            for (let i = 1; i <= 24; i++) {
                const chip = document.createElement('button');
                chip.className = `episode-chip ${i === state.player.episode ? 'active' : ''}`;
                chip.textContent = `Épisode ${i}`;
                chip.onclick = () => {
                    document.querySelectorAll('.episode-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    state.player.episode = i;
                    changeServer(state.player.server);
                };
                container.appendChild(chip);
            }
        }
    } catch (err) {
        console.error("Erreur épisodes :", err);
    }
}

// Changement de serveur de streaming avec gestion multi-serveurs HD
function changeServer(serverName) {
    state.player.server = serverName;
    const { tmdbId, imdbId, mediaType, season, episode } = state.player;

    if (!tmdbId) return;

    // Mise à jour visuelle des boutons serveurs
    document.querySelectorAll('.server-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${serverName}`);
    if (activeBtn) activeBtn.classList.add('active');

    const container = document.getElementById('player-container');
    container.innerHTML = `
        <div class="player-loader">
            <div class="spinner"></div>
            <p>Connexion au ${serverName.toUpperCase()}...</p>
        </div>
    `;

    let embedUrl = '';

    if (serverName === 'moviez') {
        if (mediaType === 'tv') {
            embedUrl = `https://api.moviez.ac/serie/${tmdbId}/${season}/${episode}`;
        } else {
            embedUrl = `https://api.moviez.ac/${tmdbId}`;
        }
    } else if (serverName === 'frembed') {
        const idToUse = imdbId || tmdbId;
        if (mediaType === 'tv') {
            embedUrl = `https://frembed.bar/embed/tv/${idToUse}/${season}/${episode}`;
        } else {
            embedUrl = `https://frembed.bar/embed/movie/${idToUse}`;
        }
    } else if (serverName === 'vidlink') {
        if (mediaType === 'tv') {
            embedUrl = `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
        } else {
            embedUrl = `https://vidlink.pro/movie/${tmdbId}`;
        }
    } else if (serverName === 'multiembed') {
        if (mediaType === 'tv') {
            embedUrl = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
        } else {
            embedUrl = `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`;
        }
    }

    // Injection propre de l'iframe après un court délai pour fluidité
    setTimeout(() => {
        container.innerHTML = `
            <iframe 
                src="${embedUrl}" 
                width="100%" 
                height="100%" 
                frameborder="0" 
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture" 
                referrerpolicy="origin" 
                allowfullscreen>
            </iframe>
        `;
    }, 150);
}

// Recommandations similaires
function renderSimilarCarousel(results) {
    const container = document.getElementById('similarCarousel');
    if (!container) return;
    container.innerHTML = '';

    if (results && results.length > 0) {
        results.slice(0, 10).forEach(item => {
            const card = createMediaCard(item, state.player.mediaType);
            container.appendChild(card);
        });
    } else {
        container.innerHTML = '<p class="text-muted">Aucune recommandation disponible.</p>';
    }
}

/* ========================================================
   MA LISTE (WATCHLIST LOCALSTORAGE)
   ======================================================== */
function initWatchlist() {
    try {
        const saved = localStorage.getItem('nafy_watchlist');
        state.watchlist = saved ? JSON.parse(saved) : [];
    } catch (e) {
        state.watchlist = [];
    }
    updateWatchlistBadge();
}

function saveWatchlist() {
    try {
        localStorage.setItem('nafy_watchlist', JSON.stringify(state.watchlist));
    } catch (e) {
        console.error("Impossible de sauvegarder la watchlist :", e);
    }
    updateWatchlistBadge();
}

function updateWatchlistBadge() {
    const badge = document.getElementById('watchlist-badge');
    if (badge) {
        badge.textContent = state.watchlist.length;
        badge.style.display = state.watchlist.length > 0 ? 'inline-block' : 'none';
    }
}

function isMediaInWatchlist(id) {
    return state.watchlist.some(item => item.id === id);
}

function toggleWatchlist(item, mediaType = 'movie') {
    const index = state.watchlist.findIndex(m => m.id === item.id);
    let added = false;

    if (index > -1) {
        state.watchlist.splice(index, 1);
        showToast(`"${item.title || item.name}" retiré de Ma Liste`, 'fa-trash-can');
    } else {
        state.watchlist.unshift({
            id: item.id,
            title: item.title || item.name,
            poster_path: item.poster_path,
            vote_average: item.vote_average,
            release_date: item.release_date || item.first_air_date,
            media_type: mediaType
        });
        added = true;
        showToast(`"${item.title || item.name}" ajouté à Ma Liste !`, 'fa-circle-check');
    }

    saveWatchlist();
    return added;
}

function renderWatchlist() {
    const grid = document.getElementById('watchlistGrid');
    const emptyState = document.getElementById('emptyWatchlist');
    const clearBtn = document.getElementById('clearWatchlistBtn');

    grid.innerHTML = '';

    if (state.watchlist.length > 0) {
        emptyState.style.display = 'none';
        clearBtn.style.display = 'inline-flex';

        state.watchlist.forEach(item => {
            const card = createMediaCard(item, item.media_type || 'movie');
            grid.appendChild(card);
        });
    } else {
        emptyState.style.display = 'block';
        clearBtn.style.display = 'none';
    }
}

function clearWatchlist() {
    if (confirm("Voulez-vous vraiment effacer tous les éléments de votre liste ?")) {
        state.watchlist = [];
        saveWatchlist();
        renderWatchlist();
        showToast('Votre liste a été vidée', 'fa-trash-can');
    }
}

function updateBookmarkBtnIcon(btn, id) {
    if (!btn) return;
    const isSaved = isMediaInWatchlist(id);
    const icon = btn.querySelector('i');
    if (isSaved) {
        btn.classList.add('active');
        if (icon) icon.className = 'fa-solid fa-bookmark';
    } else {
        btn.classList.remove('active');
        if (icon) icon.className = 'fa-regular fa-bookmark';
    }
}

function updateBookmarkBtnText(btn, id) {
    if (!btn) return;
    const isSaved = isMediaInWatchlist(id);
    btn.innerHTML = `<i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isSaved ? 'Dans Ma Liste' : 'Ma Liste'}`;
    if (isSaved) btn.classList.add('btn-primary');
    else btn.classList.remove('btn-primary');
}

/* ========================================================
   NOTIFICATIONS TOAST & UTILITAIRES
   ======================================================== */
let toastTimeout = null;
function showToast(message, iconClass = 'fa-circle-check') {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    const iconEl = document.getElementById('toastIcon');

    msgEl.textContent = message;
    iconEl.className = `fa-solid ${iconClass}`;

    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function shareCurrentMedia() {
    const title = state.player.title || 'Nafy Stream';
    if (navigator.share) {
        navigator.share({
            title: `${title} sur Nafy Stream`,
            text: `Regarde ${title} en streaming HD sur Nafy Stream !`,
            url: window.location.href
        }).catch(() => {});
    } else {
        // Fallback copie dans le presse-papier
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast("Lien copié dans le presse-papier !", "fa-link");
        }).catch(() => {
            showToast("Lien prêt à être partagé", "fa-share-nodes");
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
