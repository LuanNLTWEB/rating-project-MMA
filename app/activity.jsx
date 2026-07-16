import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getActivityLog } from '@/src/services/profileService';

const ACTION_CONFIG = {
  login:              { icon: 'login',       color: '#2196F3', label: 'Login' },
  favorite_add:       { icon: 'favorite',    color: '#E74C3C', label: 'Added to Favorites' },
  favorite_remove:    { icon: 'favorite-border', color: '#9E9E9E', label: 'Removed from Favorites' },
  watchlist_add:      { icon: 'playlist-add',    color: '#4CAF50', label: 'Added to Watchlist' },
  watchlist_update:   { icon: 'edit',        color: '#FF9800', label: 'Updated Watchlist' },
  watchlist_remove:   { icon: 'playlist-remove', color: '#9E9E9E', label: 'Removed from Watchlist' },
  profile_update:     { icon: 'person',      color: '#9C27B0', label: 'Profile Updated' },
  password_change:    { icon: 'lock',        color: '#FF5722', label: 'Password Changed' },
  avatar_change:      { icon: 'camera-alt',  color: '#00BCD4', label: 'Avatar Changed' },
};

export default function ActivityScreen() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async (p) => {
    try {
      setLoading(true);
      const data = await getActivityLog(p);
      if (p === 1) {
        setLogs(data.logs);
      } else {
        setLogs((prev) => [...prev, ...data.logs]);
      }
      setTotalPages(data.totalPages);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const loadMore = () => {
    if (page < totalPages && !loading) {
      const next = page + 1;
      setPage(next);
      loadData(next);
    }
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }) => {
    const config = ACTION_CONFIG[item.action] || { icon: 'info', color: '#757575', label: item.action };
    return (
      <View style={styles.logItem}>
        <View style={[styles.iconCircle, { backgroundColor: config.color + '20' }]}>
          <MaterialIcons name={config.icon} size={20} color={config.color} />
        </View>
        <View style={styles.logContent}>
          <Text style={styles.logAction}>{config.label}</Text>
          {item.details ? <Text style={styles.logDetails}>{item.details}</Text> : null}
        </View>
        <Text style={styles.logTime}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Activity History</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading && logs.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D35400" />
        </View>
      ) : logs.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="history" size={48} color="#D2B4A0" />
          <Text style={styles.emptyText}>No activity yet</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item, idx) => item._id || String(idx)}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loading && logs.length > 0 ? <ActivityIndicator style={{ padding: 16 }} /> : null}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F5EBE6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  list: { padding: 16 },
  logItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#F5EBE6' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  logContent: { flex: 1, marginLeft: 12 },
  logAction: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  logDetails: { fontSize: 12, color: '#8D6E63', marginTop: 2 },
  logTime: { fontSize: 11, color: '#A1887F', marginLeft: 8 },
  emptyText: { fontSize: 16, color: '#A1887F', marginTop: 12 },
});
