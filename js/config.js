/**
 * NAFY STREAM — CONFIGURATION GLOBALE
 */

window.Nafy = window.Nafy || {};

Nafy.Config = {
    APP_NAME: 'Nafy Stream',
    VERSION: '2.5.0',
    
    // API TMDB
    TMDB_API_KEY: 'aca5581c3c1261367bad7827b83ffee4',
    TMDB_BASE_URL: 'https://api.themoviedb.org/3',
    TMDB_IMAGE_BASE: 'https://image.tmdb.org/t/p/w500',
    TMDB_BACKDROP_BASE: 'https://image.tmdb.org/t/p/original',
    TMDB_STILL_BASE: 'https://image.tmdb.org/t/p/w300',

    // SERVEURS DE STREAMING INTÉGRÉS
    SERVERS: {
        moviez: {
            id: 'moviez',
            name: 'Serveur 1 (Moviez)',
            badge: 'Rapide VF/VOST',
            icon: 'fa-circle-play',
            getMovieUrl: (id) => `https://api.moviez.ac/${id}`,
            getTvUrl: (id, s, e) => `https://api.moviez.ac/serie/${id}/${s}/${e}`
        },
        frembed: {
            id: 'frembed',
            name: 'Serveur 2 (Frembed)',
            badge: 'HD Stable',
            icon: 'fa-play',
            getMovieUrl: (id, imdbId) => `https://frembed.bar/embed/movie/${imdbId || id}`,
            getTvUrl: (id, imdbId, s, e) => `https://frembed.bar/embed/tv/${imdbId || id}/${s}/${e}`
        },
        vidlink: {
            id: 'vidlink',
            name: 'Serveur 3 (VidLink)',
            badge: 'Lecteur 1080p',
            icon: 'fa-bolt',
            getMovieUrl: (id) => `https://vidlink.pro/movie/${id}`,
            getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
        },
        multiembed: {
            id: 'multiembed',
            name: 'Serveur 4 (MultiEmbed)',
            badge: 'Multi-langues',
            icon: 'fa-globe',
            getMovieUrl: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
            getTvUrl: (id, s, e) => `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`
        },
        vidsrc: {
            id: 'vidsrc',
            name: 'Serveur 5 (Vidsrc VIP)',
            badge: 'Lecteur VIP',
            icon: 'fa-crown',
            getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
            getTvUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
        },
        embedsu: {
            id: 'embedsu',
            name: 'Serveur 6 (Embed.su)',
            badge: 'Ultra Rapide',
            icon: 'fa-film',
            getMovieUrl: (id) => `https://embed.su/embed/movie/${id}`,
            getTvUrl: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`
        }
    },

    // MAPS DES GENRES
    GENRES: {
        28: 'Action', 12: 'Aventure', 16: 'Animation', 35: 'Comédie',
        80: 'Crime', 99: 'Documentaire', 18: 'Drame', 10751: 'Famille',
        14: 'Fantastique', 36: 'Histoire', 27: 'Horreur', 10402: 'Musique',
        9648: 'Mystère', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'Téléfilm',
        53: 'Thriller', 10752: 'Guerre', 37: 'Western',
        10759: 'Action & Aventure', 10762: 'Enfants', 10763: 'Actualité',
        10764: 'Télé-réalité', 10765: 'Sci-Fi & Fantastique', 10766: 'Feuilleton',
        10767: 'Talk-show', 10768: 'Guerre & Politique'
    },

    // PLATEFORMES DE STREAMING D'ORIGINE (TMDB Watch Providers pour la France)
    PROVIDERS: [
        { id: 8, name: 'Netflix', icon: 'fa-brands fa-neos' },
        { id: 119, name: 'Amazon Prime', icon: 'fa-brands fa-amazon' },
        { id: 337, name: 'Disney+', icon: 'fa-solid fa-wand-magic-sparkles' },
        { id: 381, name: 'Canal+', icon: 'fa-solid fa-tv' },
        { id: 2, name: 'Apple TV+', icon: 'fa-brands fa-apple' }
    ]
};
