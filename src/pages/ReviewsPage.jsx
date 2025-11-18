import React from 'react';
import ReviewsList from '../components/ReviewsList';
import '../styles/reviews.css';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { useGameOperations } from '../hooks/useGameOperations';

const ReviewsPage = () => {
  const { isAuthenticated } = useAuth();
  const { reviews, games, loadingStates, deleteReview, updateReviewLocal } = useGameOperations(isAuthenticated);

  return (
    <div className="reviews-page">
      <div className="reviews-view">
        {loadingStates.reviews ? (
          <Loader message="Cargando reseñas..." />
        ) : (
          <ReviewsList 
            reviews={reviews} 
            games={games} 
            onDelete={deleteReview} 
            onEdit={updateReviewLocal}
          />
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;