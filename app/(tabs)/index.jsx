import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getGenres } from '@/src/services/genreService';
import { getMovies } from '@/src/services/movieService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [user, setUser] = useState(null);
  const [genres, setGenres] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drawer States
  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerGenresOpen, setDrawerGenresOpen] = useState(false);
  const [drawerSeasonsOpen, setDrawerSeasonsOpen] = useState(false);

  // Fetch user data and movies/genres when the screen is focused
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadData = async () => {
        try {
          if (isMounted) setLoading(true);
          setError('');

          // Load user info
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            setUser(JSON.parse(userStr));
          }

          // Fetch API data in parallel
          const [fetchedGenres, fetchedTrending] = await Promise.all([
            getGenres(),
            getMovies({ trending: true }),
          ]);

          if (isMounted) {
            setGenres(fetchedGenres);
            setTrendingMovies(fetchedTrending);
          }
        } catch (err) {
          console.error('Home Screen Load Error:', err);
          if (isMounted) {
            setError('Could not connect to server. Check backend.');
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      };

      loadData();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    setMenuVisible(false);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/(auth)/login');
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({
        pathname: '/explore',
        params: { search: searchQuery.trim() },
      });
      setSearchQuery('');
    }
  };

  const handleGenrePress = (genre) => {
    setMenuVisible(false);
    router.push({
      pathname: '/explore',
      params: { genreId: genre._id, genreName: genre.name },
    });
  };

  const handleYearPress = (year) => {
    setMenuVisible(false);
    router.push({
      pathname: '/explore',
      params: { year: year.toString() },
    });
  };

  const renderTrendingCard = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.movieCard}
        onPress={() =>
          router.push({
            pathname: '/explore',
            params: { search: item.title },
          })
        }
      >
        <Image
          source={{ uri: item.image || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60' }}
          style={styles.movieImage}
          resizeMode="cover"
        />
        <View style={styles.scoreBadge}>
          <MaterialIcons name="star" size={12} color="#FFF" />
          <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.movieTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.movieMeta}>
            <Text style={styles.movieYear}>{item.releaseYear}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#D35400" />
        <Text style={styles.loadingText}>Loading home screen...</Text>
      </View>
    );
  }

  // Find featured item (highest score trending movie, or first item)
  const featuredMovie = trendingMovies.length > 0
    ? [...trendingMovies].sort((a, b) => b.score - a.score)[0]
    : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      
      {/* Single Row Header: Team Logo | Search Input | Hamburger Menu (3 gạch) */}
      <View style={styles.singleRowHeader}>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Image
            source={require('@/assets/images/logoapp.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <View style={styles.headerSearchBar}>
          <MaterialIcons name="search" size={18} color="#8D6E63" style={styles.headerSearchIcon} />
          <TextInput
            style={styles.headerSearchInput}
            placeholder="Search movies..."
            placeholderTextColor="#A1887F"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <MaterialIcons name="menu" size={24} color="#D35400" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Error message */}
        {error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={24} color="#E74C3C" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Staff Operations Console — only for staff */}
        {user && user.role === 'staff' && (
          <View style={styles.staffCard}>
            <View style={styles.staffIconContainer}>
              <MaterialIcons name="admin-panel-settings" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.staffTitle}>Staff Console</Text>
              <Text style={styles.staffSubtitle}>Manage data entries and system settings.</Text>
              <TouchableOpacity
                style={styles.staffButton}
                onPress={() => router.push('/manage-genres')}
              >
                <Text style={styles.staffButtonText}>Manage Genres</Text>
                <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.staffButton, { marginTop: 8 }]}
                onPress={() => router.push('/manage-movies')}
              >
                <Text style={styles.staffButtonText}>Manage Movies</Text>
                <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.staffButton, { marginTop: 8 }]}
                onPress={() => router.push('/manage-news')}
              >
                <Text style={styles.staffButtonText}>Manage News</Text>
                <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.staffButton, { marginTop: 8 }]}
                onPress={() => router.push('/manage-reports')}
              >
                <Text style={styles.staffButtonText}>Manage Comments</Text>
                <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Admin Console — only for admin */}
        {user && user.role === 'admin' && (
          <View style={[styles.staffCard, { backgroundColor: '#1A1A2E' }]}>
            <View style={[styles.staffIconContainer, { backgroundColor: '#C0392B' }]}>
              <MaterialIcons name="security" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.staffTitle}>Admin Console</Text>
              <Text style={styles.staffSubtitle}>User management, roles & permissions.</Text>
              <TouchableOpacity
                style={[styles.staffButton, { backgroundColor: '#C0392B' }]}
                onPress={() => router.push('/(admin)')}
              >
                <Text style={styles.staffButtonText}>Open Admin Panel</Text>
                <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Featured Hero Banner */}
        {featuredMovie && (
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: featuredMovie.image }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>FEATURED</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {featuredMovie.title}
              </Text>
              <Text style={styles.heroDescription} numberOfLines={2}>
                {featuredMovie.description}
              </Text>
              <TouchableOpacity
                style={styles.heroButton}
                onPress={() =>
                  router.push({
                    pathname: '/explore',
                    params: { search: featuredMovie.title },
                  })
                }
              >
                <Text style={styles.heroButtonText}>View Details</Text>
                <MaterialIcons name="arrow-right-alt" size={18} color="#D35400" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Trending Anime (US25) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Trending Anime</Text>
        </View>

        {trendingMovies.length > 0 ? (
          <FlatList
            data={trendingMovies}
            renderItem={renderTrendingCard}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="movie-creation" size={40} color="#BCAAA4" />
            <Text style={styles.emptySectionText}>No trending movies found</Text>
          </View>
        )}

      </ScrollView>

      {/* Slide-out Hamburger Menu Modal Drawer (AnimeVietSub Style) */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          {/* Backdrop click to close */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          
          {/* Drawer Panel */}
          <View style={styles.drawerPanel}>
            {/* Profile Card Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.profileRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100' }}
                  style={styles.profileAvatar}
                />
                <Text style={styles.profileName} numberOfLines={1}>
                  {user?.name || 'Guest'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={16} color="#BCAAA4" />
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Menu Items List */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
              
              {/* TRANG CHỦ */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/explore');
                }}
              >
                <Text style={styles.menuItemText}>HOME</Text>
              </TouchableOpacity>



              {/* FAVORITES */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(tabs)/favorites');
                }}
              >
                <Text style={styles.menuItemText}>FAVORITES</Text>
              </TouchableOpacity>

              {/* WATCHLIST */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(tabs)/watchlist');
                }}
              >
                <Text style={styles.menuItemText}>WATCHLIST</Text>
              </TouchableOpacity>
              
              {/* TIN TỨC / NEWS */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/news');
                }}
              >
                <Text style={[styles.menuItemText, { color: '#2980B9' }]}>NEWS</Text>
              </TouchableOpacity>

              {/* THỂ LOẠI (Dropdown) */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setDrawerGenresOpen(!drawerGenresOpen)}
              >
                <Text style={styles.menuItemText}>GENRES</Text>
                <MaterialIcons
                  name={drawerGenresOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color="#FFF"
                />
              </TouchableOpacity>
              
              {/* Toggleable Genre Grid */}
              {drawerGenresOpen && (
                <View style={styles.submenuContainer}>
                  <View style={styles.submenuGrid}>
                    {genres.map((genre) => (
                      <TouchableOpacity
                        key={genre._id}
                        style={styles.submenuItem}
                        onPress={() => handleGenrePress(genre)}
                      >
                        <Text style={styles.submenuItemText} numberOfLines={1}>
                          {genre.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {genres.length === 0 && (
                      <Text style={styles.submenuEmpty}>No genres available</Text>
                    )}
                  </View>
                </View>
              )}

              {/* SEASON (Dropdown) */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => setDrawerSeasonsOpen(!drawerSeasonsOpen)}
              >
                <Text style={styles.menuItemText}>SEASON</Text>
                <MaterialIcons
                  name={drawerSeasonsOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color="#FFF"
                />
              </TouchableOpacity>

              {/* Toggleable Seasons Grid */}
              {drawerSeasonsOpen && (
                <View style={styles.submenuContainer}>
                  <View style={styles.submenuGrid}>
                    {[2024, 2023, 2022, 2019, 2016, 2013, 2001].map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={styles.submenuItem}
                        onPress={() => handleYearPress(year)}
                      >
                        <Text style={styles.submenuItemText}>Year {year}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* STAFF PANEL — only for staff */}
              {user && user.role === 'staff' && (
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/manage-genres');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: '#E67E22' }]}>MANAGE GENRES (STAFF)</Text>
                </TouchableOpacity>
              )}

              {user && user.role === 'staff' && (
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/manage-movies');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: '#E67E22' }]}>MANAGE MOVIES (STAFF)</Text>
                </TouchableOpacity>
              )}

              {user && user.role === 'staff' && (
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/manage-reports');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: '#E67E22' }]}>MANAGE COMMENTS (STAFF)</Text>
                </TouchableOpacity>
              )}
              
              {user && user.role === 'staff' && (
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/manage-news');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: '#E67E22' }]}>MANAGE NEWS (STAFF)</Text>
                </TouchableOpacity>
              )}

              {/* ADMIN PANEL — only for admin */}
              {user && user.role === 'admin' && (
                <TouchableOpacity
                  style={styles.menuItemRow}
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/(admin)');
                  }}
                >
                  <Text style={[styles.menuItemText, { color: '#E74C3C' }]}>ADMIN PANEL</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuVisible(false); router.push('/profile'); }}>
                <Text style={styles.menuItemText}>PROFILE</Text>
              </TouchableOpacity>

            </ScrollView>

            {/* Logout at bottom */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <MaterialIcons name="logout" size={16} color="#FFFFFF" />
                <Text style={styles.logoutBtnText}>LOGOUT</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8D6E63',
    fontWeight: '500',
  },
  singleRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFF8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBE6',
    gap: 12,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  headerSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    paddingHorizontal: 12,
    height: 38,
  },
  headerSearchIcon: {
    marginRight: 6,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#2C1810',
    height: '100%',
    padding: 0,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5EBE6',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDEDEC',
    borderColor: '#F5B7B1',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 16,
    gap: 8,
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  heroContainer: {
    height: 200,
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2C1810',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    justifyContent: 'flex-end',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E67E22',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  heroBadgeText: {
    fontSize: 9,
    color: '#FFF',
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroDescription: {
    fontSize: 12,
    color: '#E0D4CE',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 16,
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  heroButtonText: {
    color: '#D35400',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1810',
  },
  trendingList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  movieCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F5EBE6',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  movieImage: {
    width: '100%',
    height: 180,
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(211, 84, 0, 0.9)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardInfo: {
    padding: 10,
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
  },
  movieMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  movieYear: {
    fontSize: 11,
    color: '#8D6E63',
  },
  statusBadge: {
    backgroundColor: '#E8F8F5',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  statusText: {
    fontSize: 9,
    color: '#16A085',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptySectionText: {
    marginTop: 8,
    fontSize: 13,
    color: '#8D6E63',
  },
  // Slide-out AnimeVietSub Drawer Styles
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawerBackdrop: {
    flex: 1,
  },
  drawerPanel: {
    width: width * 0.75,
    maxWidth: 290,
    height: '100%',
    backgroundColor: '#111115', // Dark background matching screen
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    justifyContent: 'space-between',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#201F29',
    paddingBottom: 16,
    marginBottom: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flex: 1,
    marginRight: 10,
  },
  profileAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#E74C3C', // Red close button like AnimeVietSub web layout
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  drawerScroll: {
    paddingVertical: 10,
  },
  menuItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A22',
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E0E0E6',
    letterSpacing: 0.5,
  },
  submenuContainer: {
    backgroundColor: '#181820',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#20202A',
  },
  submenuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  submenuItem: {
    backgroundColor: '#201E28',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
    alignItems: 'center',
  },
  submenuItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFF',
  },
  submenuEmpty: {
    fontSize: 11,
    color: '#7F8C8D',
    fontStyle: 'italic',
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#201F29',
    paddingTop: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    borderRadius: 6,
    paddingVertical: 10,
    gap: 8,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Staff Console Card
  staffCard: {
    backgroundColor: '#2C1810',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  staffIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(211, 84, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  staffInfo: {
    flex: 1,
  },
  staffTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  staffSubtitle: {
    fontSize: 12,
    color: '#BCAAA4',
    marginTop: 2,
    marginBottom: 12,
  },
  staffButton: {
    backgroundColor: '#D35400',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  staffButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
