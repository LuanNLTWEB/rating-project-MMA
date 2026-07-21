import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Modal,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  getMoviesForStaff,
  createMovie,
  updateMovie,
  deleteMovie,
  toggleMovieVisibility,
  uploadPoster,
  uploadBanner,
  addTrailer,
  updateTrailer,
  deleteTrailer,
} from '@/src/services/movieService';
import { getGenres } from '@/src/services/genreService';

const TYPES = ['ova', 'movie', 'tv series', 'specials'];
const STATUSES = ['upcoming', 'ongoing', 'completed'];

function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ManageMoviesScreen() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Main create/edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedMovie, setSelectedMovie] = useState(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('tv series');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [releaseDate, setReleaseDate] = useState(formatDate(new Date()));
  const [totalEpisodes, setTotalEpisodes] = useState('');
  const [status, setStatus] = useState('ongoing');
  const [poster, setPoster] = useState('');
  const [banner, setBanner] = useState('');
  const [summary, setSummary] = useState('');
  const [authors, setAuthors] = useState('');
  const [producers, setProducers] = useState('');
  const [studios, setStudios] = useState('');
  const [trending, setTrending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Trailer management modal
  const [trailerModalVisible, setTrailerModalVisible] = useState(false);
  const [trailerMode, setTrailerMode] = useState('add');
  const [editingTrailerId, setEditingTrailerId] = useState('');
  const [trailerLabel, setTrailerLabel] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [trailerFormError, setTrailerFormError] = useState('');
  const [savingTrailer, setSavingTrailer] = useState(false);
  const [currentTrailers, setCurrentTrailers] = useState([]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [movieData, genreData] = await Promise.all([
        getMoviesForStaff(),
        getGenres(),
      ]);
      setMovies(movieData);
      setGenres(genreData);
    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You do not have permission to access this page. Staff credentials required.');
        Alert.alert('Access Denied', 'Session expired or you do not have staff permissions.', [
          { text: 'Go Back', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        setError('Could not connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkRole = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role !== 'staff' && user.role !== 'admin') {
          Alert.alert('Unauthorized', 'This screen is for Staff only.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
          return;
        }
      }
      fetchAllData();
    };
    checkRole();
  }, []);

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setType('tv series');
    setSelectedGenres([]);
    setReleaseDate(formatDate(new Date()));
    setTotalEpisodes('');
    setStatus('ongoing');
    setPoster('');
    setBanner('');
    setAuthors('');
    setProducers('');
    setStudios('');
    setTrending(false);
    setFormError('');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedMovie(null);
    setCurrentTrailers([]);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (movie) => {
    setModalMode('edit');
    setSelectedMovie(movie);
    setTitle(movie.title || movie.name || '');
    setSummary(movie.summary || '');
    setType(movie.type || 'tv series');
    setSelectedGenres((movie.genres || []).map((g) => (g._id ? g._id : g)));
    setReleaseDate(
      movie.releaseDate ? formatDate(movie.releaseDate) : formatDate(new Date())
    );
    setTotalEpisodes(movie.totalEpisodes !== undefined ? String(movie.totalEpisodes) : '');
    setStatus(movie.status || 'ongoing');
    setPoster(movie.poster || '');
    setBanner(movie.banner || '');
    setAuthors((movie.authors || []).join(', '));
    setProducers((movie.producers || []).join(', '));
    setStudios((movie.studios || []).join(', '));
    setTrending(movie.trending || false);
    setCurrentTrailers(movie.trailers || []);
    setFormError('');
    setModalVisible(true);
  };

  const toggleGenre = (id) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setFormError('');
    if (!title.trim()) {
      setFormError('Please enter the movie title.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: title.trim(),
      name: title.trim(),
      summary: summary.trim(),
      type,
      genres: selectedGenres,
      releaseDate,
      totalEpisodes: totalEpisodes ? Number(totalEpisodes) : 0,
      status,
      poster,
      banner,
      authors: authors.split(',').map(s => s.trim()).filter(Boolean),
      producers: producers.split(',').map(s => s.trim()).filter(Boolean),
      studios: studios.split(',').map(s => s.trim()).filter(Boolean),
      trending,
    };
    try {
      if (modalMode === 'create') {
        await createMovie(payload);
        Alert.alert('Success', `Added "${title.trim()}"`);
      } else {
        await updateMovie(selectedMovie._id, payload);
        Alert.alert('Success', 'Updated movie information');
      }
      setModalVisible(false);
      fetchAllData();
    } catch (err) {
      console.error('Error saving movie:', err);
      setFormError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPoster = async () => {
    if (!poster.trim()) {
      setFormError('Enter a poster image URL first.');
      return;
    }
    if (!selectedMovie) return;
    try {
      const res = await uploadPoster(selectedMovie._id, poster.trim());
      setSelectedMovie(res.movie);
      Alert.alert('Success', 'Poster uploaded');
    } catch (err) {
      console.error('Upload poster error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Could not upload poster.');
    }
  };

  const handleUploadBanner = async () => {
    if (!banner.trim()) {
      setFormError('Enter a banner image URL first.');
      return;
    }
    if (!selectedMovie) return;
    try {
      const res = await uploadBanner(selectedMovie._id, banner.trim());
      setSelectedMovie(res.movie);
      Alert.alert('Success', 'Banner uploaded');
    } catch (err) {
      console.error('Upload banner error:', err);
      Alert.alert('Error', err.response?.data?.message || 'Could not upload banner.');
    }
  };

  const handleToggleVisibility = async (movie) => {
    try {
      const res = await toggleMovieVisibility(movie._id);
      setMovies((prev) =>
        prev.map((m) => (m._id === movie._id ? { ...m, visible: res.movie.visible } : m))
      );
    } catch (err) {
      console.error('Toggle visibility error:', err);
      Alert.alert('Error', 'Could not update visibility status.');
    }
  };

  const handleDelete = (movie) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${movie.title}" from the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMovie(movie._id);
              Alert.alert('Success', `Deleted "${movie.title}"`);
              fetchAllData();
            } catch (err) {
              console.error('Delete movie error:', err);
              Alert.alert('Error', 'Could not delete this movie.');
            }
          },
        },
      ]
    );
  };

  // Trailer handlers
  const openAddTrailer = () => {
    setTrailerMode('add');
    setEditingTrailerId('');
    setTrailerLabel('');
    setTrailerUrl('');
    setTrailerFormError('');
    setTrailerModalVisible(true);
  };

  const openEditTrailer = (index) => {
    setTrailerMode('edit');
    setEditingTrailerId(String(index));
    setTrailerLabel('');
    setTrailerUrl(currentTrailers[index] || '');
    setTrailerFormError('');
    setTrailerModalVisible(true);
  };

  const handleSaveTrailer = async () => {
    setTrailerFormError('');
    if (!trailerUrl.trim()) {
      setTrailerFormError('Trailer URL is required.');
      return;
    }
    setSavingTrailer(true);
    try {
      const data = { url: trailerUrl.trim() };
      const res =
        trailerMode === 'add'
          ? await addTrailer(selectedMovie._id, data)
          : await updateTrailer(selectedMovie._id, editingTrailerId, data);
      setSelectedMovie(res.movie);
      setCurrentTrailers(res.movie.trailers);
      setTrailerModalVisible(false);
    } catch (err) {
      console.error('Save trailer error:', err);
      setTrailerFormError(err.response?.data?.message || 'Could not save trailer.');
    } finally {
      setSavingTrailer(false);
    }
  };

  const handleDeleteTrailer = (index) => {
    Alert.alert('Delete Trailer', 'Remove this trailer link?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await deleteTrailer(selectedMovie._id, String(index));
            setSelectedMovie(res.movie);
            setCurrentTrailers(res.movie.trailers);
          } catch (err) {
            console.error('Delete trailer error:', err);
            Alert.alert('Error', 'Could not delete trailer.');
          }
        },
      },
    ]);
  };

  const renderMovieItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri:
            item.poster ||
            'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=60',
        }}
        style={styles.cardThumb}
        resizeMode="cover"
      />
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, item.visible ? styles.statusVisible : styles.statusHidden]}>
            <Text style={[styles.statusText, item.visible ? styles.textVisible : styles.textHidden]}>
              {item.visible ? 'Visible' : 'Hidden'}
            </Text>
          </View>
        </View>
        <View style={styles.cardMetaRow}>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{item.type?.toUpperCase()}</Text>
          </View>
          <Text style={styles.cardStatus}>{item.status}</Text>
          {item.totalEpisodes ? <Text style={styles.cardEp}>• {item.totalEpisodes} eps</Text> : null}
        </View>
        <Text style={styles.cardYear}>
          Released: {item.releaseDate ? formatDate(item.releaseDate) : ''}
        </Text>
        {item.trailers && item.trailers.length > 0 ? (
          <Text style={styles.cardTrailers}>{item.trailers.length} trailer(s)</Text>
        ) : null}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.visibilityBtn]} onPress={() => handleToggleVisibility(item)}>
          <MaterialIcons name={item.visible ? 'visibility' : 'visibility-off'} size={20} color={item.visible ? '#16A085' : '#7F8C8D'} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => openEditModal(item)}>
          <MaterialIcons name="edit" size={20} color="#D35400" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
          <MaterialIcons name="delete" size={20} color="#C0392B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Movies</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#D35400" />
          <Text style={styles.infoText}>Loading movies...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAllData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : movies.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="movie" size={48} color="#BCAAA4" />
          <Text style={styles.emptyText}>No movies in system</Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={openCreateModal}>
            <Text style={styles.createFirstBtnText}>Add First Movie</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={movies}
          renderItem={renderMovieItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchAllData}
        />
      )}

      {/* Create / Edit Movie Modal */}
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalMode === 'create' ? 'Add New Movie' : 'Edit Movie'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8D6E63" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput style={styles.textInput} placeholder="Movie / Anime title" placeholderTextColor="#BCAAA4" value={title} onChangeText={setTitle} />

              <Text style={styles.inputLabel}>Summary</Text>
              <TextInput style={[styles.textInput, styles.textArea]} placeholder="Short summary..." placeholderTextColor="#BCAAA4" value={summary} onChangeText={setSummary} multiline numberOfLines={2} />

              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.segmentRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity key={t} style={[styles.segment, type === t && styles.segmentActive]} onPress={() => setType(t)}>
                    <Text style={[styles.segmentText, type === t && styles.segmentTextActive]}>{t.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Genres</Text>
              <View style={styles.chipWrap}>
                {genres.map((g) => {
                  const active = selectedGenres.includes(g._id);
                  return (
                    <TouchableOpacity key={g._id} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleGenre(g._id)}>
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{g.name}</Text>
                    </TouchableOpacity>
                  );
                })}
                {genres.length === 0 ? <Text style={styles.hint}>No genres available</Text> : null}
              </View>

              <Text style={styles.inputLabel}>Authors (comma separated)</Text>
              <TextInput style={styles.textInput} placeholder="Author 1, Author 2, ..." placeholderTextColor="#BCAAA4" value={authors} onChangeText={setAuthors} />

              <Text style={styles.inputLabel}>Producers (comma separated)</Text>
              <TextInput style={styles.textInput} placeholder="Producer 1, Producer 2, ..." placeholderTextColor="#BCAAA4" value={producers} onChangeText={setProducers} />

              <Text style={styles.inputLabel}>Studios (comma separated)</Text>
              <TextInput style={styles.textInput} placeholder="Studio 1, Studio 2, ..." placeholderTextColor="#BCAAA4" value={studios} onChangeText={setStudios} />

              <Text style={styles.inputLabel}>Release Date</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                <MaterialIcons name="calendar-today" size={18} color="#8D6E63" />
                <Text style={styles.dateButtonText}>{releaseDate || 'Select date'}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={releaseDate ? new Date(releaseDate) : new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selected) => {
                    setShowDatePicker(false);
                    if (selected) setReleaseDate(formatDate(selected));
                  }}
                />
              )}

              <View style={styles.row}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Episodes</Text>
                  <TextInput style={styles.textInput} placeholder="0" placeholderTextColor="#BCAAA4" value={totalEpisodes} onChangeText={setTotalEpisodes} keyboardType="numeric" />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Status</Text>
                  <View style={styles.segmentRow}>
                    {STATUSES.map((s) => (
                      <TouchableOpacity key={s} style={[styles.segmentSm, status === s && styles.segmentActive]} onPress={() => setStatus(s)}>
                        <Text style={[styles.segmentText, status === s && styles.segmentTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  onPress={() => setTrending(!trending)}
                  style={[
                    styles.segment,
                    { flex: 0, paddingHorizontal: 16, paddingVertical: 10 },
                    trending && { backgroundColor: '#D35400', borderColor: '#D35400' },
                  ]}
                >
                  <MaterialIcons name="trending-up" size={18} color={trending ? '#FFF' : '#2C1810'} />
                  <Text style={[styles.segmentText, trending && styles.segmentTextActive, { marginLeft: 4 }]}>
                    Trending
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Poster */}
              <Text style={styles.inputLabel}>Poster Image URL</Text>
              <TextInput style={styles.textInput} placeholder="https://.../poster.jpg" placeholderTextColor="#BCAAA4" value={poster} onChangeText={setPoster} autoCapitalize="none" />
              {poster ? <Image source={{ uri: poster }} style={styles.previewImage} resizeMode="cover" /> : null}
              {modalMode === 'edit' ? (
                <TouchableOpacity style={styles.uploadBtn} onPress={handleUploadPoster}>
                  <MaterialIcons name="cloud-upload" size={18} color="#FFF" />
                  <Text style={styles.uploadBtnText}>Upload Poster</Text>
                </TouchableOpacity>
              ) : null}

              {/* Banner */}
              <Text style={styles.inputLabel}>Banner Image URL</Text>
              <TextInput style={styles.textInput} placeholder="https://.../banner.jpg" placeholderTextColor="#BCAAA4" value={banner} onChangeText={setBanner} autoCapitalize="none" />
              {banner ? <Image source={{ uri: banner }} style={[styles.previewImage, styles.previewBanner]} resizeMode="cover" /> : null}
              {modalMode === 'edit' ? (
                <TouchableOpacity style={[styles.uploadBtn, styles.uploadBtnAlt]} onPress={handleUploadBanner}>
                  <MaterialIcons name="cloud-upload" size={18} color="#FFF" />
                  <Text style={styles.uploadBtnText}>Upload Banner</Text>
                </TouchableOpacity>
              ) : null}

              {/* Trailers (edit mode) */}
              {modalMode === 'edit' ? (
                <View style={styles.trailerSection}>
                  <View style={styles.trailerHeader}>
                    <Text style={styles.inputLabel}>Trailer Links</Text>
                    <TouchableOpacity style={styles.addTrailerBtn} onPress={openAddTrailer}>
                      <MaterialIcons name="add" size={18} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                  {currentTrailers.length === 0 ? (
                    <Text style={styles.hint}>No trailers yet.</Text>
                  ) : (
                    currentTrailers.map((url, idx) => (
                      <View key={idx} style={styles.trailerItem}>
                        <View style={styles.trailerInfo}>
                          <Text style={styles.trailerLabel} numberOfLines={1}>Trailer {idx + 1}</Text>
                          <Text style={styles.trailerUrl} numberOfLines={1}>{url}</Text>
                        </View>
                        <View style={styles.trailerActions}>
                          <TouchableOpacity style={styles.trailerEdit} onPress={() => openEditTrailer(idx)}>
                            <MaterialIcons name="edit" size={18} color="#D35400" />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.trailerDelete} onPress={() => handleDeleteTrailer(idx)}>
                            <MaterialIcons name="delete" size={18} color="#C0392B" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              ) : null}

              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerBtn, styles.saveBtn, submitting && styles.btnDisabled]} onPress={handleSave} disabled={submitting}>
                {submitting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Trailer Add / Edit Modal */}
      <Modal animationType="slide" transparent visible={trailerModalVisible} onRequestClose={() => setTrailerModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{trailerMode === 'add' ? 'Add Trailer' : 'Edit Trailer'}</Text>
              <TouchableOpacity onPress={() => setTrailerModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8D6E63" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Trailer URL *</Text>
              <TextInput style={styles.textInput} placeholder="https://youtube.com/..." placeholderTextColor="#BCAAA4" value={trailerUrl} onChangeText={setTrailerUrl} autoCapitalize="none" />
              {trailerFormError ? <Text style={styles.formErrorText}>{trailerFormError}</Text> : null}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={() => setTrailerModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerBtn, styles.saveBtn, savingTrailer && styles.btnDisabled]} onPress={handleSaveTrailer} disabled={savingTrailer}>
                {savingTrailer ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5EBE6', backgroundColor: '#FFF8F0',
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0E4DC',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  addButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#D35400',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#D35400', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  infoText: { marginTop: 12, fontSize: 14, color: '#8D6E63', fontWeight: '500' },
  errorText: { fontSize: 14, color: '#E74C3C', textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  retryBtn: { backgroundColor: '#FBEBE1', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#D35400', fontSize: 13, fontWeight: '700' },
  emptyText: { marginTop: 12, fontSize: 14, color: '#8D6E63', textAlign: 'center' },
  createFirstBtn: { backgroundColor: '#D35400', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20 },
  createFirstBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  listContent: { padding: 20, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#F5EBE6', flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  cardThumb: { width: 56, height: 80, borderRadius: 8, backgroundColor: '#E8D5C4' },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1810', flex: 1 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusVisible: { backgroundColor: '#E8F8F5' },
  statusHidden: { backgroundColor: '#F5B7B1' },
  statusText: { fontSize: 9, fontWeight: '700' },
  textVisible: { color: '#16A085' },
  textHidden: { color: '#C0392B' },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  typeTag: { backgroundColor: '#2C1810', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 },
  typeTagText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  cardStatus: { fontSize: 11, color: '#8D6E63', fontWeight: '600' },
  cardEp: { fontSize: 11, color: '#8D6E63' },
  cardYear: { fontSize: 11, color: '#8D6E63', marginTop: 2 },
  cardTrailers: { fontSize: 11, color: '#2980B9', marginTop: 2, fontWeight: '600' },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF8F0', borderWidth: 1,
  },
  visibilityBtn: { borderColor: '#E8D5C4' },
  editBtn: { borderColor: '#FBEBE1' },
  deleteBtn: { borderColor: '#FDEDEC' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44, 24, 16, 0.5)' },
  modalCard: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, maxHeight: '92%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5EBE6',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  modalBody: { maxHeight: '65%', gap: 10 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#2C1810' },
  textInput: {
    backgroundColor: '#FFF8F0', borderRadius: 10, padding: 12, fontSize: 14,
    color: '#2C1810', borderWidth: 1, borderColor: '#E8D5C4',
  },
  textArea: { height: 72, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: 8 },
  segment: {
    flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E8D5C4',
    alignItems: 'center', backgroundColor: '#FFF8F0',
  },
  segmentSm: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E8D5C4', alignItems: 'center', backgroundColor: '#FFF8F0' },
  segmentActive: { backgroundColor: '#D35400', borderColor: '#D35400' },
  segmentText: { fontSize: 12, fontWeight: '700', color: '#2C1810' },
  segmentTextActive: { color: '#FFF' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: '#E8D5C4', backgroundColor: '#FFF8F0' },
  chipActive: { backgroundColor: '#D35400', borderColor: '#D35400' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#2C1810' },
  chipTextActive: { color: '#FFF' },
  hint: { fontSize: 12, color: '#A1887F', fontStyle: 'italic' },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF8F0',
    borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E8D5C4',
  },
  dateButtonText: { fontSize: 14, color: '#2C1810' },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  previewImage: { width: '100%', height: 140, borderRadius: 10, marginTop: 8, backgroundColor: '#E8D5C4' },
  previewBanner: { height: 90 },
  uploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#2980B9', borderRadius: 10, padding: 10, marginTop: 8,
  },
  uploadBtnAlt: { backgroundColor: '#8E44AD' },
  uploadBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  trailerSection: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5EBE6' },
  trailerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addTrailerBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#D35400', justifyContent: 'center', alignItems: 'center' },
  trailerItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    backgroundColor: '#FFF8F0', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#F0E4DC',
  },
  trailerInfo: { flex: 1 },
  trailerLabel: { fontSize: 13, fontWeight: '700', color: '#2C1810' },
  trailerUrl: { fontSize: 11, color: '#8D6E63' },
  trailerActions: { flexDirection: 'row', gap: 6 },
  trailerEdit: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FBEBE1' },
  trailerDelete: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FDEDEC' },
  formErrorText: { color: '#E74C3C', fontSize: 12, marginTop: 4, textAlign: 'center' },
  modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 12 : 0 },
  footerBtn: { flex: 1, height: 48, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F5EBE6', borderWidth: 1, borderColor: '#E8D5C4' },
  cancelBtnText: { color: '#8D6E63', fontSize: 14, fontWeight: '600' },
  saveBtn: { backgroundColor: '#D35400' },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },
});
