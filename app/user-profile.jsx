import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getUserProfile } from '@/src/services/profileService';
import { getUserFavorites } from '@/src/services/favoriteService';
import { getUserWatchlist } from '@/src/services/watchlistService';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const [watchlist, setWatchlist] = useState([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);

  const [favoritesError, setFavoritesError] = useState('');
  const [watchlistError, setWatchlistError] = useState('');

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile(userId);
      setUser(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorites = async () => {
    if (showFavorites) {
      setShowFavorites(false);
      return;
    }
    try {
      setLoadingFavorites(true);
      setFavoritesError('');
      const data = await getUserFavorites(userId);
      setFavorites(data);
      setShowFavorites(true);
    } catch (err) {
      setFavoritesError(err?.response?.data?.message || 'Cannot view favorites');
    } finally {
      setLoadingFavorites(false);
    }
  };

  const toggleWatchlist = async () => {
    if (showWatchlist) {
      setShowWatchlist(false);
      return;
    }
    try {
      setLoadingWatchlist(true);
      setWatchlistError('');
      const data = await getUserWatchlist(userId);
      setWatchlist(data);
      setShowWatchlist(true);
    } catch (err) {
      setWatchlistError(err?.response?.data?.message || 'Cannot view watchlist');
    } finally {
      setLoadingWatchlist(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D35400" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getGenderIcon = () => {
    if (user?.gender === 'Male') return 'male';
    if (user?.gender === 'Female') return 'female';
    return 'person';
  };

  const getRoleColor = () => {
    if (user?.role === 'admin') return '#E74C3C';
    if (user?.role === 'staff') return '#3498DB';
    return '#D35400';
  };

  const renderMovieCard = (movie, index) => (
    <TouchableOpacity
      key={movie._id || index}
      style={styles.movieCard}
      onPress={() => router.push({ pathname: '/movie-detail', params: { id: movie._id } })}
    >
      {movie.poster ? (
        <Image source={{ uri: movie.poster }} style={styles.moviePoster} />
      ) : (
        <View style={[styles.moviePoster, styles.moviePosterPlaceholder]}>
          <MaterialIcons name="movie" size={24} color="#BCAAA4" />
        </View>
      )}
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={1}>{movie.title || movie.titleEnglish}</Text>
        {movie.titleEnglish && movie.title !== movie.titleEnglish && (
          <Text style={styles.movieSubTitle} numberOfLines={1}>{movie.titleEnglish}</Text>
        )}
        <View style={styles.movieMeta}>
          {movie.score > 0 && (
            <View style={styles.movieRating}>
              <MaterialIcons name="star" size={12} color="#F4C430" />
              <Text style={styles.movieRatingText}>{movie.score}</Text>
            </View>
          )}
          {movie.year && <Text style={styles.movieYear}>{movie.year}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name={getGenderIcon()} size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.displayName}>{user?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor() }]}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Information</Text>

          <Text style={styles.label}>Gender</Text>
          <Text style={styles.value}>{user?.gender || 'Not specified'}</Text>

          <Text style={styles.label}>Date of Birth</Text>
          <Text style={styles.value}>{user?.dateOfBirth || 'Not specified'}</Text>

          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>

        {/* Favorites Section */}
        <TouchableOpacity style={styles.listToggle} onPress={toggleFavorites}>
          <MaterialIcons name="favorite" size={20} color="#D35400" />
          <Text style={styles.listToggleText}>Favorites</Text>
          {loadingFavorites ? (
            <ActivityIndicator size="small" color="#D35400" />
          ) : (
            <MaterialIcons
              name={showFavorites ? 'expand-less' : 'expand-more'}
              size={24}
              color="#8D6E63"
            />
          )}
        </TouchableOpacity>
        {showFavorites && (
          <View style={styles.listContainer}>
            {favoritesError ? (
              <Text style={styles.listError}>{favoritesError}</Text>
            ) : favorites.length === 0 ? (
              <Text style={styles.emptyListText}>No favorites yet</Text>
            ) : (
              favorites.map((movie, index) => renderMovieCard(movie, index))
            )}
          </View>
        )}

        {/* Watchlist Section */}
        <TouchableOpacity style={styles.listToggle} onPress={toggleWatchlist}>
          <MaterialIcons name="visibility" size={20} color="#D35400" />
          <Text style={styles.listToggleText}>Watchlist</Text>
          {loadingWatchlist ? (
            <ActivityIndicator size="small" color="#D35400" />
          ) : (
            <MaterialIcons
              name={showWatchlist ? 'expand-less' : 'expand-more'}
              size={24}
              color="#8D6E63"
            />
          )}
        </TouchableOpacity>
        {showWatchlist && (
          <View style={styles.listContainer}>
            {watchlistError ? (
              <Text style={styles.listError}>{watchlistError}</Text>
            ) : watchlist.length === 0 ? (
              <Text style={styles.emptyListText}>No watchlist entries yet</Text>
            ) : (
              watchlist.map((movie, index) => (
                <View key={movie._id || index}>
                  {renderMovieCard(movie, index)}
                  {movie.watchStatus && (
                    <View style={styles.watchStatusBadge}>
                      <Text style={styles.watchStatusText}>
                        {movie.watchStatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5EBE6',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F5EBE6',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#D35400',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  displayName: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  roleBadge: { marginTop: 8, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#F5EBE6',
    shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C1810', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#8D6E63', marginTop: 12, marginBottom: 4 },
  value: {
    fontSize: 15, color: '#2C1810', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5EBE6',
  },
  errorText: { fontSize: 15, color: '#E74C3C', marginTop: 12 },
  listToggle: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 16, marginTop: 12,
    borderWidth: 1, borderColor: '#F5EBE6',
  },
  listToggleText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2C1810', marginLeft: 12 },
  listContainer: { marginTop: 8 },
  listError: { fontSize: 13, color: '#E74C3C', textAlign: 'center', paddingVertical: 12 },
  emptyListText: { fontSize: 13, color: '#8D6E63', textAlign: 'center', paddingVertical: 12 },
  movieCard: {
    flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F5EBE6',
  },
  moviePoster: { width: 50, height: 70, borderRadius: 6 },
  moviePosterPlaceholder: {
    backgroundColor: '#FFF8F0', justifyContent: 'center', alignItems: 'center',
  },
  movieInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  movieTitle: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  movieSubTitle: { fontSize: 12, color: '#8D6E63', marginTop: 2 },
  movieMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 10 },
  movieRating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  movieRatingText: { fontSize: 12, fontWeight: '600', color: '#F4C430' },
  movieYear: { fontSize: 12, color: '#8D6E63' },
  watchStatusBadge: {
    backgroundColor: '#FBEBE1', borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3, alignSelf: 'flex-start', marginLeft: 60, marginBottom: 4,
  },
  watchStatusText: { fontSize: 11, fontWeight: '600', color: '#D35400' },
});
