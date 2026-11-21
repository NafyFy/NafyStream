/**
 * NAFY STREAM — LECTEUR VIDÉO AVANCÉ, CONTRÔLES SÉRIES, RACCOURCIS & MULTI-SERVEURS
 */

window.Nafy = window.Nafy || {};

Nafy.Player = {
    currentId: null,
    currentMediaType: 'movie',
    currentSeason: 1,
    currentEpisode: 1,
    totalEpisodesInSeason: 1,
    currentServer: 'frembed',
    preferredAudio: 'vf',
    currentDetails: null,
    isCinemaMode: false,
    shortcutsBound: false,

    init() {
        const settings = Nafy.Storage.getSettings();
        if (settings && settings.server) {
            this.currentServer = settings.server;
        }
        this.preferredAudio = Nafy.Storage.getPreferredAudio();
        this.setupKeyboardShortcuts();
    },

    isAnime(data) {
        if (!data) return false;
        const isJap = data.original_language === 'ja' || (data.origin_country && data.origin_country.includes('JP'));
        const isAnimGenre = data.genres && data.genres.some(g => g.id === 16 || (g.name && g.name.toLowerCase().includes('anim')));
        const hasAnimeKeyword = data.keywords && (
            (data.keywords.results && data.keywords.results.some(k => (k.name || '').toLowerCase().includes('anime'))) ||
            (data.keywords.keywords && data.keywords.keywords.some(k => (k.name || '').toLowerCase().includes('anime')))
        );
        return (isJap && isAnimGenre) || !!hasAnimeKeyword;
    },

    getRecommendedServer(data, mediaType, preferredAudio = 'vf') {
        const isAnime = this.isAnime(data);

        if (isAnime) {
            if (preferredAudio === 'vf') {
                return {
                    serverId: 'moviez',
                    title: 'Serveur 1 (Moviez)',
                    reason: 'Le plus fluide et réactif pour les Animés en VF avec doublage français intégral.',
                    badge: '⭐ Recommandé Anime VF'
                };
            } else {
                return {
                    serverId: 'frembed',
                    title: 'Serveur 2 (Frembed)',
                    reason: 'Le plus stable pour les Animés en VOSTFR avec voix japonaises et sous-titres FR synchronisés.',
                    badge: '⭐ Recommandé Anime VOSTFR'
                };
            }
        }

        if (mediaType === 'tv') {
            if (preferredAudio === 'vf') {
                return {
                    serverId: 'frembed',
                    title: 'Serveur 2 (Frembed)',
                    reason: 'Le meilleur pour les Séries en VF : pistes françaises natives et chargement sans latence.',
                    badge: '⭐ Recommandé Séries VF'
                };
            } else {
                return {
                    serverId: 'vidlink',
                    title: 'Serveur 3 (VidLink HD)',
                    reason: 'Le meilleur pour les Séries en VOSTFR : qualité 1080p, enchaînement direct d\'épisodes et sous-titres FR.',
                    badge: '⭐ Recommandé Séries 1080p'
                };
            }
        }

        // Pour les films
        if (preferredAudio === 'vf') {
            return {
                serverId: 'frembed',
                title: 'Serveur 2 (Frembed)',
                reason: 'Recommandé pour les Films en VF : grande stabilité, audio doublé en français et flux HD.',
                badge: '⭐ Recommandé Film VF'
            };
        } else {
            return {
                serverId: 'vidlink',
                title: 'Serveur 3 (VidLink HD)',
                reason: 'Recommandé pour les Films en VOSTFR : débit 1080p élevé et sous-titres français intégrés.',
                badge: '⭐ Recommandé Film VOSTFR'
            };
        }
    },

    setPreferredAudio(lang) {
        this.preferredAudio = lang;
        Nafy.Storage.setPreferredAudio(lang);

        document.querySelectorAll('.audio-tab-btn').forEach(btn => {
            if (btn.dataset.audio === lang) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Met à jour la recommandation selon la nouvelle langue
        const rec = this.getRecommendedServer(this.currentDetails, this.currentMediaType, this.preferredAudio);
        this.renderRecommendationBanner(rec);
        this.renderServerButtons(rec.serverId);

        // Bascule automatiquement sur le meilleur serveur recommandé pour cette langue
        this.setServer(rec.serverId);
        Nafy.UI.showToast(`Langue basculée sur : ${lang.toUpperCase()}`, 'fa-headphones');
    },

    renderRecommendationBanner(rec) {
        const box = document.getElementById('playerRecommendationBox');
        if (!box) return;

        const isAnime = this.isAnime(this.currentDetails);
        const typeLabel = isAnime ? 'animé' : (this.currentMediaType === 'tv' ? 'série' : 'film');
        const audioLabel = this.preferredAudio === 'vf' ? 'VF' : 'VOSTFR';

        box.innerHTML = `
            <div class="player-audio-hint">
                <span class="hint-dot"></span>
                <span class="hint-text">Source recommandée pour ce ${typeLabel} (${audioLabel}) : <strong>${rec.title}</strong> — ${rec.reason}</span>
            </div>
        `;
        box.style.display = 'block';
    },

    renderServerButtons(recommendedServerId) {
        const container = document.getElementById('serverButtonsContainer');
        if (!container) return;
        container.innerHTML = '';

        Object.keys(Nafy.Config.SERVERS).forEach(key => {
            const srv = Nafy.Config.SERVERS[key];
            const isRec = key === recommendedServerId;
            const btn = document.createElement('button');
            btn.id = `btn-${srv.id}`;
            btn.className = `server-btn ${this.currentServer === srv.id ? 'active' : ''} ${isRec ? 'is-recommended' : ''}`;
            
            btn.innerHTML = `
                <span class="server-btn-name">${srv.name}</span>
                ${isRec ? '<span class="server-pill-rec">Recommandé</span>' : ''}
            `;

            btn.onclick = () => {
                this.setServer(srv.id);
            };

            container.appendChild(btn);
        });
    },

    setupKeyboardShortcuts() {
        if (this.shortcutsBound) return;
        this.shortcutsBound = true;

        document.addEventListener('keydown', (e) => {
            // Ignore si l'utilisateur est en train de taper dans un champ de recherche ou un input
            if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

            // Raccourcis uniquement actifs quand la vue lecteur est affichée
            if (Nafy.Router.currentRoute === 'player') {
                const key = e.key.toLowerCase();

                if (key === 'l') {
                    e.preventDefault();
                    this.toggleCinemaMode();
                } else if (key === 'f') {
                    e.preventDefault();
                    this.toggleFullscreen();
                } else if (key === 'n') {
                    e.preventDefault();
                    this.nextEpisode();
                } else if (key === 'p') {
                    e.preventDefault();
                    this.prevEpisode();
                } else if (key === 's') {
                    e.preventDefault();
                    this.cycleServer();
                }
            }
        });
    },

    toggleCinemaMode(forceState = null) {
        this.isCinemaMode = forceState !== null ? forceState : !this.isCinemaMode;
        const body = document.body;
        const btn = document.getElementById('cinemaModeBtn');

        if (this.isCinemaMode) {
            body.classList.add('cinema-lights-off');
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Allumer les lumières';
            }
            Nafy.UI.showToast('Mode Cinéma activé (L pour quitter)', 'fa-moon');
        } else {
            body.classList.remove('cinema-lights-off');
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="fa-regular fa-lightbulb"></i> Mode Cinéma';
            }
        }
    },

    toggleFullscreen() {
        const screenEl = document.querySelector('.screen-container');
        if (!screenEl) return;

        if (!document.fullscreenElement) {
            if (screenEl.requestFullscreen) screenEl.requestFullscreen();
            else if (screenEl.webkitRequestFullscreen) screenEl.webkitRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    },

    cycleServer() {
        const servers = Object.keys(Nafy.Config.SERVERS);
        const currentIndex = servers.indexOf(this.currentServer);
        const nextIndex = (currentIndex + 1) % servers.length;
        const nextServer = servers[nextIndex];
        this.setServer(nextServer);
        Nafy.UI.showToast(`Bascule vers ${Nafy.Config.SERVERS[nextServer].name}`, 'fa-server');
    },

    async play(id, mediaType = 'movie', season = 1, episode = 1, updateHash = true) {
        this.currentId = id;
        this.currentMediaType = mediaType;
        this.currentSeason = parseInt(season, 10) || 1;
        this.currentEpisode = parseInt(episode, 10) || 1;

        if (updateHash) {
            this.syncUrlHash();
        }

        const tvControls = document.getElementById('tv-controls-panel');
        if (tvControls) {
            tvControls.style.display = mediaType === 'tv' ? 'block' : 'none';
        }

        try {
            const data = await Nafy.Api.getDetails(id, mediaType);
            this.currentDetails = data;

            // Ajoute automatiquement à l'historique
            Nafy.Storage.addToHistory(data, this.currentSeason, this.currentEpisode);

            // Mise à jour de l'entête du lecteur
            const title = data.title || data.name;
            const year = (data.release_date || data.first_air_date || '2026').substring(0, 4);
            
            document.getElementById('playerMediaTitle').textContent = title;
            document.getElementById('playerMediaYear').textContent = year;
            document.getElementById('playerMediaBadge').textContent = mediaType === 'tv' ? 'SÉRIE' : 'FILM';
            
            const posterEl = document.getElementById('playerPosterImg');
            if (posterEl) {
                posterEl.src = data.poster_path 
                    ? `${Nafy.Config.TMDB_IMAGE_BASE}${data.poster_path}`
                    : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=60';
            }

            document.getElementById('playerDetailRating').innerHTML = `<i class="fa-solid fa-star"></i> ${data.vote_average ? data.vote_average.toFixed(1) : '8.0'}`;
            document.getElementById('playerDetailRuntime').textContent = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : (data.number_of_seasons ? `${data.number_of_seasons} Saison(s)` : 'HD');
            document.getElementById('playerDetailRelease').textContent = year;
            document.getElementById('playerDetailOverview').textContent = data.overview || 'Bon visionnage sur Nafy Stream !';

            // Genres
            const genresContainer = document.getElementById('playerDetailGenres');
            if (genresContainer) {
                genresContainer.innerHTML = '';
                if (data.genres) {
                    data.genres.forEach(g => {
                        const span = document.createElement('span');
                        span.className = 'genre-tag-item';
                        span.textContent = g.name;
                        genresContainer.appendChild(span);
                    });
                }
            }

            // Système d'étoiles personnelles sous le lecteur
            Nafy.UI.renderStarRating('playerStarRatingBox', id, data);

            // Bouton bookmark
            const bookmarkBtn = document.getElementById('playerBookmarkBtn');
            if (bookmarkBtn) {
                Nafy.UI.updateBookmarkButton(bookmarkBtn, id);
                bookmarkBtn.onclick = () => {
                    Nafy.Storage.toggleWatchlist(data, mediaType);
                    Nafy.UI.updateBookmarkButton(bookmarkBtn, id);
                };
            }

            // Séries : initialisation des saisons
            if (mediaType === 'tv') {
                this.setupSeasonDropdown(data.seasons || []);
            }

            // Détection du type spécifique (Animé, Série, Film)
            const isAnime = this.isAnime(data);
            const badgeEl = document.getElementById('playerMediaBadge');
            if (badgeEl) {
                badgeEl.textContent = isAnime ? 'ANIMÉ' : (mediaType === 'tv' ? 'SÉRIE' : 'FILM');
                if (isAnime) badgeEl.classList.add('badge-anime');
                else badgeEl.classList.remove('badge-anime');
            }

            // Calcul du meilleur serveur recommandé pour cette œuvre
            const rec = this.getRecommendedServer(data, mediaType, this.preferredAudio);
            this.renderRecommendationBanner(rec);

            // Mise à jour de l'état des onglets audio (VF / VOSTFR)
            document.querySelectorAll('.audio-tab-btn').forEach(btn => {
                if (btn.dataset.audio === this.preferredAudio) btn.classList.add('active');
                else btn.classList.remove('active');
            });

            // Recommandations similaires
            this.renderSimilar(data.similar ? data.similar.results : []);

            // Sélection et rendu des serveurs (choix prioritaire automatique)
            this.currentServer = rec.serverId;
            this.renderServerButtons(rec.serverId);
            this.setServer(this.currentServer);

        } catch (err) {
            console.error("Erreur chargement lecteur :", err);
            const container = document.getElementById('player-container');
            if (container) {
                container.innerHTML = `<div class="player-loader"><p style="color:#e50914;">Erreur de chargement du flux vidéo.</p></div>`;
            }
        }
    },

    syncUrlHash() {
        const hash = this.currentMediaType === 'tv'
            ? `watch/tv/${this.currentId}/${this.currentSeason}/${this.currentEpisode}`
            : `watch/movie/${this.currentId}`;
        history.replaceState(null, '', `#${hash}`);
    },

    setupSeasonDropdown(seasons) {
        const select = document.getElementById('seasonSelect');
        if (!select) return;
        select.innerHTML = '';

        const validSeasons = seasons.filter(s => s.season_number > 0);
        const list = validSeasons.length > 0 ? validSeasons : seasons;

        list.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.season_number;
            opt.textContent = s.name || `Saison ${s.season_number}`;
            select.appendChild(opt);
        });

        if (this.currentSeason && list.some(s => s.season_number === this.currentSeason)) {
            select.value = this.currentSeason;
        } else {
            this.currentSeason = list.length > 0 ? list[0].season_number : 1;
        }

        this.loadSeasonEpisodes(this.currentSeason);
    },

    async onSeasonChange(seasonNumber) {
        this.currentSeason = parseInt(seasonNumber, 10);
        this.currentEpisode = 1;
        this.syncUrlHash();
        await this.loadSeasonEpisodes(this.currentSeason);
        this.setServer(this.currentServer);
    },

    async loadSeasonEpisodes(seasonNumber) {
        const container = document.getElementById('episodesContainer');
        const countLabel = document.getElementById('episodesCountLabel');
        if (!container) return;

        container.innerHTML = '<span class="text-muted" style="font-size:0.85rem; padding:10px;">Chargement des épisodes...</span>';

        try {
            const data = await Nafy.Api.getSeasonEpisodes(this.currentId, seasonNumber);
            container.innerHTML = '';

            if (data.episodes && data.episodes.length > 0) {
                this.totalEpisodesInSeason = data.episodes.length;
                if (countLabel) countLabel.textContent = `Saison ${seasonNumber} (${data.episodes.length} épisodes) :`;

                data.episodes.forEach(ep => {
                    const chip = document.createElement('button');
                    chip.className = `episode-chip ${ep.episode_number === this.currentEpisode ? 'active' : ''}`;
                    chip.textContent = `Ép. ${ep.episode_number}${ep.name ? ' : ' + ep.name : ''}`;

                    chip.onclick = () => {
                        document.querySelectorAll('.episode-chip').forEach(c => c.classList.remove('active'));
                        chip.classList.add('active');
                        this.currentEpisode = ep.episode_number;
                        this.syncUrlHash();
                        this.setServer(this.currentServer);
                        this.updateQuickNavButtons();
                    };

                    container.appendChild(chip);
                });
            } else {
                this.renderFallbackEpisodes(container, countLabel, seasonNumber);
            }

            this.updateQuickNavButtons();
        } catch (err) {
            this.renderFallbackEpisodes(container, countLabel, seasonNumber);
        }
    },

    renderFallbackEpisodes(container, countLabel, seasonNumber) {
        if (countLabel) countLabel.textContent = `Saison ${seasonNumber} :`;
        container.innerHTML = '';
        this.totalEpisodesInSeason = 24;

        for (let i = 1; i <= 24; i++) {
            const chip = document.createElement('button');
            chip.className = `episode-chip ${i === this.currentEpisode ? 'active' : ''}`;
            chip.textContent = `Épisode ${i}`;
            chip.onclick = () => {
                document.querySelectorAll('.episode-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.currentEpisode = i;
                this.syncUrlHash();
                this.setServer(this.currentServer);
                this.updateQuickNavButtons();
            };
            container.appendChild(chip);
        }
    },

    nextEpisode() {
        if (this.currentEpisode < this.totalEpisodesInSeason) {
            this.currentEpisode += 1;
            this.syncUrlHash();
            this.highlightActiveEpisode();
            this.setServer(this.currentServer);
            this.updateQuickNavButtons();
            Nafy.UI.showToast(`Lecture de l'épisode ${this.currentEpisode}`, 'fa-forward-step');
        }
    },

    prevEpisode() {
        if (this.currentEpisode > 1) {
            this.currentEpisode -= 1;
            this.syncUrlHash();
            this.highlightActiveEpisode();
            this.setServer(this.currentServer);
            this.updateQuickNavButtons();
            Nafy.UI.showToast(`Lecture de l'épisode ${this.currentEpisode}`, 'fa-backward-step');
        }
    },

    highlightActiveEpisode() {
        document.querySelectorAll('.episode-chip').forEach((c, idx) => {
            if (idx + 1 === this.currentEpisode) c.classList.add('active');
            else c.classList.remove('active');
        });
    },

    updateQuickNavButtons() {
        const prevBtn = document.getElementById('prevEpisodeBtn');
        const nextBtn = document.getElementById('nextEpisodeBtn');
        if (prevBtn) prevBtn.disabled = this.currentEpisode <= 1;
        if (nextBtn) nextBtn.disabled = this.currentEpisode >= this.totalEpisodesInSeason;
    },

    setServer(serverName) {
        this.currentServer = serverName;
        const srv = Nafy.Config.SERVERS[serverName];
        if (!srv || !this.currentId) return;

        document.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${serverName}`);
        if (activeBtn) activeBtn.classList.add('active');

        const container = document.getElementById('player-container');
        if (!container) return;

        container.innerHTML = `
            <div class="player-loader">
                <div class="spinner"></div>
                <p>Connexion au ${srv.name} (${this.preferredAudio.toUpperCase()})...</p>
            </div>
        `;

        const imdbId = this.currentDetails && this.currentDetails.external_ids ? this.currentDetails.external_ids.imdb_id : null;
        let url = '';

        if (this.currentMediaType === 'tv') {
            url = srv.getTvUrl(this.currentId, imdbId, this.currentSeason, this.currentEpisode, this.preferredAudio);
        } else {
            url = srv.getMovieUrl(this.currentId, imdbId, this.preferredAudio);
        }

        setTimeout(() => {
            container.innerHTML = `
                <iframe 
                    src="${url}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture" 
                    referrerpolicy="origin" 
                    allowfullscreen>
                </iframe>
            `;
        }, 120);
    },

    renderSimilar(results) {
        const container = document.getElementById('similarCarousel');
        if (!container) return;
        container.innerHTML = '';

        if (results && results.length > 0) {
            results.slice(0, 10).forEach(item => {
                const card = Nafy.UI.createMediaCard(item, this.currentMediaType);
                container.appendChild(card);
            });
        } else {
            container.innerHTML = '<p class="text-muted" style="padding:10px;">Aucune recommandation disponible.</p>';
        }
    }
};
