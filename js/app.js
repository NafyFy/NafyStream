/**
 * NAFY STREAM — ORCHESTRATEUR PRINCIPAL DE L'APPLICATION
 */

window.Nafy = window.Nafy || {};

Nafy.App = {
    browseState: {
        type: 'movie',
        genreId: null,
        providerId: null,
        title: '',
        sortBy: 'popularity.desc',
        page: 1,
        totalPages: 1,
        isLoading: false
    },

    searchState: {
        query: '',
        filter: 'all',
        results: [],
        debounceTimer: null
    },

    homeRendered: false,

    init() {
        // Applique le thème sauvegardé
        const settings = Nafy.Storage.getSettings();
        if (settings && settings.theme) {
            document.documentElement.setAttribute('data-theme', settings.theme);
        }

        Nafy.Storage.notifyWatchlistChange();
        Nafy.Player.init();
        this.setupEventListeners();
        Nafy.Router.init();
    },

    setupEventListeners() {
        const searchInput = document.getElementById('globalSearchInput');
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.onSearchInput(e.target.value));
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.onSearchSubmit(searchInput.value);
            });
        }

        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', (e) => this.onSearchInput(e.target.value));
            mobileSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.onSearchSubmit(mobileSearchInput.value);
            });
        }

        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                if (Nafy.Router.currentRoute === 'search') {
                    Nafy.Router.navigate(Nafy.Router.previousRoute || 'home');
                }
            });
        }

        // Touche Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Nafy.UI.closeInfoModal();
                Nafy.UI.closeSettingsModal();
            }
        });
    },

    // ================= RENDU DE L'ACCUEIL =================
    async renderHome() {
        // Historique "Continuer la lecture" (toujours frais)
        this.renderResumeRow();

        if (this.homeRendered) return;
        this.homeRendered = true;

        this.renderHero();
        this.renderTop10();
        this.renderCarousel(() => Nafy.Api.getTrending('all', 'week'), 'trending-carousel');
        this.renderCarousel(() => Nafy.Api.getPopularMovies(1), 'movies-carousel', 'movie');
        this.renderCarousel(() => Nafy.Api.getPopularTv(1), 'series-carousel', 'tv');
        this.renderCarousel(() => Nafy.Api.getTopRatedMovies(1), 'toprated-carousel', 'movie');
    },

    async renderHero() {
        try {
            const data = await Nafy.Api.getTrending('all', 'day');
            if (!data.results || data.results.length === 0) return;
            
            const item = data.results.find(m => m.backdrop_path && (m.title || m.name)) || data.results[0];
            const isTv = item.media_type === 'tv' || (!item.title && item.name);
            const title = item.title || item.name;
            const year = (item.release_date || item.first_air_date || '2026').substring(0, 4);
            const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.0';

            const backdropEl = document.getElementById('heroBackdrop');
            if (backdropEl && item.backdrop_path) {
                backdropEl.style.backgroundImage = `url('${Nafy.Config.TMDB_BACKDROP_BASE}${item.backdrop_path}')`;
            }

            document.getElementById('heroTitle').textContent = title;
            document.getElementById('heroOverview').textContent = item.overview || "Découvrez ce titre incontournable disponible dès maintenant en haute définition.";
            document.getElementById('heroTypeBadge').textContent = isTv ? 'SÉRIE' : 'FILM';
            document.getElementById('heroRatingBadge').innerHTML = `<i class="fa-solid fa-star"></i> ${rating}`;
            document.getElementById('heroYearBadge').textContent = year;

            const genresEl = document.getElementById('heroGenres');
            genresEl.innerHTML = '';
            if (item.genre_ids) {
                item.genre_ids.slice(0, 3).forEach(gid => {
                    if (Nafy.Config.GENRES[gid]) {
                        const span = document.createElement('span');
                        span.className = 'hero-genre-tag';
                        span.textContent = Nafy.Config.GENRES[gid];
                        genresEl.appendChild(span);
                    }
                });
            }

            document.getElementById('heroPlayBtn').onclick = () => {
                Nafy.Router.navigate(`watch/${isTv ? 'tv' : 'movie'}/${item.id}`);
            };
            document.getElementById('heroInfoBtn').onclick = () => {
                Nafy.UI.openInfoModal(item.id, isTv ? 'tv' : 'movie');
            };

            const bookmarkBtn = document.getElementById('heroBookmarkBtn');
            Nafy.UI.updateBookmarkButton(bookmarkBtn, item.id);
            bookmarkBtn.onclick = () => {
                Nafy.Storage.toggleWatchlist(item, isTv ? 'tv' : 'movie');
                Nafy.UI.updateBookmarkButton(bookmarkBtn, item.id);
            };
        } catch (e) {
            console.error("Erreur Hero :", e);
        }
    },

    renderResumeRow() {
        const container = document.getElementById('resumeCarousel');
        const section = document.getElementById('resumeSection');
        if (!container || !section) return;

        const history = Nafy.Storage.getHistory();
        if (history && history.length > 0) {
            section.style.display = 'block';
            container.innerHTML = '';
            history.forEach(item => {
                const card = Nafy.UI.createResumeCard(item);
                container.appendChild(card);
            });
        } else {
            section.style.display = 'none';
        }
    },

    async renderTop10() {
        const container = document.getElementById('top10-carousel');
        if (!container) return;
        container.innerHTML = Array(6).fill('<div class="skeleton-card" style="flex:0 0 240px;"></div>').join('');

        try {
            const data = await Nafy.Api.getTrending('all', 'day');
            container.innerHTML = '';
            if (data.results) {
                data.results.slice(0, 10).forEach((item, index) => {
                    const card = Nafy.UI.createTop10Card(item, index + 1);
                    container.appendChild(card);
                });
            }
        } catch (e) {
            container.innerHTML = '';
        }
    },

    async renderCarousel(fetchFn, containerId, forcedType = null) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');

        try {
            const data = await fetchFn();
            container.innerHTML = '';
            if (data.results && data.results.length > 0) {
                data.results.forEach(item => {
                    const mediaType = forcedType || item.media_type || (item.name ? 'tv' : 'movie');
                    if (mediaType === 'person') return;
                    const card = Nafy.UI.createMediaCard(item, mediaType);
                    container.appendChild(card);
                });
            }
        } catch (e) {
            container.innerHTML = '<p class="text-muted" style="padding:15px;">Chargement impossible.</p>';
        }
    },

    scrollCarousel(containerId, direction) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const scrollAmount = container.clientWidth * 0.75 * direction;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    },

    // ================= CATALOGUE & FILTRES =================
    async loadCatalog(type, title) {
        this.browseState.type = type;
        this.browseState.title = title;
        this.browseState.genreId = null;
        this.browseState.providerId = null;
        this.browseState.page = 1;

        document.getElementById('browseTitle').textContent = title;
        document.getElementById('browseSubtitle').textContent = 'Explorez notre sélection haute définition';
        document.getElementById('browseGrid').innerHTML = Array(12).fill('<div class="skeleton-card"></div>').join('');

        await this.fetchCatalog(true);
    },

    async loadGenreCatalog(genreId, genreName) {
        this.browseState.type = 'genre';
        this.browseState.genreId = genreId;
        this.browseState.providerId = null;
        this.browseState.title = `Genre : ${genreName}`;
        this.browseState.page = 1;

        document.getElementById('browseTitle').textContent = `Films & Séries — ${genreName}`;
        document.getElementById('browseSubtitle').textContent = `Explorez les meilleurs titres du genre ${genreName}`;
        document.getElementById('browseGrid').innerHTML = Array(12).fill('<div class="skeleton-card"></div>').join('');

        await this.fetchCatalog(true);
    },

    async loadProviderCatalog(providerId, providerName) {
        this.browseState.type = 'provider';
        this.browseState.providerId = providerId;
        this.browseState.genreId = null;
        this.browseState.title = `Catalogue ${providerName}`;
        this.browseState.page = 1;

        document.getElementById('browseTitle').textContent = `Disponibles sur ${providerName}`;
        document.getElementById('browseSubtitle').textContent = `Titres répertoriés sur la plateforme ${providerName}`;
        document.getElementById('browseGrid').innerHTML = Array(12).fill('<div class="skeleton-card"></div>').join('');

        await this.fetchCatalog(true);
    },

    async fetchCatalog(reset = false) {
        if (this.browseState.isLoading) return;
        this.browseState.isLoading = true;

        const loadMoreBtn = document.getElementById('loadMoreBtn');
        const spinner = loadMoreBtn ? loadMoreBtn.querySelector('.loading-icon') : null;
        if (spinner) spinner.style.display = 'inline-block';

        const { type, genreId, providerId, page, sortBy } = this.browseState;
        let fetchPromise;

        if (type === 'movie') {
            fetchPromise = Nafy.Api.getPopularMovies(page, sortBy);
        } else if (type === 'tv') {
            fetchPromise = Nafy.Api.getPopularTv(page, sortBy);
        } else if (type === 'trending') {
            fetchPromise = Nafy.Api.getTrending('all', 'week');
        } else if (type === 'genre') {
            fetchPromise = Nafy.Api.getByGenre(genreId, 'movie', page, sortBy);
        } else if (type === 'provider') {
            fetchPromise = Nafy.Api.getByProvider(providerId, 'movie', page);
        }

        try {
            const data = await fetchPromise;
            this.browseState.totalPages = data.total_pages || 1;
            const grid = document.getElementById('browseGrid');

            if (reset) grid.innerHTML = '';

            if (data.results && data.results.length > 0) {
                data.results.forEach(item => {
                    const mediaType = this.browseState.type === 'tv' ? 'tv' : (item.media_type || 'movie');
                    if (mediaType === 'person') return;
                    const card = Nafy.UI.createMediaCard(item, mediaType);
                    grid.appendChild(card);
                });

                if (loadMoreBtn) {
                    loadMoreBtn.style.display = this.browseState.page < this.browseState.totalPages ? 'inline-flex' : 'none';
                }
            } else if (reset) {
                grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">Aucun contenu trouvé dans cette catégorie.</p>';
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            }
        } catch (e) {
            console.error("Erreur catalogue :", e);
        } finally {
            this.browseState.isLoading = false;
            if (spinner) spinner.style.display = 'none';
        }
    },

    loadMoreBrowse() {
        if (this.browseState.page < this.browseState.totalPages) {
            this.browseState.page += 1;
            this.fetchCatalog(false);
        }
    },

    onSortChange(newSort) {
        this.browseState.sortBy = newSort;
        this.browseState.page = 1;
        this.fetchCatalog(true);
    },

    // ================= RECHERCHE EN TEMPS RÉEL =================
    onSearchInput(val) {
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) clearBtn.style.display = val.length > 0 ? 'block' : 'none';

        clearTimeout(this.searchState.debounceTimer);
        if (!val || val.trim().length === 0) return;

        this.searchState.debounceTimer = setTimeout(() => {
            Nafy.Router.navigate(`search/${encodeURIComponent(val.trim())}`);
        }, 320);
    },

    onSearchSubmit(val) {
        if (!val || val.trim().length === 0) return;
        Nafy.Router.navigate(`search/${encodeURIComponent(val.trim())}`);
    },

    async search(query) {
        this.searchState.query = query;
        document.getElementById('searchQueryLabel').textContent = `"${query}"`;
        const countLabel = document.getElementById('searchResultsCount');
        const grid = document.getElementById('searchResultsGrid');

        countLabel.textContent = 'Recherche en cours...';
        grid.innerHTML = Array(8).fill('<div class="skeleton-card"></div>').join('');

        try {
            const data = await Nafy.Api.searchMulti(query, 1);
            this.searchState.results = (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
            this.renderSearchResults();
        } catch (err) {
            grid.innerHTML = '<p style="color: #e50914; grid-column: 1/-1; text-align: center;">Erreur lors de la recherche.</p>';
        }
    },

    filterSearchResults(filterType) {
        this.searchState.filter = filterType;
        document.querySelectorAll('.filter-tab').forEach(t => {
            if (t.dataset.filter === filterType) t.classList.add('active');
            else t.classList.remove('active');
        });
        this.renderSearchResults();
    },

    renderSearchResults() {
        const grid = document.getElementById('searchResultsGrid');
        const countLabel = document.getElementById('searchResultsCount');
        let filtered = this.searchState.results;

        if (this.searchState.filter !== 'all') {
            filtered = filtered.filter(item => item.media_type === this.searchState.filter);
        }

        countLabel.textContent = `${filtered.length} résultat(s) disponible(s)`;
        grid.innerHTML = '';

        if (filtered.length > 0) {
            filtered.forEach(item => {
                const card = Nafy.UI.createMediaCard(item, item.media_type);
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
    },

    // ================= VUE MA LISTE =================
    renderWatchlist() {
        const grid = document.getElementById('watchlistGrid');
        const empty = document.getElementById('emptyWatchlist');
        const clearBtn = document.getElementById('clearWatchlistBtn');
        const list = Nafy.Storage.getWatchlist();

        grid.innerHTML = '';
        if (list.length > 0) {
            empty.style.display = 'none';
            clearBtn.style.display = 'inline-flex';
            list.forEach(item => {
                const card = Nafy.UI.createMediaCard(item, item.media_type || 'movie');
                grid.appendChild(card);
            });
        } else {
            empty.style.display = 'block';
            clearBtn.style.display = 'none';
        }
    },

    clearWatchlist() {
        if (confirm("Voulez-vous vraiment effacer tous vos favoris ?")) {
            Nafy.Storage.saveWatchlist([]);
            this.renderWatchlist();
            Nafy.UI.showToast('Votre liste a été vidée', 'fa-trash-can');
        }
    }
};

// Démarrage automatique
document.addEventListener('DOMContentLoaded', () => {
    Nafy.App.init();
});
