import React from 'react';
import { Gamepad2, TrendingUp, Clock, Star, BarChart3 } from 'lucide-react';

export default function Statistics({ games, stats }) {
  // reviews are available through stats object
  const genreCount = games.reduce((acc, game) => {
    if (game.genero) {
      acc[game.genero] = (acc[game.genero] || 0) + 1;
    }
    return acc;
  }, {});

  const platformCount = games.reduce((acc, game) => {
    if (game.plataforma) {
      acc[game.plataforma] = (acc[game.plataforma] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div>
      <h2 className="view-title">
        Estadísticas Personales
      </h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Gamepad2 size={32} />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Juegos en Biblioteca</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={32} />
          </div>
          <div className="stat-value">{stats.completed}</div>
          <div className="stat-label">Juegos Completados</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={32} />
          </div>
          <div className="stat-value">{stats.totalHours}</div>
          <div className="stat-label">Horas Totales Jugadas</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Star size={32} />
          </div>
          <div className="stat-value">{stats.avgRating}</div>
          <div className="stat-label">Puntuación Media</div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-card">
          <h3>
            <BarChart3 size={24} /> Distribución por Género
          </h3>
          {Object.entries(genreCount).sort((a, b) => b[1] - a[1]).map(([genre, count]) => {
            const total = stats.total || 1;
            const percent = Math.round((count / total) * 100);
            return (
              <div key={genre} className="chart-item">
                <div className="chart-label">
                  <span>{genre}</span>
                  <span>{count} juego{count !== 1 ? 's' : ''} — {percent}%</span>
                </div>
                <div className="chart-bar">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(genreCount).length === 0 && (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>
              No hay datos de géneros
            </p>
          )}
        </div>

        <div className="chart-card">
          <h3>
            <BarChart3 size={24} /> Distribución por Plataforma
          </h3>
          {Object.entries(platformCount).sort((a, b) => b[1] - a[1]).map(([platform, count]) => {
            const total = stats.total || 1;
            const percent = Math.round((count / total) * 100);
            return (
              <div key={platform} className="chart-item">
                <div className="chart-label">
                  <span>{platform}</span>
                  <span>{count} juego{count !== 1 ? 's' : ''} — {percent}%</span>
                </div>
                <div className="chart-bar">
                  <div
                    className="chart-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
          {Object.keys(platformCount).length === 0 && (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 0' }}>
              No hay datos de plataformas
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
