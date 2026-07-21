import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getReports, updateReportStatus } from '@/src/services/reportService';
import { deleteReview, getAllReviews, toggleHideReview } from '@/src/services/reviewService';

export default function ManageReportsScreen() {
  const [mainTab, setMainTab] = useState('reports'); // 'reports' or 'all'
  
  // State for Reports tab
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, resolved, dismissed, all

  // State for All Comments tab
  const [allReviews, setAllReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (mainTab === 'reports') {
      fetchReports();
    } else {
      fetchAllReviews();
    }
  }, [mainTab, filter]);

  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const data = await getReports(filter === 'all' ? '' : filter);
      setReports(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchAllReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await getAllReviews();
      setAllReviews(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to fetch all reviews');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleUpdateStatus = async (reportId, status) => {
    try {
      await updateReportStatus(reportId, status);
      Alert.alert('Success', `Report marked as ${status}`);
      fetchReports();
    } catch (err) {
      Alert.alert('Error', 'Failed to update report');
    }
  };

  const handleDeleteReviewFromReport = async (reviewId, reportId) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(reviewId);
            await updateReportStatus(reportId, 'resolved');
            Alert.alert('Success', 'Review deleted and report resolved.');
            fetchReports();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete review');
          }
        },
      },
    ]);
  };

  const handleDeleteAnyReview = async (reviewId) => {
    Alert.alert('Delete Review', 'Are you sure you want to delete this review permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReview(reviewId);
            Alert.alert('Success', 'Review deleted.');
            fetchAllReviews();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete review');
          }
        },
      },
    ]);
  };

  const handleToggleHide = async (reviewId) => {
    try {
      await toggleHideReview(reviewId);
      fetchAllReviews(); // refresh to show updated status
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle hide status');
    }
  };

  const renderReportItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.reporterInfo}>
          <MaterialIcons name="report-problem" size={18} color="#E74C3C" />
          <TouchableOpacity onPress={() => item.reporter?._id && router.push({ pathname: '/user-profile', params: { userId: item.reporter._id } })}>
            <Text style={styles.reporterName}>Reported by {item.reporter?.username || item.reporter?.name || 'Unknown'}</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.reasonBlock}>
        <Text style={styles.reasonLabel}>Reason:</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>
      </View>

      <View style={styles.reviewBlock}>
        <TouchableOpacity onPress={() => item.review?.user?._id && router.push({ pathname: '/user-profile', params: { userId: item.review.user._id } })}>
          <Text style={styles.reviewHeader}>Reported Review (by {item.review?.user?.username || item.review?.user?.name || 'Unknown'})</Text>
        </TouchableOpacity>
        <Text style={styles.reviewText}>{item.review?.bodyText || '[Review deleted or missing]'}</Text>
      </View>

      {item.status === 'pending' && item.review && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtnDismiss} onPress={() => handleUpdateStatus(item._id, 'dismissed')}>
            <Text style={styles.btnTextDark}>Dismiss</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnResolve} onPress={() => handleUpdateStatus(item._id, 'resolved')}>
            <Text style={styles.btnTextLight}>Mark Resolved</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDeleteReviewFromReport(item.review._id, item._id)}>
            <MaterialIcons name="delete" size={16} color="#FFF" />
            <Text style={styles.btnTextLight}>Delete Review</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderReviewItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.reporterInfo}>
          <MaterialIcons name="person" size={18} color="#8D6E63" />
          <TouchableOpacity onPress={() => item.user?._id && router.push({ pathname: '/user-profile', params: { userId: item.user._id } })}>
            <Text style={styles.reporterName}>{item.user?.username || item.user?.name || 'Unknown'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={14} color="#F4C430" />
          <Text style={styles.ratingText}>{item.overallRating}/5</Text>
        </View>
      </View>
      
      {item.movie && (
        <Text style={styles.movieInfo}>Movie: {item.movie.title || item.movie.titleEnglish}</Text>
      )}

      <View style={[styles.reviewBlock, item.isHidden && { backgroundColor: '#F2D7D5' }]}>
        <Text style={styles.reviewText}>{item.bodyText}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionBtnHide, item.isHidden ? { backgroundColor: '#27AE60' } : { backgroundColor: '#F39C12' }]} 
          onPress={() => handleToggleHide(item._id)}
        >
          <MaterialIcons name={item.isHidden ? "visibility" : "visibility-off"} size={16} color="#FFF" />
          <Text style={styles.btnTextLight}>{item.isHidden ? 'Unhide' : 'Hide'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtnDelete} onPress={() => handleDeleteAnyReview(item._id)}>
          <MaterialIcons name="delete" size={16} color="#FFF" />
          <Text style={styles.btnTextLight}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Comments</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.mainTabRow}>
        <TouchableOpacity 
          style={[styles.mainTab, mainTab === 'reports' && styles.mainTabActive]} 
          onPress={() => setMainTab('reports')}
        >
          <Text style={[styles.mainTabText, mainTab === 'reports' && styles.mainTabTextActive]}>Reported</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mainTab, mainTab === 'all' && styles.mainTabActive]} 
          onPress={() => setMainTab('all')}
        >
          <Text style={[styles.mainTabText, mainTab === 'all' && styles.mainTabTextActive]}>All Comments</Text>
        </TouchableOpacity>
      </View>

      {mainTab === 'reports' && (
        <View style={styles.filterRow}>
          {['pending', 'resolved', 'dismissed', 'all'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {mainTab === 'reports' ? (
        loadingReports ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#D35400" />
          </View>
        ) : (
          <FlatList
            data={reports}
            renderItem={renderReportItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons name="check-circle-outline" size={48} color="#27AE60" />
                <Text style={styles.emptyText}>No {filter} reports found.</Text>
              </View>
            }
          />
        )
      ) : (
        loadingReviews ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#D35400" />
          </View>
        ) : (
          <FlatList
            data={allReviews}
            renderItem={renderReviewItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No comments found on the platform.</Text>
              </View>
            }
          />
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
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
  mainTabRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  mainTab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  mainTabActive: { borderBottomColor: '#D35400' },
  mainTabText: { fontSize: 14, fontWeight: '600', color: '#8D6E63' },
  mainTabTextActive: { color: '#D35400' },
  filterRow: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  filterTab: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, marginRight: 8, backgroundColor: '#F5EBE6' },
  filterTabActive: { backgroundColor: '#D35400' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#8D6E63' },
  filterTextActive: { color: '#FFFFFF' },
  list: { padding: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F5EBE6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reporterInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reporterName: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FDEBD0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#D35400' },
  movieInfo: { fontSize: 12, color: '#D35400', fontWeight: '700', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  status_pending: { backgroundColor: '#FDEBD0' },
  status_resolved: { backgroundColor: '#D5F5E3' },
  status_dismissed: { backgroundColor: '#EBDEF0' },
  statusText: { fontSize: 11, fontWeight: '700', color: '#2C1810' },
  reasonBlock: { backgroundColor: '#FFF8F0', padding: 12, borderRadius: 8, marginBottom: 12 },
  reasonLabel: { fontSize: 12, color: '#8D6E63', marginBottom: 4 },
  reasonText: { fontSize: 14, color: '#E74C3C', fontWeight: '600' },
  reviewBlock: { backgroundColor: '#F5EBE6', padding: 12, borderRadius: 8, marginBottom: 16 },
  reviewHeader: { fontSize: 12, fontWeight: '600', color: '#5D4037', marginBottom: 6 },
  reviewText: { fontSize: 13, color: '#2C1810', fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtnDismiss: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#E0E0E0', alignItems: 'center' },
  actionBtnResolve: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#27AE60', alignItems: 'center' },
  actionBtnDelete: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 8, backgroundColor: '#E74C3C' },
  actionBtnHide: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 8 },
  btnTextDark: { fontSize: 13, fontWeight: '700', color: '#333' },
  btnTextLight: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#8D6E63', marginTop: 12 },
});
