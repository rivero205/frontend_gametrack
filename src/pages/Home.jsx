import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Star, BarChart3 } from 'lucide-react';
import HeroCarousel3D from '../components/HeroCarousel3D';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) {
        // Redirect authenticated users to dashboard
        navigate('/dashboard');
        return null;
    }

    return (
        <div className="home-page">
            {/* Hero Carousel */}
            <HeroCarousel3D
                onRegister={() => navigate('/register')}
                onLogin={() => navigate('/login')}
            />

            {/* Explore Content */}


            {/* Features summary */}
            <section className="features-section" style={{ marginTop: 28 }}>
                <h3>¿Qué puedes hacer en GameTrack?</h3>
                <div className="features-grid">
                    <div className="feature-card">
                        <Gamepad2 size={28} />
                        <h4>Organiza tu Biblioteca</h4>
                        <p>Mantén tu colección ordenada por etiquetas y estado.</p>
                    </div>
                    <div className="feature-card">
                        <Star size={28} />
                        <h4>Comparte Reseñas</h4>
                        <p>Publica reseñas con puntuaciones y horas jugadas.</p>
                    </div>
                    <div className="feature-card">
                        <BarChart3 size={28} />
                        <h4>Analiza tu progreso</h4>
                        <p>Visualiza estadísticas de tu actividad y logros.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;