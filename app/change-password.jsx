import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { updateProfile } from '@/src/services/profileService';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validate = () => {
    if (!currentPassword) return 'Current password is required';
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 6) return 'New password must be at least 6 characters';
    if (!/[A-Z]/.test(newPassword)) return 'New password must contain at least one uppercase letter';
    if (!/[a-z]/.test(newPassword)) return 'New password must contain at least one lowercase letter';
    if (!/[0-9]/.test(newPassword)) return 'New password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) return 'New password must contain at least one special character';
    if (newPassword === currentPassword) return 'New password must be different from current password';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleChange = async () => {
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      await updateProfile({
        currentPassword,
        newPassword,
      });
      setSuccess('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Change password failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}

          <Text style={styles.label}>Current Password</Text>
          <View style={styles.pwdRow}>
            <TextInput
              style={styles.pwdInput}
              placeholder="Enter current password"
              placeholderTextColor="#A1887F"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrent}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCurrent(!showCurrent)}>
              <MaterialIcons name={showCurrent ? 'visibility-off' : 'visibility'} size={20} color="#8D6E63" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>New Password</Text>
          <View style={styles.pwdRow}>
            <TextInput
              style={styles.pwdInput}
              placeholder="At least 6 characters"
              placeholderTextColor="#A1887F"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNew(!showNew)}>
              <MaterialIcons name={showNew ? 'visibility-off' : 'visibility'} size={20} color="#8D6E63" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.pwdRow}>
            <TextInput
              style={styles.pwdInput}
              placeholder="Re-enter new password"
              placeholderTextColor="#A1887F"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
              <MaterialIcons name={showConfirm ? 'visibility-off' : 'visibility'} size={20} color="#8D6E63" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleChange}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Change Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F5EBE6' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#F5EBE6' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#F5EBE6', shadowColor: '#2C1810', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#8D6E63', marginTop: 12, marginBottom: 4 },
  pwdRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8F0', borderRadius: 10, borderWidth: 1, borderColor: '#E8D5C4' },
  pwdInput: { flex: 1, padding: 12, fontSize: 15, color: '#2C1810' },
  eyeBtn: { padding: 10 },
  error: { color: '#E74C3C', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  success: { color: '#27AE60', fontSize: 13, textAlign: 'center', marginBottom: 8 },
  saveBtn: { backgroundColor: '#D35400', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
