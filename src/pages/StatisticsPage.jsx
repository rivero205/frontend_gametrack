import React from 'react';
import Statistics from '../components/Statistics';
import '../styles/statistics.css';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { useGameOperations } from '../hooks/useGameOperations';

const StatisticsPage = () => {
  const { isAuthenticated } = useAuth();
  const { games, reviews, loadingStates, getStats } = useGameOperations(isAuthenticated);

  return (
    <div className="statistics-page">
      <div className="statistics-view">
        {(loadingStates.games || loadingStates.reviews) ? (
          <Loader message="Cargando estadísticas..." />
        ) : (
          <Statistics 
            games={games} 
            reviews={reviews} 
            stats={getStats()} 
          />
        )}
      </div>
    </div>
  );
};

export default StatisticsPage;