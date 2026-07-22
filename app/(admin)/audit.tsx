import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getAuditLogs } from '@/src/services/adminService';

const ACTION_LABELS: Record<string, string> = {
  change_role: 'Role changed',
  suspend: 'Account suspended',
  reactivate: 'Account reactivated',
  ban: 'Account banned',
  delete_user: 'User deleted',
  create_staff: 'Staff created',
  delete_staff: 'Staff deleted',
};

const ACTION_COLORS: Record<string, string> = {
  change_role: '#2980B9',
  suspend: '#E67E22',
  reactivate: '#16A085',
  ban: '#C0392B',
  delete_user: '#C0392B',
  create_staff: '#16A085',
  delete_staff: '#C0392B',
};

const ACTION_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  change_role: 'swap-horiz',
  suspend: 'pause-circle',
  reactivate: 'check-circle',
  ban: 'block',
  delete_user: 'person-remove',
  create_staff: 'person-add',
  delete_staff: 'person-remove',
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AuditScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchLogs(); }, [fetchLogs]));

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={[styles.iconWrap, { backgroundColor: (ACTION_COLORS[item.action] || '#8D6E63') + '20' }]}>
          <MaterialIcons
            name={ACTION_ICONS[item.action] || 'info'}
            size={22}
            color={ACTION_COLORS[item.action] || '#8D6E63'}
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <Text style={[styles.actionBadge, { color: ACTION_COLORS[item.action] || '#8D6E63' }]}>
              {ACTION_LABELS[item.action] || item.action}
            </Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
          </View>
          <Text style={styles.adminText}>
            <Text style={styles.bold}>{item.adminName}</Text>
            {item.targetUserEmail ? (
              <Text> → {item.targetUserEmail}</Text>
            ) : null}
          </Text>
          {item.details ? <Text style={styles.detail}>{item.details}</Text> : null}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.sub}>{logs.length} entries</Text>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#D35400" /></View>
      ) : logs.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="history" size={48} color="#BCAAA4" />
          <Text style={styles.emptyText}>No activity recorded yet</Text>
        </View>
      ) : (
        <FlatList
          data={logs}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchLogs}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  title: { fontSize: 20, fontWeight: '800', color: '#2C1810' },
  sub: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#8D6E63', marginTop: 12, fontWeight: '600' },
  list: { padding: 20, gap: 10, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F5EBE6' },
  cardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  actionBadge: { fontSize: 13, fontWeight: '700' },
  time: { fontSize: 11, color: '#BCAAA4' },
  adminText: { fontSize: 13, color: '#2C1810' },
  bold: { fontWeight: '700' },
  detail: { fontSize: 12, color: '#8D6E63', marginTop: 4, fontStyle: 'italic' },
});
