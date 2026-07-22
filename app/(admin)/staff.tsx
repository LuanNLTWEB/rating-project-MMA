import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator,
  StatusBar, Alert, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getUsers, createStaffAccount, updateUserStatus } from '@/src/services/adminService';

export default function StaffScreen() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setStaff(data.filter((u: any) => u.role === 'staff'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const openCreate = () => {
    setName(''); setEmail(''); setPassword(''); setGender('Male');
    setDateOfBirth(''); setPhone(''); setFormError('');
    setModalVisible(true);
  };

  const handleCreate = async () => {
    setFormError('');
    if (!name.trim() || !email.trim() || !password || !dateOfBirth || !phone.trim()) {
      setFormError('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await createStaffAccount({ name: name.trim(), email: email.trim(), password, gender, dateOfBirth, phone: phone.trim() });
      Alert.alert('Success', `Staff account "${name}" created`);
      setModalVisible(false);
      fetchStaff();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create staff account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = (user: any) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const label = newStatus === 'active' ? 'reactivate' : 'suspend';
    Alert.alert(`${label} staff`, `${label} "${user.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm', style: 'destructive',
        onPress: async () => {
          await updateUserStatus(user._id, newStatus);
          fetchStaff();
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            const currentUser = JSON.parse(userStr);
            if ((currentUser._id || currentUser.id) === user._id) {
              const updatedUser = { ...currentUser, status: newStatus };
              await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
              if (newStatus !== 'active') router.replace('/(tabs)');
            }
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#E8F8F5' : '#FEF9E7' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#16A085' : '#E67E22' }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleToggle(item)}>
          <MaterialIcons name={item.status === 'active' ? 'pause-circle' : 'check-circle'} size={18} color={item.status === 'active' ? '#E67E22' : '#16A085'} />
          <Text style={[styles.actionText, { color: item.status === 'active' ? '#E67E22' : '#16A085' }]}>
            {item.status === 'active' ? 'Suspend' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Staff Accounts</Text>
          <Text style={styles.sub}>{staff.length} staff members</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <MaterialIcons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#D35400" /></View>
      ) : staff.length === 0 ? (
        <View style={styles.centered}>
          <MaterialIcons name="badge" size={48} color="#BCAAA4" />
          <Text style={styles.emptyText}>No staff accounts</Text>
          <TouchableOpacity style={styles.createBtn} onPress={openCreate}>
            <Text style={styles.createBtnText}>Create Staff</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={staff}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchStaff}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Staff Account</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#8D6E63" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="Staff name" placeholderTextColor="#BCAAA4" value={name} onChangeText={setName} />
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="staff@example.com" placeholderTextColor="#BCAAA4" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="At least 6 characters" placeholderTextColor="#BCAAA4" value={password} onChangeText={setPassword} secureTextEntry />
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity key={g} style={[styles.genderOpt, gender === g && styles.genderSelected]} onPress={() => setGender(g)}>
                    <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Date of Birth (YYYY-MM-DD)</Text>
              <TextInput style={styles.input} placeholder="2000-01-01" placeholderTextColor="#BCAAA4" value={dateOfBirth} onChangeText={setDateOfBirth} />
              <Text style={styles.label}>Phone</Text>
              <TextInput style={styles.input} placeholder="0912345678" placeholderTextColor="#BCAAA4" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              {formError ? <Text style={styles.error}>{formError}</Text> : null}
              <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.7 }]} onPress={handleCreate} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>Create Staff</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  title: { fontSize: 20, fontWeight: '800', color: '#2C1810' },
  sub: { fontSize: 13, color: '#8D6E63', marginTop: 2 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D35400', justifyContent: 'center', alignItems: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: '#8D6E63', marginTop: 12, fontWeight: '600' },
  createBtn: { backgroundColor: '#D35400', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12, marginTop: 16 },
  createBtnText: { color: '#FFF', fontWeight: '700' },
  list: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F5EBE6' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2980B9', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: '#2C1810' },
  email: { fontSize: 12, color: '#8D6E63', marginTop: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F5EBE6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#F0E4DC' },
  actionText: { fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(44,24,16,0.5)' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  label: { fontSize: 13, fontWeight: '600', color: '#2C1810', marginTop: 12, marginBottom: 4 },
  input: { backgroundColor: '#FFF8F0', borderRadius: 10, padding: 12, fontSize: 14, color: '#2C1810', borderWidth: 1, borderColor: '#E8D5C4' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderOpt: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E8D5C4', alignItems: 'center', backgroundColor: '#FFF8F0' },
  genderSelected: { backgroundColor: '#D35400', borderColor: '#D35400' },
  genderText: { fontSize: 13, fontWeight: '600', color: '#2C1810' },
  genderTextSelected: { color: '#FFF' },
  error: { color: '#E74C3C', fontSize: 12, marginTop: 8, textAlign: 'center' },
  submitBtn: { backgroundColor: '#D35400', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20, marginBottom: 20 },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
