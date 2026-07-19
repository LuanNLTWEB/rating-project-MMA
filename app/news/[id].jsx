import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  StatusBar,
  Linking,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import RenderHtml from 'react-native-render-html';
import { getNewsById } from '@/src/services/newsService';

export default function NewsDetailScreen() {
  const { id } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const data = await getNewsById(id);
        setArticle(data);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Article not found or server error.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#2C1810" />
          </TouchableOpacity>
        </View>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#D35400" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !article) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#2C1810" />
          </TouchableOpacity>
        </View>
        <View style={styles.centeredContainer}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      
      <View style={styles.headerAbsolute}>
        <TouchableOpacity style={styles.backButtonShadow} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#2C1810" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image
          source={{ uri: (article.imageUrls && article.imageUrls.length > 0) ? article.imageUrls[0] : 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800' }}
          style={styles.coverImage}
          resizeMode="cover"
        />

        <View style={styles.contentContainer}>
          <View style={styles.tagContainer}>
            {article.tags && article.tags.map((tag, index) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <MaterialIcons name="calendar-today" size={14} color="#8D6E63" />
              <Text style={styles.metaText}>
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialIcons name="person" size={14} color="#8D6E63" />
              <Text style={styles.metaText}>{article.authorName || article.author?.name || 'Staff Editor'}</Text>
            </View>
          </View>

          <Text style={styles.summary}>{article.summary}</Text>
          
          <View style={styles.divider} />

          <RenderHtml
            contentWidth={width - 48} // 24px padding on each side
            source={{ html: article.content }}
            baseStyle={styles.bodyContent}
            tagsStyles={{
              p: { marginBottom: 12 },
              h1: { fontSize: 22, fontWeight: '700', marginVertical: 10, color: '#2C1810' },
              h2: { fontSize: 20, fontWeight: '700', marginVertical: 10, color: '#2C1810' },
              a: { color: '#2980B9', textDecorationLine: 'none' },
              img: { borderRadius: 8, marginVertical: 8 },
            }}
          />
          
          {article.sourceUrls && article.sourceUrls.length > 0 && (
            <View style={styles.sourceContainer}>
              <Text style={styles.sourceHeader}>Sources:</Text>
              {article.sourceUrls.map((url, i) => (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(url)} style={styles.sourceLink}>
                  <MaterialIcons name="link" size={16} color="#2980B9" />
                  <Text style={styles.sourceLinkText} numberOfLines={1}>{url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {article.videoUrls && article.videoUrls.length > 0 && (
            <View style={styles.sourceContainer}>
              <Text style={styles.sourceHeader}>Related Videos:</Text>
              {article.videoUrls.map((url, i) => {
                const ytId = getYouTubeId(url);
                if (ytId) {
                  return (
                    <TouchableOpacity key={i} onPress={() => Linking.openURL(url)} style={styles.ytBannerContainer}>
                      <Image
                        source={{ uri: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` }}
                        style={styles.ytBanner}
                        resizeMode="cover"
                      />
                      <View style={styles.ytPlayOverlay}>
                        <MaterialIcons name="play-circle-filled" size={48} color="rgba(255,255,255,0.9)" />
                      </View>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity key={i} onPress={() => Linking.openURL(url)} style={styles.sourceLink}>
                    <MaterialIcons name="play-circle-outline" size={16} color="#D35400" />
                    <Text style={styles.sourceLinkText} numberOfLines={1}>{url}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F5EBE6', backgroundColor: '#FFF8F0',
  },
  headerAbsolute: {
    position: 'absolute',
    top: 50, // Safe area approx
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F0E4DC',
  },
  backButtonShadow: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#E74C3C', textAlign: 'center', marginTop: 12 },
  scrollContent: { paddingBottom: 40 },
  coverImage: { width: '100%', height: 260, backgroundColor: '#E8D5C4' },
  contentContainer: {
    backgroundColor: '#FFF8F0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tagBadge: { backgroundColor: '#D35400', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  tagText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#2C1810', lineHeight: 32, marginBottom: 16 },
  metaContainer: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#8D6E63', fontWeight: '500' },
  summary: { fontSize: 15, color: '#5D4037', lineHeight: 24, fontStyle: 'italic', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E8D5C4', marginVertical: 20 },
  bodyContent: { fontSize: 15, color: '#2C1810', lineHeight: 26 },
  sourceContainer: { marginTop: 30, backgroundColor: '#FBEBE1', padding: 16, borderRadius: 12 },
  sourceHeader: { fontSize: 14, fontWeight: '700', color: '#2C1810', marginBottom: 10 },
  sourceLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sourceLinkText: { fontSize: 13, color: '#2980B9', textDecorationLine: 'underline', flex: 1 },
  ytBannerContainer: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
    backgroundColor: '#000',
  },
  ytBanner: { width: '100%', height: '100%', opacity: 0.8 },
  ytPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
