import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getUserProfile } from '@/src/services/profileService';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile(userId);
      setUser(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D35400" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getGenderIcon = () => {
    if (user?.gender === 'Male') return 'male';
    if (user?.gender === 'Female') return 'female';
    return 'person';
  };

  const getRoleColor = () => {
    if (user?.role === 'admin') return '#E74C3C';
    if (user?.role === 'staff') return '#3498DB';
    return '#D35400';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name={getGenderIcon()} size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.displayName}>{user?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor() }]}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Information</Text>

          <Text style={styles.label}>Gender</Text>
          <Text style={styles.value}>{user?.gender || 'Not specified'}</Text>

          <Text style={styles.label}>Date of Birth</Text>
          <Text style={styles.value}>{user?.dateOfBirth || 'Not specified'}</Text>

          <Text style={styles.label}>Member Since</Text>
          <Text style={styles.value}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#D35400',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  displayName: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  roleBadge: { marginTop: 8, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20,
    borderWidth: 1, borderColor: '#F5EBE6',
    shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C1810', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#8D6E63', marginTop: 12, marginBottom: 4 },
  value: {
    fontSize: 15, color: '#2C1810', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F5EBE6',
  },
  errorText: { fontSize: 15, color: '#E74C3C', marginTop: 12 },
});
