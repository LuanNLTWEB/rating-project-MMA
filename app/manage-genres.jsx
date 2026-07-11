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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  getAllGenres,
  createGenre,
  updateGenre,
  deleteGenre,
  toggleGenreVisibility,
} from '@/src/services/genreService';

export default function ManageGenresScreen() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedGenreId, setSelectedGenreId] = useState('');
  const [genreName, setGenreName] = useState('');
  const [genreDesc, setGenreDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllGenres();
      setGenres(data);
    } catch (err) {
      console.error('Error fetching all genres:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('You do not have permission to access this page. Staff credentials required.');
        Alert.alert('Access Denied', 'Session expired or you do not have staff permissions.', [
          { text: 'Go Back', onPress: () => router.replace('/(tabs)') }
        ]);
      } else {
        setError('Could not connect to server.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Authenticate locally before fetching
    const checkRole = async () => {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role !== 'staff' && user.role !== 'admin') {
          Alert.alert('Unauthorized', 'This screen is for Staff only.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') }
          ]);
          return;
        }
      }
      fetchAllData();
    };

    checkRole();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedGenreId('');
    setGenreName('');
    setGenreDesc('');
    setFormError('');
    setModalVisible(true);
  };

  const openEditModal = (genre) => {
    setModalMode('edit');
    setSelectedGenreId(genre._id);
    setGenreName(genre.name);
    setGenreDesc(genre.description || '');
    setFormError('');
    setModalVisible(true);
  };

  // Save genre changes (Create or Edit)
  const handleSaveGenre = async () => {
    setFormError('');
    if (!genreName.trim()) {
      setFormError('Please enter genre name.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createGenre(genreName.trim(), genreDesc.trim());
        Alert.alert('Success', `Added genre "${genreName.trim()}"`);
      } else {
        await updateGenre(selectedGenreId, genreName.trim(), genreDesc.trim());
        Alert.alert('Success', 'Updated genre information');
      }
      setModalVisible(false);
      fetchAllData(); // Refresh list
    } catch (err) {
      console.error('Error saving genre:', err);
      if (err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else {
        setFormError('An error occurred. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle visibility (Ẩn/Hiện)
  const handleToggleVisibility = async (genre) => {
    try {
      const response = await toggleGenreVisibility(genre._id);
      // Update local state directly for responsive feedback
      setGenres((prev) =>
        prev.map((g) => (g._id === genre._id ? { ...g, visible: response.genre.visible } : g))
      );
    } catch (err) {
      console.error('Error toggling visibility:', err);
      Alert.alert('Error', 'Could not update visibility status.');
    }
  };

  // Delete genre with confirmation warning
  const handleDeleteGenre = (genre) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the genre "${genre.name}"? It will be removed from all associated movies.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGenre(genre._id);
              Alert.alert('Success', `Deleted genre "${genre.name}"`);
              fetchAllData();
            } catch (err) {
              console.error('Error deleting genre:', err);
              Alert.alert('Error', 'Could not delete this genre.');
            }
          },
        },
      ]
    );
  };

  const renderGenreItem = ({ item }) => {
    return (
      <View style={styles.genreCard}>
        <View style={styles.genreInfo}>
          <View style={styles.genreHeaderRow}>
            <Text style={styles.genreNameText}>{item.name}</Text>
            <View style={[styles.statusBadge, item.visible ? styles.statusVisible : styles.statusHidden]}>
              <Text style={[styles.statusText, item.visible ? styles.textVisible : styles.textHidden]}>
                {item.visible ? 'Visible' : 'Hidden'}
              </Text>
            </View>
          </View>
          <Text style={styles.genreDescText} numberOfLines={2}>
            {item.description || 'No description.'}
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          {/* Toggle visibility icon */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.visibilityBtn]}
            onPress={() => handleToggleVisibility(item)}
          >
            <MaterialIcons
              name={item.visible ? 'visibility' : 'visibility-off'}
              size={20}
              color={item.visible ? '#16A085' : '#7F8C8D'}
            />
          </TouchableOpacity>

          {/* Edit icon */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openEditModal(item)}
          >
            <MaterialIcons name="edit" size={20} color="#D35400" />
          </TouchableOpacity>

          {/* Delete icon */}
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteGenre(item)}
          >
            <MaterialIcons name="delete" size={20} color="#C0392B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Genres</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#D35400" />
          <Text style={styles.infoText}>Loading genres...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAllData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : genres.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="category" size={48} color="#BCAAA4" />
          <Text style={styles.emptyText}>No genres in system</Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={openCreateModal}>
            <Text style={styles.createFirstBtnText}>Create First Genre</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={genres}
          renderItem={renderGenreItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchAllData}
        />
      )}

      {/* Add/Edit Modal Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'create' ? 'Create New Genre' : 'Edit Genre'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8D6E63" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Genre Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Action, Sci-Fi"
                placeholderTextColor="#BCAAA4"
                value={genreName}
                onChangeText={setGenreName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Detailed Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter a brief description..."
                placeholderTextColor="#BCAAA4"
                value={genreDesc}
                onChangeText={setGenreDesc}
                multiline
                numberOfLines={3}
              />

              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, styles.cancelBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerBtn, styles.saveBtn, submitting && styles.btnDisabled]}
                onPress={handleSaveGenre}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBE6',
    backgroundColor: '#FFF8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E4DC',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1810',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D35400',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#D35400',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#FBEBE1',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#D35400',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8D6E63',
    textAlign: 'center',
  },
  createFirstBtn: {
    backgroundColor: '#D35400',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 20,
  },
  createFirstBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  genreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F5EBE6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    shadowColor: '#2C1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  genreInfo: {
    flex: 1,
  },
  genreHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genreNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusVisible: {
    backgroundColor: '#E8F8F5',
  },
  statusHidden: {
    backgroundColor: '#F5B7B1',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textVisible: {
    color: '#16A085',
  },
  textHidden: {
    color: '#C0392B',
  },
  genreDescText: {
    fontSize: 12,
    color: '#8D6E63',
    marginTop: 6,
    lineHeight: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
  },
  visibilityBtn: {
    borderColor: '#E8D5C4',
  },
  editBtn: {
    borderColor: '#FBEBE1',
  },
  deleteBtn: {
    borderColor: '#FDEDEC',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(44, 24, 16, 0.5)',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EBE6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1810',
  },
  modalBody: {
    gap: 12,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C1810',
  },
  textInput: {
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#2C1810',
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  formErrorText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F5EBE6',
    borderWidth: 1,
    borderColor: '#E8D5C4',
  },
  cancelBtnText: {
    color: '#8D6E63',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#D35400',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
