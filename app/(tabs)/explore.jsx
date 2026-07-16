import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Keyboard,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getGenres } from '@/src/services/genreService';
import { getMovies } from '@/src/services/movieService';

const { width } = Dimensions.get('window');

export default function ExploreScreen() {
  const params = useLocalSearchParams();
  const consumedParamsRef = useRef({ genreId: '', search: '' });

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [minScore, setMinScore] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // 4 items per page to show pagination clearly

  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [genres, setGenres] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  // Drawer States
  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerGenresOpen, setDrawerGenresOpen] = useState(false);
  const [drawerSeasonsOpen, setDrawerSeasonsOpen] = useState(false);

  // Fetch genres and user on mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [genresData, userStr] = await Promise.all([
          getGenres(),
          AsyncStorage.getItem('user'),
        ]);
        setGenres(genresData);
        if (userStr) {
          setUser(JSON.parse(userStr));
        }
      } catch (err) {
        console.error('Error initializing Explore Screen:', err);
      }
    };
    initData();
  }, []);

  // Listen to router params (e.g. redirected from Home screen)
  useEffect(() => {
    if (params.genreId && params.genreId !== consumedParamsRef.current.genreId) {
      setSelectedGenre(params.genreId);
      consumedParamsRef.current.genreId = params.genreId;
    }
    if (params.search && params.search !== consumedParamsRef.current.search) {
      setSearchQuery(params.search);
      consumedParamsRef.current.search = params.search;
    }
    if (params.year) {
      setSelectedYear(params.year);
    }
  }, [params.genreId, params.search, params.year]);

  // Reset pagination page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, selectedYear, minScore, selectedStatus]);

  // Execute movie search when filters or search query changes
  useEffect(() => {
    let isMounted = true;

    const performSearch = async () => {
      try {
        if (isMounted) setLoading(true);
        setError('');

        const filterParams = {
          search: searchQuery,
          genre: selectedGenre || undefined,
          year: selectedYear ? parseInt(selectedYear) : undefined,
          score: minScore ? parseFloat(minScore) : undefined,
          status: selectedStatus || undefined,
        };

        const data = await getMovies(filterParams);
        if (isMounted) {
          setMovies(data);
        }
      } catch (err) {
        console.error('Search error:', err);
        if (isMounted) {
          setError('Could not connect to server.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      performSearch();
    }, 300); // Debounce to prevent rapid requests during typing

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery, selectedGenre, selectedYear, minScore, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedGenre('');
    setSelectedYear('');
    setMinScore('');
    setSelectedStatus('');
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/(auth)/login');
  };

  const handleGenrePress = (genre) => {
    setMenuVisible(false);
    setSelectedGenre(genre._id);
  };

  const handleYearPress = (year) => {
    setMenuVisible(false);
    setSelectedYear(year.toString());
  };

  const totalPages = Math.ceil(movies.length / itemsPerPage);
  const paginatedMovies = movies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderMovieItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.movieItemCard}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/movie-detail', params: { id: item._id } })}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.poster || item.image || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60' }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          {/* Rating score badge */}
          <View style={styles.ratingBadge}>
            <MaterialIcons name="star" size={12} color="#FFF" />
            <Text style={styles.ratingText}>{item.score.toFixed(1)}</Text>
          </View>
          {/* Type Badge */}
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardYear}>Year: {item.releaseYear}</Text>
            <View style={[
              styles.statusTag,
              item.status === 'Completed' ? styles.statusCompleted :
              item.status === 'Ongoing' ? styles.statusOngoing : styles.statusUpcoming
            ]}>
              <Text style={[
                styles.statusTagText,
                item.status === 'Completed' ? styles.textCompleted :
                item.status === 'Ongoing' ? styles.textOngoing : styles.textUpcoming
              ]}>
                {item.status}
              </Text>
            </View>
          </View>

          {/* Genre list tags */}
          <View style={styles.genresList}>
            {item.genres.map((g) => (
              <View key={g._id} style={styles.genreMiniTag}>
                <Text style={styles.genreMiniText}>{g.name}</Text>
              </View>
            ))}
          </View>

          {item.description ? (
            <Text style={styles.cardDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaginationFooter = () => {
    if (movies.length === 0) return null;
    return (
      <View style={styles.paginationContainer}>
        {/* Previous page button */}
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
          onPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <MaterialIcons
            name="chevron-left"
            size={20}
            color={currentPage === 1 ? '#BCAAA4' : '#D35400'}
          />
        </TouchableOpacity>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <TouchableOpacity
            key={page}
            style={[styles.pageNumberBtn, currentPage === page && styles.pageNumberBtnActive]}
            onPress={() => setCurrentPage(page)}
          >
            <Text style={[styles.pageNumberText, currentPage === page && styles.pageNumberTextActive]}>
              {page}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Next page button */}
        <TouchableOpacity
          style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
          onPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={currentPage === totalPages ? '#BCAAA4' : '#D35400'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      
      {/* Single Row Header: Team Logo | Search Input | Hamburger Menu (Consistent with Home) */}
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
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <MaterialIcons name="close" size={18} color="#8D6E63" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <MaterialIcons name="menu" size={24} color="#D35400" />
        </TouchableOpacity>
      </View>

      {/* Genre Navigation Scrollable Tabs Bar + Dedicated Filters Button */}
      <View style={styles.genreTabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genreTabsScroll}
        >
          {/* Filters Toggle Pill */}
          <TouchableOpacity
            style={[styles.filterPill, showFilters && styles.filterPillActive]}
            onPress={() => {
              Keyboard.dismiss();
              setShowFilters(!showFilters);
            }}
          >
            <MaterialIcons name="tune" size={16} color={showFilters ? '#FFF' : '#D35400'} style={styles.pillIcon} />
            <Text style={[styles.filterPillText, showFilters && styles.filterPillTextActive]}>
              Filters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genreTab, selectedGenre === '' && styles.genreTabActive]}
            onPress={() => setSelectedGenre('')}
          >
            <Text style={[styles.genreTabText, selectedGenre === '' && styles.genreTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {genres.map((genre) => {
            const isActive = selectedGenre === genre._id;
            return (
              <TouchableOpacity
                key={genre._id}
                style={[styles.genreTab, isActive && styles.genreTabActive]}
                onPress={() => setSelectedGenre(genre._id)}
              >
                <Text style={[styles.genreTabText, isActive && styles.genreTabTextActive]}>
                  {genre.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Advanced Filter Drawer (US23) */}
      {showFilters && (
        <View style={styles.filterDrawer}>
          <ScrollView nestedScrollEnabled={true} style={styles.filterDrawerScroll}>
            <View style={styles.filterRow}>
              {/* Year Filter */}
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Release Year</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="e.g. 2024"
                  placeholderTextColor="#BCAAA4"
                  keyboardType="numeric"
                  value={selectedYear}
                  onChangeText={setSelectedYear}
                />
              </View>

              {/* Score Filter */}
              <View style={styles.filterCol}>
                <Text style={styles.filterLabel}>Minimum Score</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="e.g. 8.5"
                  placeholderTextColor="#BCAAA4"
                  keyboardType="decimal-pad"
                  value={minScore}
                  onChangeText={setMinScore}
                />
              </View>
            </View>

            {/* Status Filter */}
            <Text style={styles.filterLabel}>Status</Text>
            <View style={styles.statusButtonsRow}>
              {['Upcoming', 'Ongoing', 'Completed'].map((status) => {
                const isSelected = selectedStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[styles.statusBtn, isSelected && styles.statusBtnSelected]}
                    onPress={() => setSelectedStatus(isSelected ? '' : status)}
                  >
                    <Text style={[styles.statusBtnText, isSelected && styles.statusBtnTextActive]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleResetFilters}>
                <MaterialIcons name="refresh" size={16} color="#8D6E63" />
                <Text style={styles.resetBtnText}>Reset Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyBtn} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Main Movie List */}
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#D35400" />
          <Text style={styles.infoText}>Searching...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : movies.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="search-off" size={48} color="#BCAAA4" />
          <Text style={styles.emptyText}>No movies found</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleResetFilters}>
            <Text style={styles.retryBtnText}>Reset filter values</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={paginatedMovies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={renderPaginationFooter}
        />
      )}

      {/* Slide-out Hamburger Menu Modal Drawer (Consistent with Home) */}
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
              
              {/* HOME */}
              <TouchableOpacity
                style={styles.menuItemRow}
                onPress={() => {
                  setMenuVisible(false);
                  router.push('/(tabs)');
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

              {/* GENRES (Dropdown) */}
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
  clearSearchBtn: {
    padding: 4,
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
  genreTabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBE6',
    height: 48,
  },
  genreTabsScroll: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 16,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D35400',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 4,
  },
  filterPillActive: {
    backgroundColor: '#D35400',
  },
  pillIcon: {
    marginRight: 4,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D35400',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  genreTab: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  genreTabActive: {
    borderBottomColor: '#D35400',
  },
  genreTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8D6E63',
  },
  genreTabTextActive: {
    color: '#D35400',
    fontWeight: '700',
  },
  filterDrawer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8D5C4',
    maxHeight: 340,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  filterDrawerScroll: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  filterCol: {
    flex: 1,
  },
  filterInput: {
    backgroundColor: '#FFF8F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#2C1810',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusBtn: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8D5C4',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBtnSelected: {
    backgroundColor: '#E67E22',
    borderColor: '#E67E22',
  },
  statusBtnText: {
    fontSize: 12,
    color: '#8D6E63',
    fontWeight: '600',
  },
  statusBtnTextActive: {
    color: '#FFFFFF',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5EBE6',
    paddingTop: 12,
    paddingBottom: 8,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  resetBtnText: {
    fontSize: 13,
    color: '#8D6E63',
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#D35400',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  infoText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8D6E63',
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#8D6E63',
  },
  retryBtn: {
    backgroundColor: '#FBEBE1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  retryBtnText: {
    color: '#D35400',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  movieItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#F5EBE6',
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  imageContainer: {
    width: 110,
    height: 150,
    position: 'relative',
    backgroundColor: '#E8D5C4',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(211, 84, 0, 0.9)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(44, 24, 16, 0.85)',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2C1810',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  cardYear: {
    fontSize: 12,
    color: '#8D6E63',
  },
  statusTag: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  statusCompleted: {
    backgroundColor: '#E8F8F5',
  },
  statusOngoing: {
    backgroundColor: '#EBF5FB',
  },
  statusUpcoming: {
    backgroundColor: '#FEF9E7',
  },
  statusTagText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textCompleted: {
    color: '#16A085',
  },
  textOngoing: {
    color: '#2980B9',
  },
  textUpcoming: {
    color: '#D4AC0D',
  },
  genresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  genreMiniTag: {
    backgroundColor: '#F5EBE6',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  genreMiniText: {
    fontSize: 10,
    color: '#8D6E63',
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 11,
    color: '#8D6E63',
    marginTop: 6,
    lineHeight: 15,
  },
  // Pagination Container styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5EBE6',
    marginTop: 10,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D5C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageBtnDisabled: {
    backgroundColor: '#FFFBF9',
    borderColor: '#F5EBE6',
    opacity: 0.6,
  },
  pageNumberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8D5C4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumberBtnActive: {
    backgroundColor: '#D35400',
    borderColor: '#D35400',
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8D6E63',
  },
  pageNumberTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Slide-out Drawer Styles (AnimeVietSub)
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
    backgroundColor: '#111115',
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
    backgroundColor: '#E74C3C',
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
});
