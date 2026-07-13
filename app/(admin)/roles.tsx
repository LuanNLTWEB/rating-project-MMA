import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
  StatusBar, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getUsers, updateUserRole } from '@/src/services/adminService';

const ROLE_COLORS: Record<string, string> = {
  admin: '#16A085', staff: '#2980B9', customer: '#8D6E63',
};

export default function RolesScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSave = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await updateUserRole(selectedUser._id, newRole);
      Alert.alert('Success', `"${selectedUser.name}" is now ${newRole}`);
      setModalVisible(false);
      fetchUsers();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const filtered = filterRole
    ? users.filter((u) => u.role === filterRole)
    : users;

  const counts = {
    all: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    staff: users.filter((u) => u.role === 'staff').length,
    customer: users.filter((u) => u.role === 'customer').length,
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.avatar, { backgroundColor: ROLE_COLORS[item.role] }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + '20' }]}>
        <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] }]}>{item.role}</Text>
      </View>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => { setSelectedUser(item); setNewRole(item.role); setModalVisible(true); }}
      >
        <MaterialIcons name="edit" size={18} color="#D35400" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <Text style={styles.title}>Role Management</Text>
        <Text style={styles.sub}>Assign & change user roles</Text>
      </View>

      <View style={styles.filterRow}>
        {(['', 'admin', 'staff', 'customer'] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.filterBtn, filterRole === role && styles.filterBtnActive]}
            onPress={() => setFilterRole(role)}
          >
            <Text style={[styles.filterText, filterRole === role && styles.filterTextActive]}>
              {role || 'All'} ({counts[role || 'all']})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#D35400" /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchUsers}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Role</Text>
            <Text style={styles.modalSub}>User: {selectedUser?.name}</Text>
            <Text style={styles.modalSub}>Current: {selectedUser?.role}</Text>
            <View style={styles.roleOptions}>
              {['customer', 'staff', 'admin'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOpt, newRole === r && styles.roleOptSelected]}
                  onPress={() => setNewRole(r)}
                >
                  <Text style={[styles.roleOptText, newRole === r && styles.roleOptTextSelected]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
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
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  title: { fontSize: 20, fontWeight: '800', color: '#2C1810' },
  sub: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#F5EBE6', backgroundColor: '#FFFFFF' },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#FFF8F0', borderWidth: 1, borderColor: '#E8D5C4' },
  filterBtnActive: { backgroundColor: '#D35400', borderColor: '#D35400' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#8D6E63' },
  filterTextActive: { color: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, gap: 10, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F5EBE6', gap: 10 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  cardInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: '#2C1810' },
  email: { fontSize: 11, color: '#8D6E63', marginTop: 1 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  editBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#FBEBE1', justifyContent: 'center', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'center', padding: 40 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  modalSub: { fontSize: 13, color: '#8D6E63', marginTop: 4 },
  roleOptions: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 20 },
  roleOpt: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E8D5C4', alignItems: 'center', backgroundColor: '#FFF8F0' },
  roleOptSelected: { backgroundColor: '#D35400', borderColor: '#D35400' },
  roleOptText: { fontSize: 13, fontWeight: '600', color: '#2C1810' },
  roleOptTextSelected: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F5EBE6', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#8D6E63' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#D35400', alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
