import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getPublicNews } from '@/src/services/newsService';

function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function NewsListScreen() {
  const [news, setNews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPublicNews();
      setNews(data);
    } catch (err) {
      console.error('Error fetching news:', err);
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/news/${item._id}`)}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=60' }}
          style={styles.cardThumb}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>NEWS</Text>
        </View>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{formatDate(item.publishedAt || item.createdAt)}</Text>
          {item.tags && item.tags.length > 0 && (
            <Text style={styles.tagText} numberOfLines={1}>• {item.tags[0]}</Text>
          )}
        </View>
        <Text style={styles.cardSummary} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const filteredNews = news.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#2C1810" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Latest News</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#8D6E63" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search news..."
            placeholderTextColor="#8D6E63"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#8D6E63" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#D35400" />
        </View>
      ) : error ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchNews}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredNews.length === 0 ? (
        <View style={styles.centeredContainer}>
          <MaterialIcons name="article" size={48} color="#BCAAA4" />
          <Text style={styles.emptyText}>No articles found</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNews}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchNews}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5EBE6', backgroundColor: '#FFF8F0',
    gap: 12,
  },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#F5EBE6',
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#2C1810' },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0E4DC',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#E74C3C', textAlign: 'center', marginBottom: 16, marginTop: 12 },
  retryBtn: { backgroundColor: '#FBEBE1', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  retryBtnText: { color: '#D35400', fontSize: 13, fontWeight: '700' },
  emptyText: { marginTop: 12, fontSize: 14, color: '#8D6E63', textAlign: 'center' },
  listContent: { padding: 20, gap: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F5EBE6',
    shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#E8D5C4',
    position: 'relative'
  },
  cardThumb: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#D35400',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800'
  },
  cardInfo: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C1810', marginBottom: 6, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metaText: { fontSize: 12, color: '#8D6E63' },
  tagText: { fontSize: 12, color: '#2980B9', marginLeft: 4, fontWeight: '600' },
  cardSummary: { fontSize: 13, color: '#5D4037', lineHeight: 18 },
});
