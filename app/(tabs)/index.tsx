import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function HomeScreen() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Movie & Anime</Text>
      <Text style={styles.subtitle}>Your personal rating community</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C1810',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8D6E63',
    marginBottom: 32,
  },
  logoutButton: {
    backgroundColor: '#D35400',
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
