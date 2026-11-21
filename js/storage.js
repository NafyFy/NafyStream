/**
 * NAFY STREAM — GESTIONNAIRE DE STOCKAGE PERSISTANT (LOCALSTORAGE)
 */

window.Nafy = window.Nafy || {};

Nafy.Storage = {
    KEYS: {
        WATCHLIST: 'nafy_watchlist',
        HISTORY: 'nafy_history',
        RATINGS: 'nafy_ratings',
        SETTINGS: 'nafy_settings',
        RECENT_SEARCHES: 'nafy_recent_searches'
    },

    // ================= WATCHLIST =================
    getWatchlist() {
        try {
            const data = localStorage.getItem(this.KEYS.WATCHLIST);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    saveWatchlist(list) {
        try {
            localStorage.setItem(this.KEYS.WATCHLIST, JSON.stringify(list));
            this.notifyWatchlistChange();
        } catch (e) {
            console.error("Erreur sauvegarde watchlist :", e);
        }
    },

    isInWatchlist(id) {
        const list = this.getWatchlist();
        return list.some(item => item.id === id);
    },

    toggleWatchlist(item, mediaType = 'movie') {
        const list = this.getWatchlist();
        const index = list.findIndex(m => m.id === item.id);
        let added = false;

        if (index > -1) {
            list.splice(index, 1);
        } else {
            list.unshift({
                id: item.id,
                title: item.title || item.name,
                poster_path: item.poster_path,
                backdrop_path: item.backdrop_path,
                vote_average: item.vote_average,
                release_date: item.release_date || item.first_air_date,
                media_type: mediaType,
                addedAt: Date.now()
            });
            added = true;
        }

        this.saveWatchlist(list);
        return added;
    },

    notifyWatchlistChange() {
        const badge = document.getElementById('watchlist-badge');
        const mobileBadge = document.getElementById('mobileWatchlistBadge');
        const count = this.getWatchlist().length;

        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
        }
        if (mobileBadge) {
            mobileBadge.textContent = count;
            mobileBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    },

    // ================= HISTORIQUE & CONTINUER LA LECTURE =================
    getHistory() {
        try {
            const data = localStorage.getItem(this.KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    addToHistory(mediaData, season = 1, episode = 1) {
        if (!mediaData || !mediaData.id) return;
        const history = this.getHistory();
        const existingIndex = history.findIndex(h => h.id === mediaData.id);

        const entry = {
            id: mediaData.id,
            title: mediaData.title || mediaData.name,
            poster_path: mediaData.poster_path,
            backdrop_path: mediaData.backdrop_path,
            media_type: mediaData.media_type || (mediaData.name ? 'tv' : 'movie'),
            season: season,
            episode: episode,
            watchedAt: Date.now()
        };

        if (existingIndex > -1) {
            history.splice(existingIndex, 1);
        }

        history.unshift(entry);
        if (history.length > 25) history.pop();

        try {
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
        } catch (e) {}
    },

    removeFromHistory(id) {
        let history = this.getHistory();
        history = history.filter(h => h.id !== id);
        try {
            localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
        } catch (e) {}
    },

    clearHistory() {
        localStorage.removeItem(this.KEYS.HISTORY);
    },

    // ================= RECHERCHES RÉCENTES =================
    getRecentSearches() {
        try {
            const data = localStorage.getItem(this.KEYS.RECENT_SEARCHES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    },

    addRecentSearch(query) {
        if (!query || query.trim().length === 0) return;
        const q = query.trim();
        let list = this.getRecentSearches().filter(item => item.toLowerCase() !== q.toLowerCase());
        list.unshift(q);
        if (list.length > 8) list.pop();
        try {
            localStorage.setItem(this.KEYS.RECENT_SEARCHES, JSON.stringify(list));
        } catch (e) {}
    },

    clearRecentSearches() {
        localStorage.removeItem(this.KEYS.RECENT_SEARCHES);
    },

    // ================= NOTATIONS PERSONNELLES (1-5 ÉTOILES) =================
    getRatings() {
        try {
            const data = localStorage.getItem(this.KEYS.RATINGS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    getRating(id) {
        const ratings = this.getRatings();
        return ratings[id] ? ratings[id].rating : 0;
    },

    setRating(id, ratingNumber, mediaData = {}) {
        const ratings = this.getRatings();
        if (ratingNumber <= 0) {
            delete ratings[id];
        } else {
            ratings[id] = {
                id,
                rating: ratingNumber,
                title: mediaData.title || mediaData.name || 'Titre',
                poster_path: mediaData.poster_path || '',
                media_type: mediaData.media_type || 'movie',
                ratedAt: Date.now()
            };
        }
        try {
            localStorage.setItem(this.KEYS.RATINGS, JSON.stringify(ratings));
        } catch (e) {}
    },

    // ================= STATISTIQUES DE VISIONNAGE =================
    getStats() {
        const history = this.getHistory();
        const watchlist = this.getWatchlist();
        const ratings = this.getRatings();

        let moviesCount = 0;
        let episodesCount = 0;

        history.forEach(item => {
            if (item.media_type === 'tv') {
                episodesCount += (item.episode || 1);
            } else {
                moviesCount += 1;
            }
        });

        // Estimation du temps : 110 min par film, 45 min par épisode
        const totalMinutes = (moviesCount * 110) + (episodesCount * 45);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return {
            moviesCount,
            episodesCount,
            totalHoursFormatted: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
            watchlistCount: watchlist.length,
            ratingsCount: Object.keys(ratings).length
        };
    },

    // ================= PARAMÈTRES & THÈMES =================
    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : {
                theme: 'red',
                server: 'moviez',
                autoplayNext: true
            };
        } catch (e) {
            return { theme: 'red', server: 'moviez', autoplayNext: true };
        }
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
        } catch (e) {}
    },

    // ================= EXPORT & IMPORT DES DONNÉES =================
    exportData() {
        const data = {
            version: Nafy.Config.VERSION,
            exportedAt: new Date().toISOString(),
            watchlist: this.getWatchlist(),
            history: this.getHistory(),
            ratings: this.getRatings(),
            recentSearches: this.getRecentSearches(),
            settings: this.getSettings()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nafy_stream_backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (Array.isArray(parsed.watchlist)) {
                localStorage.setItem(this.KEYS.WATCHLIST, JSON.stringify(parsed.watchlist));
            }
            if (Array.isArray(parsed.history)) {
                localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(parsed.history));
            }
            if (parsed.ratings && typeof parsed.ratings === 'object') {
                localStorage.setItem(this.KEYS.RATINGS, JSON.stringify(parsed.ratings));
            }
            if (Array.isArray(parsed.recentSearches)) {
                localStorage.setItem(this.KEYS.RECENT_SEARCHES, JSON.stringify(parsed.recentSearches));
            }
            if (parsed.settings) {
                localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(parsed.settings));
            }
            this.notifyWatchlistChange();
            return true;
        } catch (e) {
            console.error("Échec import données :", e);
            return false;
        }
    }
};
