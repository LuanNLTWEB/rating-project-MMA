import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { getProfile, updateProfile, uploadAvatar } from '@/src/services/profileService';

const GENDERS = ['Male', 'Female', 'Other'];
const PHONE_REGEX = /^(0|\+84)[3-9][0-9]{8}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [favoritesPublic, setFavoritesPublic] = useState(false);
  const [watchlistPublic, setWatchlistPublic] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleUploadAvatar(result.assets[0]);
    }
  };

  const handleUploadAvatar = async (asset) => {
    try {
      setUploadingAvatar(true);
      
      const formData = new FormData();
      formData.append('avatar', {
        uri: Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri,
        name: asset.fileName || `avatar_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      
      const response = await uploadAvatar(formData);
      
      setUser(response.user);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setUser(data);
      setName(data.name || '');
      setGender(data.gender || '');
      setDateOfBirth(data.dateOfBirth || '');
      setPhone(data.phone || '');
      setFavoritesPublic(data.favoritesPublic || false);
      setWatchlistPublic(data.watchlistPublic || false);
    } catch {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setName(parsed.name || '');
        setGender(parsed.gender || '');
        setDateOfBirth(parsed.dateOfBirth || '');
        setPhone(parsed.phone || '');
        setFavoritesPublic(parsed.favoritesPublic || false);
        setWatchlistPublic(parsed.watchlistPublic || false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const onDateChange = (_event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDateOfBirth(formatDate(selectedDate));
    }
  };

  const dateToObject = (dateStr) => {
    if (DATE_REGEX.test(dateStr)) {
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date(2000, 0, 1);
  };

  const validate = () => {
    if (!name.trim()) return 'Name is required';
    if (!gender) return 'Please select your gender';
    if (!DATE_REGEX.test(dateOfBirth)) return 'Invalid date format';
    const dobYear = parseInt(dateOfBirth.split('-')[0]);
    if (dobYear < 1900 || dobYear > new Date().getFullYear()) return 'Invalid year';
    if (!phone.trim()) return 'Phone number is required';
    if (!PHONE_REGEX.test(phone.trim().replace(/\s/g, ''))) return 'Invalid phone number';
    if (newPassword && newPassword.length < 6) return 'New password must be at least 6 characters';
    return null;
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        gender,
        dateOfBirth,
        phone: phone.trim().replace(/\s/g, ''),
        favoritesPublic,
        watchlistPublic,
      };
      if (newPassword) {
        payload.newPassword = newPassword;
      }

      const data = await updateProfile(payload);

      await AsyncStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Update failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
    setSuccess('');
    if (user) {
      setName(user.name || '');
      setGender(user.gender || '');
      setDateOfBirth(user.dateOfBirth || '');
      setPhone(user.phone || '');
      setFavoritesPublic(user.favoritesPublic || false);
      setWatchlistPublic(user.watchlistPublic || false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
            <MaterialIcons name="edit" size={20} color="#D35400" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <MaterialIcons name={user?.gender === 'Male' ? 'male' : user?.gender === 'Female' ? 'female' : 'person'} size={48} color="#FFFFFF" />
              </View>
            )}
            {editing && (
              <TouchableOpacity style={styles.avatarEditBtn} onPress={pickImage} disabled={uploadingAvatar}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <MaterialIcons name="camera-alt" size={16} color="#FFF" />
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.displayName}>{user?.name}</Text>
          <Text style={styles.displayEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase()}</Text>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{success}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{editing ? 'Edit Profile' : 'Personal Information'}</Text>

          <Text style={styles.label}>Name</Text>
          {editing ? (
            <TextInput style={styles.input} value={name} onChangeText={setName} autoCapitalize="words" />
          ) : (
            <Text style={styles.value}>{user?.name}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>

          <Text style={styles.label}>Gender</Text>
          {editing ? (
            <View style={styles.genderRow}>
              {GENDERS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderOption, gender === g && styles.genderSelected]}
                  onPress={() => setGender(g)}
                >
                  <MaterialIcons
                    name={g === 'Male' ? 'male' : g === 'Female' ? 'female' : 'person'}
                    size={16}
                    color={gender === g ? '#FFF' : '#8D6E63'}
                  />
                  <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.value}>{user?.gender}</Text>
          )}

          <Text style={styles.label}>Date of Birth</Text>
          {editing ? (
            <>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(true)}>
                <Text style={styles.dateText}>{dateOfBirth || 'Tap to select date'}</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={dateToObject(dateOfBirth)}
                  mode="date"
                  display={Platform.OS === 'android' ? 'default' : 'spinner'}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                  onChange={onDateChange}
                />
              )}
            </>
          ) : (
            <Text style={styles.value}>{user?.dateOfBirth}</Text>
          )}

          <Text style={styles.label}>Phone</Text>
          {editing ? (
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          ) : (
            <Text style={styles.value}>{user?.phone}</Text>
          )}

          {editing && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.pwdNavBtn} onPress={() => router.push('/change-password')}>
                <MaterialIcons name="lock-outline" size={20} color="#D35400" />
                <Text style={styles.pwdNavText}>Change Password</Text>
                <MaterialIcons name="chevron-right" size={20} color="#A1887F" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {user?.role === 'customer' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Privacy Settings</Text>
          <Text style={styles.privacyDesc}>Control who can see your personal lists</Text>

          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <MaterialIcons name="favorite" size={20} color="#D35400" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.privacyLabel}>Favorites List</Text>
                <Text style={styles.privacySubtext}>{favoritesPublic ? 'Public' : 'Private'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, favoritesPublic && styles.toggleActive]}
              onPress={() => {
                if (editing) setFavoritesPublic(!favoritesPublic);
              }}
            >
              <View style={[styles.toggleDot, favoritesPublic && styles.toggleDotActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.privacyRow}>
            <View style={styles.privacyInfo}>
              <MaterialIcons name="visibility" size={20} color="#D35400" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.privacyLabel}>Watchlist</Text>
                <Text style={styles.privacySubtext}>{watchlistPublic ? 'Public' : 'Private'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, watchlistPublic && styles.toggleActive]}
              onPress={() => {
                if (editing) setWatchlistPublic(!watchlistPublic);
              }}
            >
              <View style={[styles.toggleDot, watchlistPublic && styles.toggleDotActive]} />
            </TouchableOpacity>
          </View>
        </View>
        )}

        {!editing && (
          <>
            <TouchableOpacity style={styles.activityBtn} onPress={() => router.push('/activity')}>
              <MaterialIcons name="history" size={20} color="#D35400" />
              <Text style={styles.activityBtnText}>View Activity History</Text>
              <MaterialIcons name="chevron-right" size={20} color="#A1887F" />
            </TouchableOpacity>
          </>
        )}

        {editing && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={saving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F5EBE6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  editBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F5EBE6' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#D35400', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E8D5C4' },
  avatarEditBtn: { position: 'absolute', bottom: 0, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: '#2980B9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF8F0' },
  displayName: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  displayEmail: { fontSize: 14, color: '#8D6E63', marginTop: 4 },
  roleBadge: { marginTop: 8, backgroundColor: '#FBEBE1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  roleText: { fontSize: 11, fontWeight: '700', color: '#D35400' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#F5EBE6', shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#2C1810', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#8D6E63', marginTop: 12, marginBottom: 4 },
  value: { fontSize: 15, color: '#2C1810', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  input: { backgroundColor: '#FFF8F0', borderRadius: 10, padding: 12, fontSize: 15, color: '#2C1810', borderWidth: 1, borderColor: '#E8D5C4' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E8D5C4', backgroundColor: '#FFF8F0' },
  genderSelected: { backgroundColor: '#D35400', borderColor: '#D35400' },
  genderText: { fontSize: 13, color: '#8D6E63', fontWeight: '600' },
  genderTextSelected: { color: '#FFFFFF' },
  dateButton: { backgroundColor: '#FFF8F0', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E8D5C4' },
  dateText: { fontSize: 15, color: '#2C1810' },
  divider: { borderTopWidth: 1, borderTopColor: '#F5EBE6', marginTop: 16, marginBottom: 4 },
  pwdNavBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  pwdNavText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2C1810', marginLeft: 10 },
  activityBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#F5EBE6' },
  activityBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2C1810', marginLeft: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E8D5C4' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#8D6E63' },
  saveBtn: { flex: 1, backgroundColor: '#D35400', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  error: { color: '#E74C3C', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  success: { color: '#27AE60', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  privacyDesc: { fontSize: 13, color: '#8D6E63', marginBottom: 16 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F5EBE6' },
  privacyInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  privacyLabel: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  privacySubtext: { fontSize: 12, color: '#8D6E63', marginTop: 2 },
  toggleBtn: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#E0D5CC', justifyContent: 'center', paddingHorizontal: 3 },
  toggleActive: { backgroundColor: '#D35400' },
  toggleDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  toggleDotActive: { alignSelf: 'flex-end' },
});
