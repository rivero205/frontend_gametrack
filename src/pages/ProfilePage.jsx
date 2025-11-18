import React, { useEffect, useState } from 'react';
import Profile from '../components/Profile';
import ProfileEditModal from '../components/ProfileEditModal';
import { useAuth } from '../hooks/useAuth';
import { getUserGames, getReviews } from '../services/api';
import LibraryPreview from '../components/LibraryPreview';
import RecentReviews from '../components/RecentReviews';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ totalGames: 0, hoursPlayed: 0, progress: 0 });
  const [library, setLibrary] = useState([]);
  const [reviews, setReviews] = useState([]);
    const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    let mounted = true;
    const loadStatsAndLibrary = async () => {
      try {
        const data = await getUserGames({ limit: 2000 });
        const ugs = Array.isArray(data) ? data : (Array.isArray(data?.userGames) ? data.userGames : []);

        const totalGames = ugs.length;
        const hoursPlayed = ugs.reduce((sum, u) => {
          const h = u.horasTotalesJugadas ?? u.horasTotales ?? u.horas ?? 0;
          const parsed = typeof h === 'number' ? h : parseFloat(h) || 0;
          return sum + parsed;
        }, 0);
        const completedCount = ugs.filter(u => u.estado === 'completado' || u.completado === true).length;
        const progress = totalGames > 0 ? Math.round((completedCount / totalGames) * 100) : 0;

        if (mounted) {
          setStats({ totalGames, hoursPlayed, progress });
          // Sort by fecha (try multiple fields) and keep latest
          const sorted = ugs.slice().sort((a,b) => {
            const ta = new Date(a.updatedAt || a.fechaAgregado || a.createdAt || a.fechaCompletado || 0).getTime();
            const tb = new Date(b.updatedAt || b.fechaAgregado || b.createdAt || b.fechaCompletado || 0).getTime();
            return tb - ta;
          });
          setLibrary(sorted);
        }
      } catch (err) {
        console.error('Failed to load user library', err);
      }
    };

    const loadReviews = async () => {
      try {
        const data = await getReviews();
        const all = Array.isArray(data) ? data : (Array.isArray(data?.reviews) ? data.reviews : []);
        // Backend now returns only reviews authored by the current user.
        // Keep the raw objects so UI can use populated `juegoId` or cached `juegoTitulo`.
        if (mounted) setReviews(all);
      } catch (err) {
        console.error('Failed to load reviews', err);
      }
    };

    loadStatsAndLibrary();
    loadReviews();

    return () => { mounted = false; };
  }, [currentUser]);

  return (
    <div className="profile layout-root">
      <div className="profile-view">
        <Profile user={currentUser} stats={stats} onEdit={() => setEditing(true)} />
        {editing && (
          <ProfileEditModal user={currentUser} onClose={() => setEditing(false)} />
        )}

        <div className="profile-sections">
          <div className="profile-left">
            <LibraryPreview items={library} />
          </div>
          <div className="profile-right">
            <RecentReviews reviews={reviews} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;