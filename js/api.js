/**
 * NAFY STREAM — CLIENT API TMDB (AVEC SYSTÈME DE CACHE & REQUÊTES ENRICHIES)
 */

window.Nafy = window.Nafy || {};

Nafy.Api = {
    cache: new Map(),

    async fetchJson(endpoint, params = {}) {
        const urlObj = new URL(`${Nafy.Config.TMDB_BASE_URL}${endpoint}`);
        urlObj.searchParams.set('api_key', Nafy.Config.TMDB_API_KEY);
        urlObj.searchParams.set('language', 'fr-FR');

        for (const [key, val] of Object.entries(params)) {
            if (val !== null && val !== undefined && val !== '') {
                urlObj.searchParams.set(key, val);
            }
        }

        const url = urlObj.toString();
        if (this.cache.has(url)) {
            return this.cache.get(url);
        }

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            const data = await res.json();
            this.cache.set(url, data);
            return data;
        } catch (err) {
            console.error(`Erreur requête TMDB [${endpoint}] :`, err);
            throw err;
        }
    },

    // Tendances
    getTrending(mediaType = 'all', timeWindow = 'week') {
        return this.fetchJson(`/trending/${mediaType}/${timeWindow}`);
    },

    // Films populaires & mieux notés avec filtres avancés (année, note minimale)
    getPopularMovies(page = 1, sort = 'popularity.desc', year = null, minRating = null) {
        const params = {
            sort_by: sort,
            page: page,
            'vote_count.gte': 40
        };
        if (year) params.primary_release_year = year;
        if (minRating) params['vote_average.gte'] = minRating;
        return this.fetchJson('/discover/movie', params);
    },

    // Séries TV populaires avec filtres avancés
    getPopularTv(page = 1, sort = 'popularity.desc', year = null, minRating = null) {
        const params = {
            sort_by: sort,
            page: page,
            'vote_count.gte': 30
        };
        if (year) params.first_air_date_year = year;
        if (minRating) params['vote_average.gte'] = minRating;
        return this.fetchJson('/discover/tv', params);
    },

    getTopRatedMovies(page = 1) {
        return this.fetchJson('/movie/top_rated', { page });
    },

    // Filtrage par genre
    getByGenre(genreId, mediaType = 'movie', page = 1, sort = 'popularity.desc', year = null, minRating = null) {
        const endpoint = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';
        const params = {
            with_genres: genreId,
            sort_by: sort,
            page: page
        };
        if (year) {
            if (mediaType === 'tv') params.first_air_date_year = year;
            else params.primary_release_year = year;
        }
        if (minRating) params['vote_average.gte'] = minRating;
        return this.fetchJson(endpoint, params);
    },

    // Filtrage par plateforme (Netflix, Prime, Disney+, Canal+, etc.)
    getByProvider(providerId, mediaType = 'movie', page = 1) {
        const endpoint = mediaType === 'tv' ? '/discover/tv' : '/discover/movie';
        return this.fetchJson(endpoint, {
            with_watch_providers: providerId,
            watch_region: 'FR',
            sort_by: 'popularity.desc',
            page: page
        });
    },

    // Détails complets d'un titre (Bandes-annonces, Casting, Avis, External IDs, Plateformes)
    getDetails(id, mediaType = 'movie') {
        const endpoint = mediaType === 'tv' ? `/tv/${id}` : `/movie/${id}`;
        return this.fetchJson(endpoint, {
            append_to_response: 'credits,videos,external_ids,similar,reviews,watch/providers'
        });
    },

    // Épisodes d'une saison avec visuels et résumés
    getSeasonEpisodes(tvId, seasonNumber) {
        return this.fetchJson(`/tv/${tvId}/season/${seasonNumber}`);
    },

    // Sagas & Collections de films
    getCollection(collectionId) {
        return this.fetchJson(`/collection/${collectionId}`);
    },

    // Filmographie complète d'une personne (Acteur / Réalisateur)
    getPersonDetails(personId) {
        return this.fetchJson(`/person/${personId}`);
    },

    getPersonCredits(personId) {
        return this.fetchJson(`/person/${personId}/combined_credits`);
    },

    // Tirage aléatoire d'un chef-d'œuvre ("Surprenez-moi")
    async getRandomTitle(mediaType = 'movie') {
        try {
            const randomPage = Math.floor(Math.random() * 5) + 1;
            const endpoint = mediaType === 'tv' ? '/tv/top_rated' : '/movie/top_rated';
            const data = await this.fetchJson(endpoint, { page: randomPage });
            if (data.results && data.results.length > 0) {
                const randomIndex = Math.floor(Math.random() * data.results.length);
                const item = data.results[randomIndex];
                return {
                    ...item,
                    media_type: mediaType
                };
            }
        } catch (e) {
            console.error("Erreur random title :", e);
        }
        return null;
    },

    // Recherche multi-critères
    searchMulti(query, page = 1) {
        return this.fetchJson('/search/multi', {
            query: encodeURIComponent(query),
            page: page,
            include_adult: false
        });
    }
};
