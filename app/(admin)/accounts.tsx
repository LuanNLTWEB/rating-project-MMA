import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
  StatusBar, Alert, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getUsers, updateUserRole, updateUserStatus, deleteUser } from '@/src/services/adminService';

const ROLE_COLORS: Record<string, string> = {
  admin: '#16A085', staff: '#2980B9', customer: '#8D6E63',
};
const STATUS_COLORS: Record<string, string> = {
  active: '#16A085', suspended: '#E67E22', banned: '#C0392B',
};

export default function AccountsScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [roleModal, setRoleModal] = useState(false);
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

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;
    try {
      await updateUserRole(selectedUser._id, newRole);
      Alert.alert('Success', `Role changed to ${newRole}`);
      setRoleModal(false);
      fetchUsers();
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        if ((currentUser._id || currentUser.id) === selectedUser._id) {
          const updatedUser = { ...currentUser, role: newRole };
          await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          if (newRole !== 'admin') router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  const handleStatusToggle = (user: any) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const label = newStatus === 'active' ? 'reactivate' : 'suspend';
    Alert.alert(
      `${label.charAt(0).toUpperCase() + label.slice(1)} account`,
      `Are you sure you want to ${label} "${user.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm', style: 'destructive',
          onPress: async () => {
            try {
              await updateUserStatus(user._id, newStatus);
              Alert.alert('Success', `Account ${label}ed`);
              fetchUsers();
              const userStr = await AsyncStorage.getItem('user');
              if (userStr) {
                const currentUser = JSON.parse(userStr);
                if ((currentUser._id || currentUser.id) === user._id) {
                  const updatedUser = { ...currentUser, status: newStatus };
                  await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                  if (newStatus !== 'active') router.replace('/(tabs)');
                }
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed');
            }
          },
        },
      ]
    );
  };

  const handleDelete = (user: any) => {
    Alert.alert('Delete account', `Delete "${user.name}" permanently?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteUser(user._id);
            Alert.alert('Deleted');
            fetchUsers();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Failed');
          }
        },
      },
    ]);
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] + '20' }]}>
          <Text style={[styles.roleText, { color: ROLE_COLORS[item.role] }]}>{item.role}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
        <Text style={styles.metaText}>{item.status}</Text>
        <Text style={styles.metaDivider}>|</Text>
        <Text style={styles.metaText}>{item.phone}</Text>
        <Text style={styles.metaDivider}>|</Text>
        <Text style={styles.metaText}>{item.gender}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionSmall}
          onPress={() => { setSelectedUser(item); setNewRole(item.role); setRoleModal(true); }}
        >
          <MaterialIcons name="admin-panel-settings" size={18} color="#D35400" />
          <Text style={styles.actionSmallText}>Role</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionSmall, { borderColor: item.status === 'active' ? '#F0E4DC' : '#FDEDEC' }]}
          onPress={() => handleStatusToggle(item)}
        >
          <MaterialIcons
            name={item.status === 'active' ? 'pause-circle' : 'check-circle'}
            size={18}
            color={item.status === 'active' ? '#E67E22' : '#16A085'}
          />
          <Text style={[styles.actionSmallText, { color: item.status === 'active' ? '#E67E22' : '#16A085' }]}>
            {item.status === 'active' ? 'Suspend' : 'Activate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionSmall, { borderColor: '#FDEDEC' }]} onPress={() => handleDelete(item)}>
          <MaterialIcons name="delete" size={18} color="#C0392B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <Text style={styles.title}>Account Management</Text>
        <Text style={styles.count}>{users.length} users</Text>
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={18} color="#8D6E63" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor="#BCAAA4"
          value={search}
          onChangeText={setSearch}
        />
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

      <Modal visible={roleModal} transparent animationType="fade" onRequestClose={() => setRoleModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Role</Text>
            <Text style={styles.modalSub}>{selectedUser?.name}</Text>
            <View style={styles.roleOptions}>
              {['customer', 'staff', 'admin'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, newRole === r && styles.roleOptionSelected]}
                  onPress={() => setNewRole(r)}
                >
                  <Text style={[styles.roleOptionText, newRole === r && styles.roleOptionTextSelected]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRoleModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleRoleChange}>
                <Text style={styles.modalConfirmText}>Save</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  title: { fontSize: 20, fontWeight: '800', color: '#2C1810' },
  count: { fontSize: 13, color: '#8D6E63', fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 20, marginBottom: 0, borderRadius: 10, paddingHorizontal: 12, height: 40, borderWidth: 1, borderColor: '#E8D5C4' },
  searchInput: { flex: 1, fontSize: 13, color: '#2C1810', padding: 0, marginLeft: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F5EBE6' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D35400', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#2C1810' },
  email: { fontSize: 12, color: '#8D6E63', marginTop: 1 },
  roleBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5EBE6' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontSize: 12, color: '#8D6E63' },
  metaDivider: { fontSize: 12, color: '#E8D5C4' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5EBE6' },
  actionSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: '#F0E4DC' },
  actionSmallText: { fontSize: 12, fontWeight: '600', color: '#8D6E63' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(44,24,16,0.5)', justifyContent: 'center', padding: 40 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  modalSub: { fontSize: 13, color: '#8D6E63', marginTop: 4, marginBottom: 16 },
  roleOptions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleOption: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E8D5C4', alignItems: 'center', backgroundColor: '#FFF8F0' },
  roleOptionSelected: { backgroundColor: '#D35400', borderColor: '#D35400' },
  roleOptionText: { fontSize: 13, fontWeight: '600', color: '#2C1810' },
  roleOptionTextSelected: { color: '#FFF' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F5EBE6', alignItems: 'center' },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#8D6E63' },
  modalConfirm: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#D35400', alignItems: 'center' },
  modalConfirmText: { fontSize: 14, fontWeight: '700', color: '#FFF' },
});
