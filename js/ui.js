/**
 * NAFY STREAM — GESTIONNAIRE DE L'INTERFACE UTILISATEUR & MODALS
 */

window.Nafy = window.Nafy || {};

Nafy.UI = {
    toastTimeout: null,

    // ================= NOTIFICATION TOAST =================
    showToast(message, iconClass = 'fa-circle-check') {
        const toast = document.getElementById('toastNotification');
        const msgEl = document.getElementById('toastMessage');
        const iconEl = document.getElementById('toastIcon');

        if (!toast || !msgEl) return;

        msgEl.textContent = message;
        iconEl.className = `fa-solid ${iconClass}`;

        toast.classList.add('show');
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3200);
    },

    // ================= FABRICATION DES CARTES =================
    createMediaCard(item, mediaType = 'movie') {
        const card = document.createElement('div');
        card.className = 'media-card';
        
        const title = item.title || item.name || 'Titre inconnu';
        const releaseDate = item.release_date || item.first_air_date || '';
        const year = releaseDate ? releaseDate.substring(0, 4) : '—';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '—';
        const isTv = mediaType === 'tv';
        const typeLabel = isTv ? 'SÉRIE' : 'FILM';
        
        const posterUrl = item.poster_path 
            ? `${Nafy.Config.TMDB_IMAGE_BASE}${item.poster_path}`
            : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&auto=format&fit=crop&q=60';

        const isSaved = Nafy.Storage.isInWatchlist(item.id);

        card.innerHTML = `
            <div class="card-poster-wrapper">
                <img src="${posterUrl}" alt="${this.escapeHtml(title)}" loading="lazy">
                <div class="card-badges-top">
                    <span class="card-rating-badge"><i class="fa-solid fa-star"></i> ${rating}</span>
                    <span class="card-type-badge">${typeLabel}</span>
                </div>
                <button class="card-bookmark-btn ${isSaved ? 'saved' : ''}" title="${isSaved ? 'Retirer de Ma Liste' : 'Ajouter à Ma Liste'}" onclick="event.stopPropagation(); Nafy.UI.handleCardBookmark(this, ${item.id})">
                    <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i>
                </button>
                <div class="card-hover-overlay">
                    <div class="card-play-btn"><i class="fa-solid fa-play"></i></div>
                </div>
            </div>
            <div class="card-info">
                <h3 class="card-title" title="${this.escapeHtml(title)}">${this.escapeHtml(title)}</h3>
                <div class="card-meta-line">
                    <span>${year}</span>
                    <span>${typeLabel}</span>
                </div>
            </div>
        `;

        card._mediaData = item;
        card._mediaType = mediaType;
        card.onclick = () => this.openInfoModal(item.id, mediaType);

        return card;
    },

    createTop10Card(item, rank) {
        const card = document.createElement('div');
        card.className = 'top10-card';
        const isTv = item.media_type === 'tv' || (!item.title && item.name);
        const title = item.title || item.name;
        const posterUrl = item.poster_path ? `${Nafy.Config.TMDB_IMAGE_BASE}${item.poster_path}` : '';

        card.innerHTML = `
            <div class="top10-rank-number">${rank}</div>
            <div class="top10-poster-box">
                <img src="${posterUrl}" alt="${this.escapeHtml(title)}" loading="lazy">
            </div>
        `;

        card.onclick = () => this.openInfoModal(item.id, isTv ? 'tv' : 'movie');
        return card;
    },

    createResumeCard(item) {
        const card = document.createElement('div');
        card.className = 'resume-card';
        const isTv = item.media_type === 'tv';
        const subtitle = isTv ? `Saison ${item.season || 1} • Épisode ${item.episode || 1}` : 'Reprendre la lecture';
        const bgUrl = item.backdrop_path 
            ? `${Nafy.Config.TMDB_BACKDROP_BASE}${item.backdrop_path}` 
            : (item.poster_path ? `${Nafy.Config.TMDB_IMAGE_BASE}${item.poster_path}` : '');

        card.innerHTML = `
            <div class="resume-thumb" style="background-image: url('${bgUrl}');">
                <button class="resume-remove-btn" title="Supprimer de l'historique" onclick="event.stopPropagation(); Nafy.UI.handleRemoveResume(${item.id})">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <div class="resume-progress-bar"><div class="resume-progress-fill"></div></div>
            </div>
            <div class="resume-info">
                <div class="resume-title">${this.escapeHtml(item.title)}</div>
                <div class="resume-subtitle">${subtitle}</div>
            </div>
        `;

        card.onclick = () => {
            Nafy.Router.navigate(`watch/${item.media_type}/${item.id}/${item.season || 1}/${item.episode || 1}`);
        };

        return card;
    },

    handleCardBookmark(btn, id) {
        const card = btn.closest('.media-card');
        if (!card || !card._mediaData) return;
        const item = card._mediaData;
        const mediaType = card._mediaType || 'movie';
        const isSaved = Nafy.Storage.toggleWatchlist(item, mediaType);

        if (isSaved) {
            btn.classList.add('saved');
            btn.querySelector('i').className = 'fa-solid fa-bookmark';
            Nafy.UI.showToast(`"${item.title || item.name}" ajouté à Ma Liste !`, 'fa-circle-check');
        } else {
            btn.classList.remove('saved');
            btn.querySelector('i').className = 'fa-regular fa-bookmark';
            Nafy.UI.showToast(`"${item.title || item.name}" retiré de Ma Liste`, 'fa-trash-can');
            if (Nafy.Router.currentRoute === 'watchlist') {
                Nafy.App.renderWatchlist();
            }
        }
    },

    handleRemoveResume(id) {
        Nafy.Storage.removeFromHistory(id);
        Nafy.App.renderResumeRow();
        this.showToast("Titre retiré de l'historique", 'fa-trash-can');
    },

    // ================= MODAL D'INFORMATIONS ÉTENDU =================
    async openInfoModal(id, mediaType = 'movie') {
        const modal = document.getElementById('infoModal');
        if (!modal) return;
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Réinitialise les onglets sur le premier
        this.switchModalTab('synopsis');

        document.getElementById('modalTitle').textContent = 'Chargement...';
        document.getElementById('modalOverview').textContent = '';
        document.getElementById('modalTrailerContainer').style.display = 'none';
        document.getElementById('modalTrailerIframe').src = '';
        document.getElementById('modalCastList').innerHTML = '';
        document.getElementById('modalGenresList').innerHTML = '';
        document.getElementById('modalReviewsList').innerHTML = '<p class="text-muted">Chargement des avis...</p>';
        document.getElementById('modalProvidersList').innerHTML = '<p class="text-muted">Chargement des plateformes...</p>';

        try {
            const data = await Nafy.Api.getDetails(id, mediaType);
            const title = data.title || data.name;
            const year = (data.release_date || data.first_air_date || '—').substring(0, 4);
            const rating = data.vote_average ? data.vote_average.toFixed(1) : '—';
            const runtime = data.runtime ? `${Math.floor(data.runtime / 60)}h ${data.runtime % 60}m` : (data.number_of_seasons ? `${data.number_of_seasons} saison(s)` : '—');
            
            const banner = document.getElementById('modalBanner');
            if (data.backdrop_path) {
                banner.style.backgroundImage = `url('${Nafy.Config.TMDB_BACKDROP_BASE}${data.backdrop_path}')`;
            } else if (data.poster_path) {
                banner.style.backgroundImage = `url('${Nafy.Config.TMDB_IMAGE_BASE}${data.poster_path}')`;
            }

            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalRating').innerHTML = `<i class="fa-solid fa-star"></i> ${rating}`;
            document.getElementById('modalYear').textContent = year;
            document.getElementById('modalType').textContent = mediaType === 'tv' ? 'Série TV' : 'Film';
            document.getElementById('modalRuntime').textContent = runtime;
            document.getElementById('modalOverview').textContent = data.overview || "Aucun synopsis disponible en français pour ce titre.";
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

            // Bande-annonce
            const trailerContainer = document.getElementById('modalTrailerContainer');
            const trailerIframe = document.getElementById('modalTrailerIframe');
            if (data.videos && data.videos.results && data.videos.results.length > 0) {
                const trailer = data.videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')) || data.videos.results[0];
                if (trailer && trailer.key) {
                    trailerIframe.src = `https://www.youtube.com/embed/${trailer.key}?rel=0`;
                    trailerContainer.style.display = 'block';
                }
            }

            // Casting
            const castList = document.getElementById('modalCastList');
            castList.innerHTML = '';
            if (data.credits && data.credits.cast) {
                data.credits.cast.slice(0, 8).forEach(actor => {
                    const chip = document.createElement('span');
                    chip.className = 'cast-chip';
                    chip.textContent = `${actor.name} (${actor.character || 'Rôle'})`;
                    castList.appendChild(chip);
                });
            }

            // Avis / Reviews
            const reviewsContainer = document.getElementById('modalReviewsList');
            reviewsContainer.innerHTML = '';
            if (data.reviews && data.reviews.results && data.reviews.results.length > 0) {
                data.reviews.results.slice(0, 4).forEach(r => {
                    const box = document.createElement('div');
                    box.className = 'review-item-box';
                    box.style.marginBottom = '14px';
                    box.style.padding = '12px';
                    box.style.background = 'rgba(255,255,255,0.04)';
                    box.style.borderRadius = '8px';
                    box.innerHTML = `
                        <strong style="color:var(--text-main); font-size:0.9rem;">${this.escapeHtml(r.author)}</strong>
                        <p style="color:var(--text-muted); font-size:0.85rem; line-height:1.5; margin-top:6px;">${this.escapeHtml(r.content.substring(0, 300))}...</p>
                    `;
                    reviewsContainer.appendChild(box);
                });
            } else {
                reviewsContainer.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">Aucun avis de spectateur répertorié pour ce titre.</p>';
            }

            // Plateformes légales (Watch providers)
            const provContainer = document.getElementById('modalProvidersList');
            provContainer.innerHTML = '';
            const frProviders = data['watch/providers'] && data['watch/providers'].results && data['watch/providers'].results.FR;
            if (frProviders && frProviders.flatrate && frProviders.flatrate.length > 0) {
                frProviders.flatrate.forEach(p => {
                    const pill = document.createElement('span');
                    pill.className = 'genre-tag-item';
                    pill.style.background = 'rgba(255,255,255,0.12)';
                    pill.innerHTML = `<i class="fa-solid fa-play" style="font-size:0.75rem; margin-right:4px;"></i> ${p.provider_name}`;
                    provContainer.appendChild(pill);
                });
            } else {
                provContainer.innerHTML = '<p class="text-muted" style="font-size:0.9rem;">Non disponible sur les abonnements officiels en France.</p>';
            }

            // Boutons d'action du modal
            const playBtn = document.getElementById('modalPlayBtn');
            playBtn.onclick = () => {
                this.closeInfoModal();
                Nafy.Router.navigate(`watch/${mediaType}/${id}`);
            };

            const bookmarkBtn = document.getElementById('modalBookmarkBtn');
            this.updateBookmarkButton(bookmarkBtn, id);
            bookmarkBtn.onclick = () => {
                Nafy.Storage.toggleWatchlist(data, mediaType);
                this.updateBookmarkButton(bookmarkBtn, id);
            };

        } catch (err) {
            console.error("Erreur détails modal :", err);
        }
    },

    closeInfoModal() {
        const modal = document.getElementById('infoModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
        const iframe = document.getElementById('modalTrailerIframe');
        if (iframe) iframe.src = '';
    },

    switchModalTab(tabId) {
        document.querySelectorAll('.modal-tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        document.querySelectorAll('.modal-tab-content').forEach(c => {
            if (c.id === `modalTab-${tabId}`) c.classList.add('active');
            else c.classList.remove('active');
        });
    },

    updateBookmarkButton(btn, id) {
        if (!btn) return;
        const isSaved = Nafy.Storage.isInWatchlist(id);
        btn.innerHTML = `<i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-bookmark"></i> ${isSaved ? 'Dans Ma Liste' : 'Ma Liste'}`;
        if (isSaved) btn.classList.add('btn-primary');
        else btn.classList.remove('btn-primary');
    },

    // ================= MODAL DE PARAMÈTRES =================
    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';
        document.body.style.overflow = '';
    },

    setTheme(themeName) {
        document.documentElement.setAttribute('data-theme', themeName);
        const settings = Nafy.Storage.getSettings();
        settings.theme = themeName;
        Nafy.Storage.saveSettings(settings);

        document.querySelectorAll('.theme-swatch').forEach(s => {
            if (s.dataset.theme === themeName) s.classList.add('active');
            else s.classList.remove('active');
        });
        this.showToast(`Thème appliqué : ${themeName.toUpperCase()}`, 'fa-palette');
    },

    escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
};
