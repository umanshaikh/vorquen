import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone_number,
          is_owner,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (err: any) {
      console.error('Error fetching customers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#c9a96e" />
        <Text style={styles.loadingText}>Loading client directory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Client Directory</Text>
        <Text style={styles.subtitle}>{customers.length} Accounts in Production Database</Text>
      </View>

      <ScrollView style={styles.list}>
        {customers.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.name}>{c.full_name || 'VORQUEN Client'}</Text>
                <Text style={styles.email}>{c.email}</Text>
                {c.phone_number ? (
                  <Text style={styles.phone}>Phone: {c.phone_number}</Text>
                ) : null}
              </View>
              {c.is_owner ? (
                <View style={styles.ownerBadge}>
                  <Text style={styles.ownerBadgeText}>STORE OWNER</Text>
                </View>
              ) : (
                <View style={styles.clientBadge}>
                  <Text style={styles.clientBadgeText}>CLIENT</Text>
                </View>
              )}
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.dateLabel}>
                Registered: {new Date(c.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 12,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#c9a96e',
    marginTop: 2,
  },
  list: {
    flex: 1,
  },
  card: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  email: {
    color: '#c9a96e',
    fontSize: 12,
    marginTop: 2,
  },
  phone: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  ownerBadge: {
    backgroundColor: '#3a2d1d',
    borderColor: '#c9a96e',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  ownerBadgeText: {
    color: '#d4af37',
    fontSize: 9,
    fontWeight: '800',
  },
  clientBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  clientBadgeText: {
    color: '#888',
    fontSize: 9,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 12,
    paddingTop: 8,
    borderTopColor: '#1e1e1e',
    borderTopWidth: 1,
  },
  dateLabel: {
    color: '#555',
    fontSize: 10,
  },
});
