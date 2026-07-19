import {
  createNews,
  deleteNews,
  getNewsForStaff,
  updateNews,
} from '@/src/services/newsService';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const STATUSES = ['draft', 'published'];

function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ManageNewsScreen() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Main create/edit modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [videoUrls, setVideoUrls] = useState('');
  const [sourceUrls, setSourceUrls] = useState('');
  const [tags, setTags] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [status, setStatus] = useState('draft');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const richText = React.useRef();

  // Custom Prompt for Rich Text Link/Image
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptType, setPromptType] = useState(''); // 'link' or 'image'
  const [promptUrl, setPromptUrl] = useState('');
  const [promptTextInput, setPromptTextInput] = useState('');

  const onPressAddImage = () => {
    setPromptType('image');
    setPromptUrl('');
    setPromptVisible(true);
  };

  const onPressAddLink = () => {
    setPromptType('link');
    setPromptUrl('');
    setPromptTextInput('');
    setPromptVisible(true);
  };

  const submitPrompt = () => {
    setPromptVisible(false);
    if (!promptUrl.trim()) return;
    
    if (promptType === 'image') {
      richText.current?.insertImage(promptUrl.trim());
    } else if (promptType === 'link') {
      richText.current?.insertLink(promptTextInput.trim() || promptUrl.trim(), promptUrl.trim());
    }
  };

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['image'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPromptVisible(false);
      richText.current?.insertImage(base64Image);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const newsData = await getNewsForStaff();
      setNews(newsData);
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
    setContent('');
    setImageUrls('');
    setVideoUrls('');
    setSourceUrls('');
    setTags('');
    setAuthorName('');
    setStatus('draft');
    setFormError('');
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedArticle(null);
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (article) => {
    setModalMode('edit');
    setSelectedArticle(article);
    setTitle(article.title || '');
    setSummary(article.summary || '');
    setContent(article.content || '');
    setImageUrls(article.imageUrls ? article.imageUrls.join(', ') : '');
    setVideoUrls(article.videoUrls ? article.videoUrls.join(', ') : '');
    setSourceUrls(article.sourceUrls ? article.sourceUrls.join(', ') : '');
    setTags(article.tags ? article.tags.join(', ') : '');
    setAuthorName(article.authorName || '');
    setStatus(article.status || 'draft');
    setFormError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!title.trim() || !summary.trim() || !content.trim()) {
      setFormError('Title, Summary, and Content are required.');
      return;
    }

    setSubmitting(true);

    // Process comma separated fields
    const processArrayField = (str) => {
      if (!str) return [];
      return str.split(',').map(s => s.trim()).filter(Boolean);
    };

    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      imageUrls: processArrayField(imageUrls),
      videoUrls: processArrayField(videoUrls),
      sourceUrls: processArrayField(sourceUrls),
      tags: processArrayField(tags),
      authorName: authorName.trim(),
      status
    };

    try {
      if (modalMode === 'create') {
        await createNews(payload);
        Alert.alert('Success', `Added article "${title.trim()}"`);
      } else {
        await updateNews(selectedArticle._id, payload);
        Alert.alert('Success', 'Updated article information');
      }
      setModalVisible(false);
      fetchAllData();
    } catch (err) {
      console.error('Error saving news:', err);
      setFormError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (article) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete "${article.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNews(article._id);
              Alert.alert('Success', `Deleted "${article.title}"`);
              fetchAllData();
            } catch (err) {
              console.error('Delete news error:', err);
              Alert.alert('Error', 'Could not delete this article.');
            }
          },
        },
      ]
    );
  };

  const renderNewsItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={{
          uri: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=60',
        }}
        style={styles.cardThumb}
        resizeMode="cover"
      />
      <View style={styles.cardInfo}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.statusBadge, item.status === 'published' ? styles.statusVisible : styles.statusHidden]}>
            <Text style={[styles.statusText, item.status === 'published' ? styles.textVisible : styles.textHidden]}>
              {item.status === 'published' ? 'Published' : 'Draft'}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSummary} numberOfLines={2}>{item.summary}</Text>
        <Text style={styles.cardDate}>
          {item.publishedAt ? formatDate(item.publishedAt) : formatDate(item.createdAt)}
        </Text>
      </View>

      <View style={styles.cardActions}>
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
        <Text style={styles.headerTitle}>Manage News</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#D35400" />
          <Text style={styles.infoText}>Loading news...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAllData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : news.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="article" size={48} color="#BCAAA4" />
          <Text style={styles.emptyText}>No news articles found</Text>
          <TouchableOpacity style={styles.createFirstBtn} onPress={openCreateModal}>
            <Text style={styles.createFirstBtnText}>Add First Article</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchAllData}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal animationType="slide" transparent={false} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalMode === 'create' ? 'Write Article' : 'Edit Article'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8D6E63" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput style={styles.textInput} placeholder="Article title" placeholderTextColor="#BCAAA4" value={title} onChangeText={setTitle} />

              <Text style={styles.inputLabel}>Summary *</Text>
              <TextInput style={[styles.textInput, styles.textArea]} placeholder="Short summary..." placeholderTextColor="#BCAAA4" value={summary} onChangeText={setSummary} multiline numberOfLines={3} />

              <Text style={styles.inputLabel}>Content * (Rich Text)</Text>
              <View style={styles.richEditorContainer}>
                <RichToolbar
                  editor={richText}
                  actions={[
                    actions.setBold,
                    actions.setItalic,
                    actions.setUnderline,
                    actions.heading1,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.insertLink,
                    actions.insertImage,
                  ]}
                  onPressAddImage={onPressAddImage}
                  onPressAddLink={onPressAddLink}
                  style={styles.richToolbar}
                  iconTint="#8D6E63"
                  selectedIconTint="#D35400"
                />
                <RichEditor
                  ref={richText}
                  initialContentHTML={content}
                  onChange={(html) => setContent(html)}
                  placeholder="Write article content here..."
                  style={styles.richEditor}
                  editorStyle={{
                    backgroundColor: '#FFF8F0',
                    color: '#2C1810',
                    placeholderColor: '#BCAAA4',
                  }}
                />
              </View>

              <Text style={styles.inputLabel}>Image URLs (comma separated)</Text>
              <TextInput style={styles.textInput} placeholder="https://.../img.jpg, ..." placeholderTextColor="#BCAAA4" value={imageUrls} onChangeText={setImageUrls} autoCapitalize="none" />
              {imageUrls.split(',')[0]?.trim() ? <Image source={{ uri: imageUrls.split(',')[0].trim() }} style={styles.previewImage} resizeMode="cover" /> : null}

              <Text style={styles.inputLabel}>Video URLs (comma separated)</Text>
              <TextInput style={styles.textInput} placeholder="https://youtube.com/..." placeholderTextColor="#BCAAA4" value={videoUrls} onChangeText={setVideoUrls} autoCapitalize="none" />

              <Text style={styles.inputLabel}>Source URLs (comma separated)</Text>
              <TextInput style={styles.textInput} placeholder="https://..." placeholderTextColor="#BCAAA4" value={sourceUrls} onChangeText={setSourceUrls} autoCapitalize="none" />

              <Text style={styles.inputLabel}>Tags (comma separated)</Text>
              <TextInput style={styles.textInput} placeholder="Anime, Event, Manga" placeholderTextColor="#BCAAA4" value={tags} onChangeText={setTags} />

              <Text style={styles.inputLabel}>Author Name</Text>
              <TextInput style={styles.textInput} placeholder="Admin/Staff Name" placeholderTextColor="#BCAAA4" value={authorName} onChangeText={setAuthorName} />

              <Text style={styles.inputLabel}>Status</Text>
              <View style={styles.segmentRow}>
                {STATUSES.map((s) => (
                  <TouchableOpacity key={s} style={[styles.segment, status === s && styles.segmentActive]} onPress={() => setStatus(s)}>
                    <Text style={[styles.segmentText, status === s && styles.segmentTextActive]}>{s.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

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
        </SafeAreaView>
      </Modal>

      {/* Custom Prompt Modal for Link/Image */}
      <Modal animationType="fade" transparent visible={promptVisible} onRequestClose={() => setPromptVisible(false)}>
        <View style={styles.promptOverlay}>
          <View style={styles.promptCard}>
            <Text style={styles.promptTitle}>
              {promptType === 'image' ? 'Insert Image' : 'Insert Link'}
            </Text>
            
            <Text style={styles.inputLabel}>URL</Text>
            <TextInput 
              style={styles.textInput} 
              placeholder={promptType === 'image' ? "https://.../img.jpg" : "https://..."} 
              placeholderTextColor="#BCAAA4" 
              value={promptUrl} 
              onChangeText={setPromptUrl}
              autoCapitalize="none" 
            />

            {promptType === 'image' && (
              <TouchableOpacity style={styles.pickImageBtn} onPress={pickImage}>
                <MaterialIcons name="photo-library" size={20} color="#D35400" />
                <Text style={styles.pickImageBtnText}>Pick from Gallery</Text>
              </TouchableOpacity>
            )}

            {promptType === 'link' && (
              <>
                <Text style={styles.inputLabel}>Display Text</Text>
                <TextInput 
                  style={styles.textInput} 
                  placeholder="Click here..." 
                  placeholderTextColor="#BCAAA4" 
                  value={promptTextInput} 
                  onChangeText={setPromptTextInput} 
                />
              </>
            )}

            <View style={styles.promptFooter}>
              <TouchableOpacity style={[styles.footerBtn, styles.cancelBtn]} onPress={() => setPromptVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerBtn, styles.saveBtn]} onPress={submitPrompt}>
                <Text style={styles.saveBtnText}>Insert</Text>
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
  cardThumb: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#E8D5C4' },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#2C1810', flex: 1 },
  cardSummary: { fontSize: 12, color: '#8D6E63', marginBottom: 4 },
  cardDate: { fontSize: 11, color: '#BCAAA4' },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusVisible: { backgroundColor: '#E8F8F5' },
  statusHidden: { backgroundColor: '#F5B7B1' },
  statusText: { fontSize: 9, fontWeight: '700' },
  textVisible: { color: '#16A085' },
  textHidden: { color: '#C0392B' },
  cardActions: { flexDirection: 'column', gap: 8 },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF8F0', borderWidth: 1,
  },
  editBtn: { borderColor: '#FBEBE1' },
  deleteBtn: { borderColor: '#FDEDEC' },
  modalOverlay: { flex: 1, backgroundColor: '#FFF8F0' },
  modalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5EBE6',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  modalBody: { flex: 1 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#2C1810', marginTop: 12, marginBottom: 4 },
  textInput: {
    backgroundColor: '#FFF8F0', borderRadius: 10, padding: 12, fontSize: 14,
    color: '#2C1810', borderWidth: 1, borderColor: '#E8D5C4',
  },
  textArea: { height: 72, textAlignVertical: 'top' },
  richEditorContainer: {
    borderWidth: 1, borderColor: '#E8D5C4', borderRadius: 10,
    marginTop: 4, overflow: 'hidden', backgroundColor: '#FFF8F0',
    minHeight: 250,
  },
  richToolbar: { backgroundColor: '#FBEBE1', borderBottomWidth: 1, borderBottomColor: '#E8D5C4' },
  richEditor: { flex: 1, minHeight: 200 },
  segmentRow: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 20 },
  segment: {
    flex: 1, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#D5DBDB',
    alignItems: 'center', backgroundColor: '#F2F3F4',
  },
  segmentActive: { backgroundColor: '#34495E', borderColor: '#34495E' },
  segmentText: { fontSize: 12, fontWeight: '700', color: '#7F8C8D' },
  segmentTextActive: { color: '#FFF' },
  previewImage: { width: '100%', height: 140, borderRadius: 10, marginTop: 8, backgroundColor: '#E8D5C4' },
  formErrorText: { color: '#E74C3C', fontSize: 12, marginTop: 12, textAlign: 'center' },
  modalFooter: { flexDirection: 'row', gap: 12, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 12 : 12, borderTopWidth: 1, borderTopColor: '#F5EBE6', backgroundColor: '#FFFFFF' },
  footerBtn: { flex: 1, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F5EBE6', borderWidth: 0 },
  cancelBtnText: { color: '#8D6E63', fontSize: 15, fontWeight: '700' },
  saveBtn: { backgroundColor: '#D35400', shadowColor: '#D35400', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  
  // Prompt Modal Styles
  promptOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(44, 24, 16, 0.6)', padding: 24 },
  promptCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  promptTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810', marginBottom: 8, textAlign: 'center' },
  promptFooter: { flexDirection: 'row', gap: 12, marginTop: 24 },
  pickImageBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBEBE1', paddingVertical: 12, borderRadius: 10, marginTop: 12, gap: 8 },
  pickImageBtnText: { color: '#D35400', fontSize: 14, fontWeight: '600' },
});
