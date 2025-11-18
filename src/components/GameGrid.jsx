import React from 'react';
import GameCard from './GameCard';

export default function GameGrid({ games, reviewsMap, onEdit, onDelete, onToggleCompleted, onAddReview, onView, readOnly = false }) {
  return (
    <div className="games-grid">
      {games.map((game, idx) => {
        const normalize = (id) => {
          if (!id) return null;
          const s = String(id).trim();
          if (s === '' || s === 'undefined' || s.startsWith('undefined') || s.includes('undefined-')) return null;
          return s;
        };

        const safeId = normalize(game._id);
        const safeUserGameId = normalize(game.userGameId);
        const key = safeId ?? safeUserGameId ?? (game.rawgId ? `rawg-${game.rawgId}` : `game-${idx}`);
        const reviewsKey = safeId ?? safeUserGameId ?? `game-${idx}`;

        return (
          <GameCard
            key={key}
            game={game}
            reviews={reviewsMap[reviewsKey] || []}
            onEdit={() => onEdit && onEdit(game)}
            onDelete={() => onDelete && onDelete(game)}
            onToggleCompleted={() => onToggleCompleted && onToggleCompleted(game)}
            onAddReview={() => onAddReview && onAddReview(game)}
            onView={() => onView && onView(game)}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}
