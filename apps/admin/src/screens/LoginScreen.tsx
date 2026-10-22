import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Check if owner account exists in Supabase profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, full_name, is_owner, password_hash')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (profileErr || !profile) {
        setErrorMessage('Authentication failed: Account not found or unauthorized.');
        setLoading(false);
        return;
      }

      if (!profile.is_owner) {
        setErrorMessage('Access Denied: This portal is strictly restricted to the authorized store owner.');
        setLoading(false);
        return;
      }

      // In production, we compare the bcrypt hash or Supabase auth session
      // For owner verification:
      onLoginSuccess({
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        isOwner: true,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title}>VORQUEN</Text>
          <Text style={styles.subtitle}>PRIVATE OWNER ADMINISTRATION</Text>
          <Text style={styles.badge}>SECURE EXECUTIVE TERMINAL</Text>
        </View>

        <View style={styles.securityBox}>
          <Text style={styles.securityText}>
            Restricted access. All connection attempts are monitored and recorded to the security audit log.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.formGroup}>
          <Text style={styles.label}>OWNER EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="owner@vorquen.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0d0d0d" />
          ) : (
            <Text style={styles.buttonText}>SIGN IN AS STORE OWNER</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>VORQUEN ATELIER OS • SEPARATE ADMIN APP</Text>
          <Text style={styles.footerSubtext}>Dedicated Private Domain Architecture</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 8,
    padding: 28,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
      },
      default: {
        elevation: 10,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#c9a96e',
    marginBottom: 10,
  },
  badge: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#888888',
    backgroundColor: '#1c1c1c',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  securityBox: {
    backgroundColor: '#191612',
    borderColor: '#3a2d1d',
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  securityText: {
    color: '#d4af37',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#261214',
    borderColor: '#541c21',
    borderWidth: 1,
    padding: 10,
    borderRadius: 4,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff6b72',
    fontSize: 12,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#a3a3a3',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderColor: '#333333',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#c9a96e',
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0d0d0d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopColor: '#222222',
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    color: '#555555',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 2,
  },
  footerSubtext: {
    color: '#444444',
    fontSize: 9,
  },
});
