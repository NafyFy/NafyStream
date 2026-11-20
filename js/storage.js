/**
 * NAFY STREAM — GESTIONNAIRE DE STOCKAGE PERSISTANT (LOCALSTORAGE)
 */

window.Nafy = window.Nafy || {};

Nafy.Storage = {
    KEYS: {
        WATCHLIST: 'nafy_watchlist',
        HISTORY: 'nafy_history',
        RATINGS: 'nafy_ratings',
        SETTINGS: 'nafy_settings'
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
        if (badge) {
            const count = this.getWatchlist().length;
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline-block' : 'none';
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
        // Conserve les 20 derniers titres
        if (history.length > 20) history.pop();

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
