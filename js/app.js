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
        year: null,
        minRating: null,
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
        // Enregistrement du Service Worker PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js').catch(() => {});
            });
        }

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
            searchInput.addEventListener('focus', () => Nafy.UI.renderRecentSearches());
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') this.onSearchSubmit(searchInput.value);
            });
        }

        if (mobileSearchInput) {
            mobileSearchInput.addEventListener('input', (e) => this.onSearchInput(e.target.value));
            mobileSearchInput.addEventListener('focus', () => Nafy.UI.renderRecentSearches());
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

        // Fermeture des modales avec Échap
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                Nafy.UI.closeInfoModal();
                Nafy.UI.closeSettingsModal();
                if (Nafy.Player && Nafy.Player.isCinemaMode) {
                    Nafy.Player.toggleCinemaMode(false);
                }
            }
        });
    },

    toggleMobileSearch() {
        const drawer = document.getElementById('mobileSearchDrawer');
        if (!drawer) return;
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open')) {
            const input = document.getElementById('mobileSearchInput');
            if (input) input.focus();
            Nafy.UI.renderRecentSearches();
        }
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

    // ================= CATALOGUE & FILTRES AVANCÉS =================
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

        const { type, genreId, providerId, page, sortBy, year, minRating } = this.browseState;
        let fetchPromise;

        if (type === 'movie') {
            fetchPromise = Nafy.Api.getPopularMovies(page, sortBy, year, minRating);
        } else if (type === 'tv') {
            fetchPromise = Nafy.Api.getPopularTv(page, sortBy, year, minRating);
        } else if (type === 'trending') {
            fetchPromise = Nafy.Api.getTrending('all', 'week');
        } else if (type === 'genre') {
            fetchPromise = Nafy.Api.getByGenre(genreId, 'movie', page, sortBy, year, minRating);
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
                grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 40px;">Aucun contenu trouvé avec ces critères de filtre.</p>';
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

    onYearFilterChange(yearVal) {
        this.browseState.year = yearVal || null;
        this.browseState.page = 1;
        this.fetchCatalog(true);
    },

    onRatingFilterChange(ratingVal) {
        this.browseState.minRating = ratingVal ? parseFloat(ratingVal) : null;
        this.browseState.page = 1;
        this.fetchCatalog(true);
    },

    // ================= SAGAS & FRANCHISES =================
    renderSagas() {
        const grid = document.getElementById('sagasGrid');
        if (!grid) return;

        // Met en avant une grande saga en haut de page
        this.renderSagasSpotlight();

        grid.innerHTML = '';
        Nafy.Config.SAGAS.forEach(saga => {
            const card = Nafy.UI.createSagaCard(saga);
            grid.appendChild(card);
        });

        const allBtn = document.querySelector('.saga-pill-btn[data-cat="all"]');
        if (allBtn) allBtn.innerHTML = `Toutes <span class="pill-count">${Nafy.Config.SAGAS.length}</span>`;

        this.filterSagas();
    },

    renderSagasSpotlight() {
        const container = document.getElementById('sagasSpotlight');
        if (!container) return;

        // Franchise vedette mise en avant
        const featured = Nafy.Config.SAGAS.find(s => s.id === 10) || Nafy.Config.SAGAS[0];
        if (!featured) return;

        container.innerHTML = `
            <div class="sagas-spotlight-card" style="background-image: url('${featured.backdrop}');">
                <div class="sagas-spotlight-overlay"></div>
                <div class="sagas-spotlight-content">
                    <span class="sagas-spotlight-badge">Collection à la une</span>
                    <h2 class="sagas-spotlight-title">${featured.name}</h2>
                    <p class="sagas-spotlight-desc">L'intégrale des 9 épisodes de la saga Skywalker dans l'ordre chronologique officiel.</p>
                    <div class="sagas-spotlight-actions">
                        <button class="btn btn-hero-primary" onclick="Nafy.Router.navigate('collection/${featured.id}')">
                            <i class="fa-solid fa-play"></i> Découvrir l'intégrale
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    setSagaCategory(category) {
        document.querySelectorAll('.saga-pill-btn').forEach(btn => {
            if (btn.dataset.cat === category) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        this.filterSagas();
    },

    filterSagas() {
        const input = document.getElementById('sagasSearchInput');
        const query = (input ? input.value : '').toLowerCase().trim();
        const activeBtn = document.querySelector('.saga-pill-btn.active');
        const activeCat = activeBtn ? activeBtn.dataset.cat : 'all';

        const cards = document.querySelectorAll('#sagasGrid .saga-card');
        let visibleCount = 0;
        cards.forEach(card => {
            const matchesCat = (activeCat === 'all' || card.dataset.category === activeCat);
            const matchesQuery = (!query || card.dataset.name.includes(query));
            const show = matchesCat && matchesQuery;
            card.style.display = show ? 'block' : 'none';
            if (show) visibleCount++;
        });

        const emptyMsg = document.getElementById('sagasEmptyMsg');
        if (emptyMsg) {
            emptyMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }
    },

    async loadCollection(collectionId) {
        const titleEl = document.getElementById('collectionTitle');
        const descEl = document.getElementById('collectionDesc');
        const bannerEl = document.getElementById('collectionBanner');
        const countBadge = document.getElementById('collectionCountBadge');
        const yearsBadge = document.getElementById('collectionYearsBadge');
        const startBtn = document.getElementById('collectionStartBtn');
        const grid = document.getElementById('collectionGrid');

        titleEl.textContent = 'Chargement de la franchise...';
        descEl.textContent = '';
        if (startBtn) startBtn.style.display = 'none';
        grid.innerHTML = Array(6).fill('<div class="skeleton-card"></div>').join('');

        try {
            const data = await Nafy.Api.getCollection(collectionId);
            titleEl.textContent = data.name;
            descEl.textContent = data.overview || "Retrouvez tous les volets officiels de la franchise dans l'ordre chronologique de sortie en salles.";
            
            if (data.backdrop_path && bannerEl) {
                bannerEl.style.backgroundImage = `url('${Nafy.Config.TMDB_BACKDROP_BASE}${data.backdrop_path}')`;
            } else if (data.poster_path && bannerEl) {
                bannerEl.style.backgroundImage = `url('${Nafy.Config.TMDB_IMAGE_BASE}${data.poster_path}')`;
            }

            grid.innerHTML = '';
            if (data.parts && data.parts.length > 0) {
                // Tri chronologique par date de sortie
                const sorted = data.parts.sort((a, b) => {
                    const dateA = a.release_date || '9999';
                    const dateB = b.release_date || '9999';
                    return dateA.localeCompare(dateB);
                });

                if (countBadge) {
                    countBadge.innerHTML = `<i class="fa-solid fa-film"></i> ${sorted.length} film${sorted.length > 1 ? 's' : ''}`;
                }

                const years = sorted
                    .map(p => (p.release_date || '').substring(0, 4))
                    .filter(y => y.length === 4);
                if (years.length > 0 && yearsBadge) {
                    const minYear = years[0];
                    const maxYear = years[years.length - 1];
                    yearsBadge.textContent = minYear === maxYear ? minYear : `${minYear} – ${maxYear}`;
                }

                // Bouton pour lancer immédiatement le 1er volet
                if (startBtn && sorted[0]) {
                    startBtn.style.display = 'inline-flex';
                    startBtn.innerHTML = `<i class="fa-solid fa-play"></i> Lancer le 1er volet (${(sorted[0].release_date || '').substring(0, 4)})`;
                    startBtn.onclick = () => {
                        Nafy.Router.navigate(`watch/movie/${sorted[0].id}`);
                    };
                }

                sorted.forEach((item, idx) => {
                    const card = Nafy.UI.createMediaCard(item, 'movie');
                    // Badge chronologique (#1, #2...)
                    const year = (item.release_date || '').substring(0, 4);
                    const pill = document.createElement('div');
                    pill.className = 'collection-step-pill';
                    pill.innerHTML = `<span>#${idx + 1}</span> ${year ? `• ${year}` : ''}`;
                    const thumb = card.querySelector('.media-poster-wrapper') || card.querySelector('.media-card-poster') || card;
                    thumb.appendChild(pill);
                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = '<p class="text-muted">Aucun film répertorié dans cette collection.</p>';
            }
        } catch (e) {
            console.error("Erreur collection :", e);
            titleEl.textContent = 'Erreur lors du chargement de la collection';
        }
    },

    // ================= FILMOGRAPHIE (ACTEURS / RÉALISATEURS) =================
    async loadPersonFilmography(personId, personName) {
        const titleEl = document.getElementById('personNameTitle');
        const bioEl = document.getElementById('personBioText');
        const photoEl = document.getElementById('personPhotoImg');
        const grid = document.getElementById('personCreditsGrid');

        titleEl.textContent = decodeURIComponent(personName);
        bioEl.textContent = 'Chargement de la biographie...';
        grid.innerHTML = Array(8).fill('<div class="skeleton-card"></div>').join('');

        try {
            const [personData, creditsData] = await Promise.all([
                Nafy.Api.getPersonDetails(personId),
                Nafy.Api.getPersonCredits(personId)
            ]);

            titleEl.textContent = personData.name;
            bioEl.textContent = personData.biography || `Filmographie et œuvres de ${personData.name}.`;
            
            if (photoEl) {
                photoEl.src = personData.profile_path 
                    ? `${Nafy.Config.TMDB_IMAGE_BASE}${personData.profile_path}` 
                    : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60';
            }

            grid.innerHTML = '';
            const allWorks = [...(creditsData.cast || []), ...(creditsData.crew || [])];
            
            // Élimine les doublons et trie par popularité
            const unique = [];
            const seenIds = new Set();
            allWorks.forEach(w => {
                if (!seenIds.has(w.id)) {
                    seenIds.add(w.id);
                    unique.push(w);
                }
            });

            unique.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

            if (unique.length > 0) {
                unique.slice(0, 30).forEach(item => {
                    const mediaType = item.media_type || (item.name ? 'tv' : 'movie');
                    const card = Nafy.UI.createMediaCard(item, mediaType);
                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = '<p class="text-muted">Aucune œuvre trouvée.</p>';
            }
        } catch (e) {
            console.error("Erreur filmographie :", e);
        }
    },

    // ================= MES TITRES NOTÉS =================
    renderRatings() {
        const grid = document.getElementById('ratingsGrid');
        const empty = document.getElementById('emptyRatings');
        const ratings = Nafy.Storage.getRatings();
        const list = Object.values(ratings);

        if (!grid) return;
        grid.innerHTML = '';

        if (list.length > 0) {
            if (empty) empty.style.display = 'none';
            list.forEach(item => {
                const card = Nafy.UI.createMediaCard(item, item.media_type || 'movie');
                grid.appendChild(card);
            });
        } else {
            if (empty) empty.style.display = 'block';
        }
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
        Nafy.Storage.addRecentSearch(val.trim());
        Nafy.Router.navigate(`search/${encodeURIComponent(val.trim())}`);
    },

    async search(query) {
        this.searchState.query = query;
        document.getElementById('searchQueryLabel').textContent = `"${query}"`;
        const countLabel = document.getElementById('searchResultsCount');
        const grid = document.getElementById('searchResultsGrid');

        Nafy.Storage.addRecentSearch(query);
        Nafy.UI.renderRecentSearches();

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
