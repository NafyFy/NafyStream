/**
 * NAFY STREAM — ROUTEUR SPA CLIENT (HASH ROUTER AVANCÉ)
 */

window.Nafy = window.Nafy || {};

Nafy.Router = {
    currentRoute: '',
    previousRoute: 'home',

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    navigate(hash, replace = false) {
        const cleanHash = hash.startsWith('#') ? hash : `#${hash}`;
        if (replace) {
            history.replaceState(null, '', cleanHash);
            this.handleRoute();
        } else {
            window.location.hash = cleanHash;
        }
    },

    handleRoute() {
        const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
        
        if (!rawHash || rawHash === 'home') {
            this.setSection('home');
            Nafy.App.renderHome();
            return;
        }

        const parts = rawHash.split('/');
        const route = parts[0];

        if (route === 'watch') {
            const mediaType = parts[1] || 'movie';
            const id = parts[2];
            const season = parseInt(parts[3] || '1', 10);
            const episode = parseInt(parts[4] || '1', 10);
            if (id) {
                this.setSection('player');
                Nafy.Player.play(id, mediaType, season, episode, false);
                return;
            }
        } else if (route === 'genre') {
            const genreId = parseInt(parts[1], 10);
            const genreName = decodeURIComponent(parts[2] || '');
            if (!isNaN(genreId)) {
                this.setSection('browse');
                Nafy.App.loadGenreCatalog(genreId, genreName);
                return;
            }
        } else if (route === 'provider') {
            const providerId = parseInt(parts[1], 10);
            const providerName = decodeURIComponent(parts[2] || '');
            if (!isNaN(providerId)) {
                this.setSection('browse');
                Nafy.App.loadProviderCatalog(providerId, providerName);
                return;
            }
        } else if (route === 'search') {
            const query = decodeURIComponent(parts.slice(1).join('/') || '');
            if (query) {
                this.setSection('search');
                Nafy.App.search(query, false);
                return;
            }
        } else if (route === 'movies') {
            this.setSection('browse');
            Nafy.App.loadCatalog('movie', 'Films');
            return;
        } else if (route === 'series') {
            this.setSection('browse');
            Nafy.App.loadCatalog('tv', 'Séries TV');
            return;
        } else if (route === 'trending') {
            this.setSection('browse');
            Nafy.App.loadCatalog('trending', 'Tendances');
            return;
        } else if (route === 'watchlist') {
            this.setSection('watchlist');
            Nafy.App.renderWatchlist();
            return;
        }

        // Par défaut : Accueil
        this.setSection('home');
        Nafy.App.renderHome();
    },

    setSection(sectionId) {
        if (this.currentRoute !== sectionId && this.currentRoute !== 'player') {
            this.previousRoute = this.currentRoute;
        }
        this.currentRoute = sectionId;

        // Masque toutes les sections
        document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');

        // Met à jour la classe active sur les liens nav
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.target === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Affiche la section cible
        const targetEl = document.getElementById(`${sectionId}-section`);
        if (targetEl) targetEl.style.display = 'block';
    }
};
