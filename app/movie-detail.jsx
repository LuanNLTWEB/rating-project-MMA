import { getMovie } from '@/src/services/movieService';
import { addFavorite, removeFavorite, getFavoriteIds } from '@/src/services/favoriteService';
import { addToWatchlist, removeFromWatchlist, getWatchlistIds, updateWatchStatus } from '@/src/services/watchlistService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BANNER_HEIGHT = 220;
const POSTER_WIDTH = 130;
const POSTER_HEIGHT = 190;

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [watchStatus, setWatchStatus] = useState(null);
  const [favLoading, setFavLoading] = useState(false);
  const [wlLoading, setWlLoading] = useState(false);
  const [showWlDropdown, setShowWlDropdown] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const data = await getMovie(id);
        if (isMounted) setMovie(data);
      } catch (err) {
        console.error('Fetch movie detail error:', err);
        if (isMounted) setError('Could not load movie details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMovie();
    return () => { isMounted = false; };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const checkStatus = async () => {
      try {
        const [favRes, wlRes] = await Promise.all([
          getFavoriteIds(),
          getWatchlistIds(),
        ]);
        setIsFavorite(favRes.includes(id));
        const wlItem = wlRes.find((w) => w.movieId === id);
        setWatchStatus(wlItem ? wlItem.status : null);
      } catch {}
    };
    checkStatus();
  }, [id]);

  const handleToggleFavorite = async () => {
    try {
      setFavLoading(true);
      if (isFavorite) {
        await removeFavorite(id);
        setIsFavorite(false);
      } else {
        await addFavorite(id);
        setIsFavorite(true);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Action failed';
      Alert.alert('Error', msg);
    } finally {
      setFavLoading(false);
    }
  };

  const handleWlSelect = async (status) => {
    setShowWlDropdown(false);
    try {
      setWlLoading(true);
      if (watchStatus) {
        await updateWatchStatus(id, status);
      } else {
        await addToWatchlist(id, status);
      }
      setWatchStatus(status);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Action failed';
      Alert.alert('Error', msg);
    } finally {
      setWlLoading(false);
    }
  };

  const handleWlRemove = async () => {
    setShowWlDropdown(false);
    try {
      setWlLoading(true);
      await removeFromWatchlist(id);
      setWatchStatus(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Action failed';
      Alert.alert('Error', msg);
    } finally {
      setWlLoading(false);
    }
  };

  const wlStatusLabel = (s) => {
    switch (s) {
      case 'watching': return 'Watching';
      case 'plan_to_watch': return 'Plan to Watch';
      case 'completed': return 'Completed';
      default: return 'Watchlist';
    }
  };

  const wlDropdownItems = [
    { key: 'watching', label: 'Watching', color: '#2980B9' },
    { key: 'plan_to_watch', label: 'Plan to Watch', color: '#D4AC0D' },
    { key: 'completed', label: 'Completed', color: '#16A085' },
    { key: '__remove__', label: 'Remove from Watchlist', color: '#E74C3C' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D35400" />
          <Text style={styles.infoText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error || 'Movie not found'}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const bannerUri = movie.banner || movie.poster || movie.image || '';
  const posterUri = movie.poster || movie.image || '';

  const openTrailer = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerWrap}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={styles.bannerImage} resizeMode="cover" />
          ) : (
            <View style={[styles.bannerImage, styles.bannerPlaceholder]} />
          )}
          <View style={styles.bannerOverlay} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtnFloat} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#FFF" />
          </TouchableOpacity>

          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{movie.type?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Poster + Info row */}
          <View style={styles.posterRow}>
            {posterUri ? (
              <Image source={{ uri: posterUri }} style={styles.posterImage} resizeMode="cover" />
            ) : null}

            <View style={styles.infoCol}>
              <Text style={styles.title}>{movie.title}</Text>

              {/* Meta row */}
              <View style={styles.metaRow}>
                <Text style={styles.yearText}>{movie.releaseYear}</Text>
                <View style={[
                  styles.statusTag,
                  movie.status === 'Completed' ? styles.statusCompleted :
                  movie.status === 'Ongoing' ? styles.statusOngoing : styles.statusUpcoming,
                ]}>
                  <Text style={[
                    styles.statusTagText,
                    movie.status === 'Completed' ? styles.textCompleted :
                    movie.status === 'Ongoing' ? styles.textOngoing : styles.textUpcoming,
                  ]}>
                    {movie.status}
                  </Text>
                </View>
              </View>

              {/* Score */}
              <View style={styles.scoreRow}>
                <MaterialIcons name="star" size={18} color="#F4C430" />
                <Text style={styles.scoreText}>{movie.score?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.scoreMax}>/ 10</Text>
              </View>

              {/* Episodes */}
              {movie.episodes > 0 ? (
                <View style={styles.episodesRow}>
                  <MaterialIcons name="movie" size={16} color="#8D6E63" />
                  <Text style={styles.episodesText}>{movie.episodes} episodes</Text>
                </View>
              ) : null}

              {/* Release date */}
              {movie.releaseDate ? (
                <View style={styles.dateRow}>
                  <MaterialIcons name="event" size={16} color="#8D6E63" />
                  <Text style={styles.dateText}>
                    {new Date(movie.releaseDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Favorite & Watchlist Buttons */}
          <View style={styles.section}>
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, isFavorite && styles.actionBtnActive]}
                onPress={handleToggleFavorite}
                disabled={favLoading}
              >
                <MaterialIcons name={isFavorite ? 'favorite' : 'favorite-border'} size={20} color={isFavorite ? '#FFF' : '#E74C3C'} />
                <Text style={[styles.actionBtnText, isFavorite && styles.actionBtnTextActive]}>
                  {isFavorite ? 'Favorited' : 'Favorite'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, watchStatus && styles.actionBtnWlActive]}
                onPress={() => setShowWlDropdown(!showWlDropdown)}
                disabled={wlLoading}
              >
                <MaterialIcons name={watchStatus ? 'bookmark' : 'bookmark-border'} size={20} color={watchStatus ? '#FFF' : '#D35400'} />
                <Text style={[styles.actionBtnText, watchStatus && styles.actionBtnTextActive]}>
                  {wlStatusLabel(watchStatus)}
                </Text>
                {watchStatus && <MaterialIcons name="arrow-drop-down" size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>

            {showWlDropdown && (
              <View style={styles.wlDropdown}>
                {wlDropdownItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.wlDropdownItem,
                      watchStatus === item.key && styles.wlDropdownItemActive,
                    ]}
                    onPress={() => {
                      if (item.key === '__remove__') {
                        handleWlRemove();
                      } else {
                        handleWlSelect(item.key);
                      }
                    }}
                  >
                    <Text style={[styles.wlDropdownItemText, { color: item.color }]}>
                      {item.label}
                    </Text>
                    {watchStatus === item.key && (
                      <MaterialIcons name="check" size={16} color={item.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Genres */}
          {movie.genres?.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genresRow}>
                {movie.genres.map((g) => (
                  <View key={g._id} style={styles.genreChip}>
                    <Text style={styles.genreChipText}>{g.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Description */}
          {movie.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{movie.description}</Text>
            </View>
          ) : null}

          {/* Trailers */}
          {movie.trailers?.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trailers</Text>
              {movie.trailers.map((trailer) => (
                <TouchableOpacity
                  key={trailer._id}
                  style={styles.trailerItem}
                  onPress={() => openTrailer(trailer.url)}
                >
                  <MaterialIcons name="play-circle-outline" size={24} color="#D35400" />
                  <View style={styles.trailerInfo}>
                    <Text style={styles.trailerLabel} numberOfLines={1}>
                      {trailer.label || 'Watch Trailer'}
                    </Text>
                    <Text style={styles.trailerUrl} numberOfLines={1}>
                      {trailer.url}
                    </Text>
                  </View>
                  <MaterialIcons name="open-in-new" size={18} color="#8D6E63" />
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8D6E63',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: '#FBEBE1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  backBtnText: {
    color: '#D35400',
    fontSize: 13,
    fontWeight: '700',
  },

  // Banner
  bannerWrap: {
    width: '100%',
    height: BANNER_HEIGHT,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    backgroundColor: '#2C1810',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  backBtnFloat: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  typeBadge: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: 'rgba(44,24,16,0.85)',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10,
  },
  typeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // Content
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: -60,
  },

  // Poster row
  posterRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  posterImage: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#E8D5C4',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 70,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C1810',
    lineHeight: 26,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  yearText: {
    fontSize: 13,
    color: '#8D6E63',
    fontWeight: '600',
  },
  statusTag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusCompleted: { backgroundColor: '#E8F8F5' },
  statusOngoing: { backgroundColor: '#EBF5FB' },
  statusUpcoming: { backgroundColor: '#FEF9E7' },
  statusTagText: { fontSize: 11, fontWeight: '700' },
  textCompleted: { color: '#16A085' },
  textOngoing: { color: '#2980B9' },
  textUpcoming: { color: '#D4AC0D' },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1810',
  },
  scoreMax: {
    fontSize: 12,
    color: '#BCAAA4',
    fontWeight: '600',
  },

  episodesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  episodesText: {
    fontSize: 13,
    color: '#8D6E63',
    fontWeight: '500',
  },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#8D6E63',
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 10,
  },

  // Genres
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    backgroundColor: '#F5EBE6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  genreChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8D6E63',
  },

  // Description
  description: {
    fontSize: 14,
    color: '#5D4037',
    lineHeight: 22,
  },

  // Trailers
  trailerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5EBE6',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  trailerInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  trailerLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  trailerUrl: {
    fontSize: 11,
    color: '#BCAAA4',
    marginTop: 2,
  },

  // Action Buttons
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  actionBtnActive: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  actionBtnWlActive: {
    backgroundColor: '#D35400',
    borderColor: '#D35400',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  actionBtnTextActive: {
    color: '#FFFFFF',
  },

  // Watchlist Dropdown
  wlDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    marginTop: 6,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  wlDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBE6',
  },
  wlDropdownItemActive: {
    backgroundColor: '#FFF8F0',
  },
  wlDropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
