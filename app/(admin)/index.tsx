import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getUsers } from '@/src/services/adminService';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ total: 0, staff: 0, admin: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) setUser(JSON.parse(userStr));
      const users = await getUsers();
      setStats({
        total: users.length,
        staff: users.filter((u: any) => u.role === 'staff').length,
        admin: users.filter((u: any) => u.role === 'admin').length,
        suspended: users.filter((u: any) => u.status !== 'active').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/(auth)/login');
  };

  const cards = [
    { label: 'Total Users', value: stats.total, icon: 'people', color: '#D35400' },
    { label: 'Staff', value: stats.staff, icon: 'badge', color: '#2980B9' },
    { label: 'Admins', value: stats.admin, icon: 'admin-panel-settings', color: '#16A085' },
    { label: 'Suspended', value: stats.suspended, icon: 'block', color: '#C0392B' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Panel</Text>
          <Text style={styles.subtitle}>Welcome, {user?.name || 'Admin'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#C0392B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D35400" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.grid}>
            {cards.map((card) => (
              <View key={card.label} style={styles.card}>
                <View style={[styles.iconWrap, { backgroundColor: card.color + '20' }]}>
                  <MaterialIcons name={card.icon as any} size={28} color={card.color} />
                </View>
                <Text style={styles.cardValue}>{card.value}</Text>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => (router as any).push('/(admin)/accounts')}>
              <MaterialIcons name="people" size={22} color="#FFF" />
              <Text style={styles.actionText}>Manage Accounts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => (router as any).push('/(admin)/staff')}>
              <MaterialIcons name="badge" size={22} color="#FFF" />
              <Text style={styles.actionText}>Manage Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => (router as any).push('/(admin)/roles')}>
              <MaterialIcons name="admin-panel-settings" size={22} color="#FFF" />
              <Text style={styles.actionText}>Manage Roles</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => (router as any).push('/(admin)/audit')}>
              <MaterialIcons name="history" size={22} color="#FFF" />
              <Text style={styles.actionText}>Audit Log</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5EBE6',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#2C1810' },
  subtitle: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FDEDEC', justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#2C1810', marginBottom: 12, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#F5EBE6', alignItems: 'center',
  },
  iconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardValue: { fontSize: 28, fontWeight: '800', color: '#2C1810' },
  cardLabel: { fontSize: 12, color: '#8D6E63', fontWeight: '600', marginTop: 4 },
  actions: { gap: 10 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#D35400',
    borderRadius: 12, padding: 16, gap: 12,
  },
  actionText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
