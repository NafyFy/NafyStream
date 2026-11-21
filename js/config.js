/**
 * NAFY STREAM — CONFIGURATION GLOBALE
 */

window.Nafy = window.Nafy || {};

Nafy.Config = {
    APP_NAME: 'Nafy Stream',
    VERSION: '2.6.0',
    
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
,

    // SAGAS & FRANCHISES CULTES (Collections TMDb officielles avec backdrops authentiques)
    SAGAS: [
        // --- SCI-FI & ESPACE ---
        { id: 10, name: 'Star Wars', category: 'scifi', icon: 'fa-jedi', backdrop: 'https://image.tmdb.org/t/p/w780/iY2ujEY2m68OTTlPFTiHub9joHS.jpg', count: 9 },
        { id: 2344, name: 'Matrix', category: 'scifi', icon: 'fa-terminal', backdrop: 'https://image.tmdb.org/t/p/w780/bRm2DEgUiYciDw3myHuYFInD7la.jpg', count: 4 },
        { id: 87096, name: 'Avatar', category: 'scifi', icon: 'fa-feather', backdrop: 'https://image.tmdb.org/t/p/w780/4uwX70EzaWVcGUXMtXPoexlNAff.jpg', count: 5 },
        { id: 8650, name: 'Transformers', category: 'scifi', icon: 'fa-robot', backdrop: 'https://image.tmdb.org/t/p/w780/zvZBNNDWd5LcsIBpDhJyCB2MDT7.jpg', count: 5 },
        { id: 173710, name: 'La Planète des Singes', category: 'scifi', icon: 'fa-tree', backdrop: 'https://image.tmdb.org/t/p/w780/iMhm0g555HgQNIXAMvnlgOiW5Rz.jpg', count: 4 },
        { id: 8091, name: 'Alien', category: 'scifi', icon: 'fa-pastafarianism', backdrop: 'https://image.tmdb.org/t/p/w780/6X42JnSMdo3dPAswOHUuvebdTq7.jpg', count: 4 },
        { id: 528, name: 'Terminator', category: 'scifi', icon: 'fa-skull', backdrop: 'https://image.tmdb.org/t/p/w780/sCnBEw2Yu6foEjs4Xb4eMddYHRo.jpg', count: 6 },
        { id: 264, name: 'Retour vers le Futur', category: 'scifi', icon: 'fa-clock', backdrop: 'https://image.tmdb.org/t/p/w780/c9C9Pg2QctyjZHRmS0P8rZg1OTA.jpg', count: 3 },

        // --- SUPER-HÉROS ---
        { id: 86311, name: 'Avengers (MCU)', category: 'superhero', icon: 'fa-shield-halved', backdrop: 'https://image.tmdb.org/t/p/w780/2UNUv4NJdC36E5myDHACBJ99EwL.jpg', count: 6 },
        { id: 263, name: 'The Dark Knight (Batman)', category: 'superhero', icon: 'fa-mask', backdrop: 'https://image.tmdb.org/t/p/w780/xyhrCEdB4XRkelfVsqXeUZ6rLHi.jpg', count: 3 },
        { id: 531241, name: 'Spider-Man (MCU)', category: 'superhero', icon: 'fa-spider', backdrop: 'https://image.tmdb.org/t/p/w780/kPzNNNvdcXfQHqa8wf2pHT5rYs5.jpg', count: 4 },
        { id: 556, name: 'Spider-Man (Trilogie Sam Raimi)', category: 'superhero', icon: 'fa-spider', backdrop: 'https://image.tmdb.org/t/p/w780/waZqriYTuBE3WqXI3SDGi3kfDQE.jpg', count: 3 },
        { id: 748, name: 'X-Men', category: 'superhero', icon: 'fa-dna', backdrop: 'https://image.tmdb.org/t/p/w780/ykVHlrE3aSvHYeIXOrWDsYZ18vv.jpg', count: 7 },
        { id: 448150, name: 'Deadpool', category: 'superhero', icon: 'fa-hand-peace', backdrop: 'https://image.tmdb.org/t/p/w780/dTq7mGyAR5eAydR532feWfjJjzm.jpg', count: 3 },

        // --- AVENTURE & FANTASY ---
        { id: 119, name: 'Le Seigneur des Anneaux', category: 'adventure', icon: 'fa-ring', backdrop: 'https://image.tmdb.org/t/p/w780/bccR2CGTWVVSZAG0yqmy3DIvhTX.jpg', count: 3 },
        { id: 121938, name: 'Le Hobbit', category: 'adventure', icon: 'fa-mountain', backdrop: 'https://image.tmdb.org/t/p/w780/7wO7MSnP5UcwR2cTHdJFF1vP4Ie.jpg', count: 3 },
        { id: 295, name: 'Pirates des Caraïbes', category: 'adventure', icon: 'fa-skull-crossbones', backdrop: 'https://image.tmdb.org/t/p/w780/wxgD3fB5lQ2sGJLog0rvXW049Pf.jpg', count: 5 },
        { id: 84, name: 'Indiana Jones', category: 'adventure', icon: 'fa-hat-cowboy', backdrop: 'https://image.tmdb.org/t/p/w780/6kh59mZizZsttZPR0HAdXk6Ve2n.jpg', count: 5 },
        { id: 328, name: 'Jurassic Park & World', category: 'adventure', icon: 'fa-dragon', backdrop: 'https://image.tmdb.org/t/p/w780/njFixYzIxX8jsn6KMSEtAzi4avi.jpg', count: 8 },
        { id: 131635, name: 'Hunger Games', category: 'adventure', icon: 'fa-fire', backdrop: 'https://image.tmdb.org/t/p/w780/Ipp7cegtub4t0mu7xaKLQkYoGc.jpg', count: 4 },

        // --- ACTION & ESPIONNAGE ---
        { id: 9485, name: 'Fast & Furious', category: 'action', icon: 'fa-car-side', backdrop: 'https://image.tmdb.org/t/p/w780/z5A5W3WYJc3UVEWljSGwdjDgQ0j.jpg', count: 12 },
        { id: 404609, name: 'John Wick', category: 'action', icon: 'fa-gun', backdrop: 'https://image.tmdb.org/t/p/w780/fSwYa5q2xRkBoOOjueLpkLf3N1m.jpg', count: 4 },
        { id: 87359, name: 'Mission: Impossible', category: 'action', icon: 'fa-user-secret', backdrop: 'https://image.tmdb.org/t/p/w780/mroWh717g0Ah2c0rrPGW6f3EWMM.jpg', count: 8 },
        { id: 645, name: 'James Bond 007', category: 'action', icon: 'fa-martini-glass-citrus', backdrop: 'https://image.tmdb.org/t/p/w780/dOSECZImeyZldoq0ObieBE0lwie.jpg', count: 27 },
        { id: 31562, name: 'Jason Bourne', category: 'action', icon: 'fa-user-ninja', backdrop: 'https://image.tmdb.org/t/p/w780/vA5xMglyZv7yzDTj1qUTU4OvelV.jpg', count: 5 },
        { id: 1575, name: 'Rocky & Creed', category: 'action', icon: 'fa-hand-fist', backdrop: 'https://image.tmdb.org/t/p/w780/yaXXemxz3ePNSrqNtc4ZAbuxJRv.jpg', count: 6 },
        { id: 1570, name: 'Die Hard (Piège de Cristal)', category: 'action', icon: 'fa-explosion', backdrop: 'https://image.tmdb.org/t/p/w780/nKShbIW0wJnSbl3t8uPje0QhTb7.jpg', count: 5 },
        { id: 8945, name: 'Mad Max', category: 'action', icon: 'fa-road', backdrop: 'https://image.tmdb.org/t/p/w780/zI0q2ENcQOLECbe0gAEGlncVh2j.jpg', count: 6 },
        { id: 304, name: 'Ocean\'s Eleven', category: 'action', icon: 'fa-gem', backdrop: 'https://image.tmdb.org/t/p/w780/7WUSrq8DqSkVgv1vmhBvav5bPoB.jpg', count: 3 },
        { id: 230, name: 'Le Parrain (The Godfather)', category: 'action', icon: 'fa-chess-king', backdrop: 'https://image.tmdb.org/t/p/w780/28eqCQ51SuLfkbzhQE7jCmTfYfy.jpg', count: 3 },

        // --- HORREUR & FRISSONS ---
        { id: 2602, name: 'Scream', category: 'horror', icon: 'fa-ghost', backdrop: 'https://image.tmdb.org/t/p/w780/fG6GzZAwtsW3v2mhB4EyQLMRjUV.jpg', count: 8 },
        { id: 313086, name: 'Conjuring (Les Dossiers Warren)', category: 'horror', icon: 'fa-book-skull', backdrop: 'https://image.tmdb.org/t/p/w780/kHZaX0vuhZdbuq0WKU3BpA9WIQ0.jpg', count: 4 },
        { id: 656, name: 'Saw', category: 'horror', icon: 'fa-puzzle-piece', backdrop: 'https://image.tmdb.org/t/p/w780/q6XF2qbrxdv3OwZPnXgecDRft1O.jpg', count: 11 },

        // --- ANIMATION & CULTE ---
        { id: 2150, name: 'Shrek', category: 'animation', icon: 'fa-face-laugh-beam', backdrop: 'https://image.tmdb.org/t/p/w780/lhsd1zCsq5UquvcNalmhuddV3tI.jpg', count: 5 },
        { id: 10194, name: 'Toy Story', category: 'animation', icon: 'fa-shapes', backdrop: 'https://image.tmdb.org/t/p/w780/hApclyB9NEZEQujAVajzi5iWE4a.jpg', count: 5 },
        { id: 8354, name: 'L\'Âge de Glace', category: 'animation', icon: 'fa-snowflake', backdrop: 'https://image.tmdb.org/t/p/w780/2aMEn3wawIXva2xFFlQ2NClLEeW.jpg', count: 7 },
        { id: 2980, name: 'S.O.S. Fantômes (Ghostbusters)', category: 'animation', icon: 'fa-ghost', backdrop: 'https://image.tmdb.org/t/p/w780/guigdRPHN65fsgZHmvVvBOyiArf.jpg', count: 4 }
    ]
};
