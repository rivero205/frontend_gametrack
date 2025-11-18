import React, { useState, useEffect } from 'react';
import { getImportedGames } from '../services/api';
import '../styles/hero.css';

export default function HeroCarousel3D({ onRegister, onLogin }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);

  // Optimize image URL for card dimensions (16:9 aspect ratio)
  const optimizeImageUrl = (originalUrl, width = 480, height = 270) => {
    if (!originalUrl || originalUrl.includes('placeholder')) return originalUrl;
    
    // Si es una URL de RAWG, podemos usar sus parámetros de redimensionado
    if (originalUrl.includes('rawg.io')) {
      // RAWG soporta parámetros de resize en la URL
      const url = new URL(originalUrl);
      url.searchParams.set('resize', `${width}x${height}`);
      return url.toString();
    }
    
    // Para otras URLs, usar un servicio de proxy/resize o devolver original
    // Aquí podrías integrar Cloudinary, ImageKit, etc.
    return originalUrl;
  };

  // Fetch top games from RAWG
  useEffect(() => {
    const fetchTopGames = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get top games sorted by metacritic score
        const response = await getImportedGames({
          limit: 12,
          sort: '-metacritic',
        });

        // Filter and map the games data
        const topGames = (response.juegos || [])
          .filter((game) => game.metacritic >= 75) // Only high-rated games
          .slice(0, 8) // Limit to 8 games for carousel
          .map((game) => ({
            id: game._id || game.rawgId,
            title: game.titulo,
            image:
              optimizeImageUrl(
                game.imagenPortada ||
                `https://via.placeholder.com/480x270/0a0f12/10b981?text=${encodeURIComponent(
                  game.titulo
                )}`
              ),
            rating:
              game.rating || (game.metacritic ? game.metacritic / 20 : 4.0), // Convert metacritic to 5-star scale
            genre: game.genero || 'Unknown',
            year: game.añoLanzamiento || new Date().getFullYear(),
            platform: game.plataforma || 'PC',
            metacritic: game.metacritic,
          }));

        setGames(topGames);
      } catch (err) {
        console.error('Error fetching imported games:', err);
        setError('Error al cargar los juegos');
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopGames();
  }, []);

  const total = games.length;

  useEffect(() => {
    if (total > 0) {
      // autoplay every 4 seconds
      const t = setInterval(() => setIndex((i) => (i + 1) % total), 4000);
      return () => clearInterval(t);
    }
  }, [total]);

  // navigation handled by autoplay and clicking side cards
  const getPos = (i) => {
    // relative position -1 left, 0 center, 1 right, others off
    const diff = (i - index + total) % total;
    if (diff === 0) return 'center';
    if (diff === 1) return 'right';
    if (diff === total - 1) return 'left';
    return 'off';
  };

  const current = games[index];

  // Show loading state
  if (loading) {
    return (
      <section className="hero-3d">
        <div className="hero-inner">
          <div className="carousel-wrap">
            <div
              className="carousel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '360px',
              }}
            >
              <div style={{ color: '#fff', fontSize: '1.2rem' }}>
                Cargando juegos top...
              </div>
            </div>
          </div>
          <aside className="hero-panel">
            <h2 className="hero-title">Descubre y Organiza tu Mundo Gaming</h2>
            <h3 className="hero-sub">Miles de títulos en un solo lugar</h3>
            <p className="hero-desc">
              GameTrack Revolution te ayuda a descubrir, ordenar y llevar el
              seguimiento de tus juegos favoritos. Crea tu biblioteca y comparte reseñas con la comunidad.
            </p>
          </aside>
        </div>
      </section>
    );
  }

  // Show error state or empty state
  if (error || games.length === 0) {
    return (
      <section className="hero-3d">
        <div className="hero-inner">
          <div className="carousel-wrap">
            <div
              className="carousel"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '360px',
              }}
            >
              <div
                style={{
                  color: '#fff',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                }}
              >
                {error || 'No se encontraron juegos destacados'}
                <br />
                <small style={{ opacity: 0.7 }}>
                  Conecta con tu backend y sincroniza juegos RAWG
                </small>
              </div>
            </div>
          </div>
          <aside className="hero-panel">
            <h2 className="hero-title">Descubre y Organiza tu Mundo Gaming</h2>
            <h3 className="hero-sub">Miles de títulos en un solo lugar</h3>
            <p className="hero-desc">
              GameTrack Revolution te ayuda a descubrir, ordenar y llevar el
              seguimiento de tus juegos favoritos. Crea tu biblioteca y comparte reseñas con la comunidad.
            </p>
            <div className="hero-ctas">
              <button
                className="btn btn-primary"
                onClick={() => onRegister && onRegister()}
              >
                Comenzar
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => onLogin && onLogin()}
              >
                Iniciar Sesión
              </button>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="hero-3d">
      <div className="hero-inner">
        <div className="carousel-wrap">
          <div className="carousel">
            {games.map((g, i) => {
              const pos = getPos(i);
              return (
                <div
                  key={g.id}
                  className={`card ${pos}`}
                  onClick={() => pos !== 'center' && setIndex(i)}
                  role="button"
                  aria-label={`Ver ${g.title}`}
                >
                  <div className="card-media">
                    <img 
                      src={g.image} 
                      alt={g.title}
                      loading={pos === 'center' ? 'eager' : 'lazy'}
                      style={{
                        maxWidth: '480px',
                        maxHeight: '270px',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                  <div className="card-badges">
                    <span className="badge platform">{g.platform}</span>
                    <span className="badge genre">{g.genre}</span>
                  </div>
                  <div className="card-title">{g.title}</div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="hero-panel">
          <h2 className="hero-title">Descubre y Organiza tu Mundo Gaming</h2>
          <h3 className="hero-sub">Miles de títulos en un solo lugar</h3>
          <p className="hero-desc">
            GameTrack Revolution te ayuda a descubrir, ordenar y llevar el
            seguimiento de tus juegos favoritos. Crea tu biblioteca y comparte reseñas con la comunidad.
          </p>

          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">{current.rating}</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-value">{current.genre}</div>
              <div className="stat-label">Género</div>
            </div>
            <div className="stat">
              <div className="stat-value">{current.year}</div>
              <div className="stat-label">Año</div>
            </div>
          </div>

          <div className="hero-ctas">
            <button
              className="btn btn-primary"
              onClick={() => onRegister && onRegister()}
            >
              Comenzar
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onLogin && onLogin()}
            >
              Iniciar Sesión
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
