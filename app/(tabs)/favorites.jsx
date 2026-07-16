import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getFavorites, removeFavorite } from '@/src/services/favoriteService';
import { getGenres } from '@/src/services/genreService';

const { width } = Dimensions.get('window');

export default function FavoritesScreen() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [genres, setGenres] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [drawerGenresOpen, setDrawerGenresOpen] = useState(false);
  const [drawerSeasonsOpen, setDrawerSeasonsOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [userStr, genresData] = await Promise.all([
        AsyncStorage.getItem('user'),
        getGenres(),
      ]);
      if (userStr) setUser(JSON.parse(userStr));
      setGenres(genresData);

      const token = await AsyncStorage.getItem('token');
      if (token) {
        const data = await getFavorites();
        setMovies(data);
      } else {
        setMovies([]);
      }
    } catch {
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (movieId) => {
    try {
      await removeFavorite(movieId);
      setMovies((prev) => prev.filter((m) => m._id !== movieId));
    } catch {}
  };

  const handleLogout = async () => {
    setMenuVisible(false);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/(auth)/login');
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/(tabs)/explore', params: { search: searchQuery.trim() } });
      setSearchQuery('');
    }
  };

  const handleGenrePress = (genre) => {
    setMenuVisible(false);
    router.push({ pathname: '/(tabs)/explore', params: { genreId: genre._id, genreName: genre.name } });
  };

  const handleYearPress = (year) => {
    setMenuVisible(false);
    router.push({ pathname: '/(tabs)/explore', params: { year: year.toString() } });
  };

  const renderItem = ({ item }) => (
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
        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={12} color="#FFF" />
          <Text style={styles.ratingText}>{item.score?.toFixed(1)}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardYear}>Year: {item.releaseYear}</Text>
          <View style={[styles.statusTag, item.status === 'Completed' ? styles.statusCompleted : item.status === 'Ongoing' ? styles.statusOngoing : styles.statusUpcoming]}>
            <Text style={[styles.statusTagText, item.status === 'Completed' ? styles.textCompleted : item.status === 'Ongoing' ? styles.textOngoing : styles.textUpcoming]}>
              {item.status}
            </Text>
          </View>
        </View>
        <View style={styles.genresList}>
          {(item.genres || []).map((g) => (
            <View key={g._id} style={styles.genreMiniTag}>
              <Text style={styles.genreMiniText}>{g.name}</Text>
            </View>
          ))}
        </View>
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item._id)}>
          <MaterialIcons name="favorite" size={16} color="#E74C3C" />
          <Text style={styles.removeBtnText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      {/* Header */}
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Favorites</Text>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#D35400" />
        </View>
      ) : movies.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="favorite-border" size={64} color="#BCAAA4" />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubText}>Tap the heart icon on a movie to add it here</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)/explore')}>
            <Text style={styles.browseBtnText}>Browse Movies</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Drawer Menu */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerBackdrop} activeOpacity={1} onPress={() => setMenuVisible(false)} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerHeader}>
              <View style={styles.profileRow}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=100' }}
                  style={styles.profileAvatar}
                />
                <Text style={styles.profileName} numberOfLines={1}>{user?.name || 'Guest'}</Text>
                <MaterialIcons name="keyboard-arrow-down" size={16} color="#BCAAA4" />
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuVisible(false); router.push('/(tabs)'); }}>
                <Text style={styles.menuItemText}>HOME</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuVisible(false); router.push('/(tabs)/explore'); }}>
                <Text style={styles.menuItemText}>EXPLORE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuItemRow, { borderBottomColor: '#D35400' }]} onPress={() => setMenuVisible(false)}>
                <Text style={[styles.menuItemText, { color: '#D35400' }]}>FAVORITES</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuVisible(false); router.push('/(tabs)/watchlist'); }}>
                <Text style={styles.menuItemText}>WATCHLIST</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItemRow} onPress={() => setDrawerGenresOpen(!drawerGenresOpen)}>
                <Text style={styles.menuItemText}>GENRES</Text>
                <MaterialIcons name={drawerGenresOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#FFF" />
              </TouchableOpacity>
              {drawerGenresOpen && (
                <View style={styles.submenuContainer}>
                  <View style={styles.submenuGrid}>
                    {genres.map((genre) => (
                      <TouchableOpacity key={genre._id} style={styles.submenuItem} onPress={() => handleGenrePress(genre)}>
                        <Text style={styles.submenuItemText} numberOfLines={1}>{genre.name}</Text>
                      </TouchableOpacity>
                    ))}
                    {genres.length === 0 && <Text style={styles.submenuEmpty}>No genres available</Text>}
                  </View>
                </View>
              )}

              <TouchableOpacity style={styles.menuItemRow} onPress={() => setDrawerSeasonsOpen(!drawerSeasonsOpen)}>
                <Text style={styles.menuItemText}>SEASON</Text>
                <MaterialIcons name={drawerSeasonsOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#FFF" />
              </TouchableOpacity>
              {drawerSeasonsOpen && (
                <View style={styles.submenuContainer}>
                  <View style={styles.submenuGrid}>
                    {[2024, 2023, 2022, 2019, 2016, 2013, 2001].map((year) => (
                      <TouchableOpacity key={year} style={styles.submenuItem} onPress={() => handleYearPress(year)}>
                        <Text style={styles.submenuItemText}>Year {year}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {user && user.role === 'staff' && (
                <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuVisible(false); router.push('/manage-genres'); }}>
                  <Text style={[styles.menuItemText, { color: '#E67E22' }]}>MANAGE GENRES (STAFF)</Text>
                </TouchableOpacity>
              )}
              {user && user.role === 'staff' && (
                <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuVisible(false); router.push('/manage-movies'); }}>
                  <Text style={[styles.menuItemText, { color: '#E67E22' }]}>MANAGE MOVIES (STAFF)</Text>
                </TouchableOpacity>
              )}
              {user && user.role === 'admin' && (
                <TouchableOpacity style={styles.menuItemRow} onPress={() => { setMenuVisible(false); router.push('/(admin)'); }}>
                  <Text style={[styles.menuItemText, { color: '#E74C3C' }]}>ADMIN PANEL</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

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
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  singleRowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, backgroundColor: '#FFF8F0', borderBottomWidth: 1, borderBottomColor: '#F5EBE6', gap: 12 },
  headerLogo: { width: 38, height: 38, borderRadius: 8 },
  headerSearchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E8D5C4', paddingHorizontal: 12, height: 38 },
  headerSearchIcon: { marginRight: 6 },
  headerSearchInput: { flex: 1, fontSize: 13, color: '#2C1810', height: '100%', padding: 0 },
  menuButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F5EBE6', shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C1810' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { marginTop: 16, fontSize: 16, fontWeight: '700', color: '#8D6E63' },
  emptySubText: { marginTop: 6, fontSize: 13, color: '#BCAAA4', textAlign: 'center' },
  browseBtn: { backgroundColor: '#D35400', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10, marginTop: 20 },
  browseBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  listContent: { padding: 20, gap: 16 },
  movieItemCard: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: '#F5EBE6', shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  imageContainer: { width: 110, height: 150, position: 'relative', backgroundColor: '#E8D5C4' },
  cardImage: { width: '100%', height: '100%' },
  ratingBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(211, 84, 0, 0.9)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1.5, flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  typeBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(44, 24, 16, 0.85)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1.5 },
  typeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800' },
  cardContent: { flex: 1, padding: 12, justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1810' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  cardYear: { fontSize: 12, color: '#8D6E63' },
  statusTag: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  statusCompleted: { backgroundColor: '#E8F8F5' },
  statusOngoing: { backgroundColor: '#EBF5FB' },
  statusUpcoming: { backgroundColor: '#FEF9E7' },
  statusTagText: { fontSize: 9, fontWeight: '700' },
  textCompleted: { color: '#16A085' },
  textOngoing: { color: '#2980B9' },
  textUpcoming: { color: '#D4AC0D' },
  genresList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  genreMiniTag: { backgroundColor: '#F5EBE6', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  genreMiniText: { fontSize: 10, color: '#8D6E63', fontWeight: '600' },
  cardDesc: { fontSize: 11, color: '#8D6E63', marginTop: 6, lineHeight: 15 },
  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  removeBtnText: { fontSize: 12, color: '#E74C3C', fontWeight: '600' },
  // Drawer
  drawerOverlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  drawerBackdrop: { flex: 1 },
  drawerPanel: { width: width * 0.75, maxWidth: 290, height: '100%', backgroundColor: '#111115', padding: 18, shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8, justifyContent: 'space-between' },
  drawerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#201F29', paddingBottom: 16, marginBottom: 10 },
  profileRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E24', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, flex: 1, marginRight: 10 },
  profileAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  profileName: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', flex: 1, marginRight: 4 },
  closeBtn: { width: 36, height: 36, backgroundColor: '#E74C3C', justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  drawerScroll: { paddingVertical: 10 },
  menuItemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1A1A22' },
  menuItemText: { fontSize: 13, fontWeight: '700', color: '#E0E0E6', letterSpacing: 0.5 },
  submenuContainer: { backgroundColor: '#181820', padding: 12, borderRadius: 8, marginTop: 4, marginBottom: 8, borderWidth: 1, borderColor: '#20202A' },
  submenuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  submenuItem: { backgroundColor: '#201E28', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, minWidth: 70, alignItems: 'center' },
  submenuItemText: { fontSize: 11, fontWeight: '600', color: '#FFF' },
  submenuEmpty: { fontSize: 11, color: '#7F8C8D', fontStyle: 'italic' },
  drawerFooter: { borderTopWidth: 1, borderTopColor: '#201F29', paddingTop: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#E74C3C', borderRadius: 6, paddingVertical: 10, gap: 8 },
  logoutBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
});
