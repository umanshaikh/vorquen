import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          customer_email,
          customer_phone,
          total_amount,
          order_status,
          payment_status,
          fulfillment_status,
          placed_at
        `)
        .order('placed_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      console.error('Error fetching orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateFulfillment = async (orderId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'unfulfilled' ? 'processing' : 'fulfilled';

    try {
      const { error } = await supabase
        .from('orders')
        .update({ fulfillment_status: nextStatus })
        .eq('id', orderId);

      if (error) throw error;
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#c9a96e" />
        <Text style={styles.loadingText}>Loading client orders from Supabase...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Fulfillment</Text>
        <Text style={styles.subtitle}>{orders.length} Total Registered Requisitions</Text>
      </View>

      <ScrollView style={styles.list}>
        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No orders received yet.</Text>
            <Text style={styles.emptySubtext}>Orders submitted by shoppers will appear here in real time.</Text>
          </View>
        ) : (
          orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                  <Text style={styles.clientEmail}>{order.customer_email}</Text>
                </View>
                <Text style={styles.amount}>₹{order.total_amount?.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.statusRow}>
                <View style={styles.badgeGroup}>
                  <View
                    style={[
                      styles.badge,
                      order.payment_status === 'paid' ? styles.badgePaid : styles.badgePending,
                    ]}
                  >
                    <Text style={styles.badgeText}>PAYMENT: {order.payment_status.toUpperCase()}</Text>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      order.fulfillment_status === 'fulfilled' ? styles.badgeFulfilled : styles.badgePending,
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      STATUS: {order.fulfillment_status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {order.fulfillment_status !== 'fulfilled' && (
                  <TouchableOpacity
                    style={styles.fulfillBtn}
                    onPress={() => handleUpdateFulfillment(order.id, order.fulfillment_status)}
                  >
                    <Text style={styles.fulfillBtnText}>
                      MARK {order.fulfillment_status === 'unfulfilled' ? 'PROCESSING' : 'FULFILLED'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
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
  emptyBox: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#666',
    fontSize: 11,
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
    marginBottom: 12,
  },
  orderNumber: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  clientEmail: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  amount: {
    color: '#c9a96e',
    fontSize: 16,
    fontWeight: '800',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopColor: '#202020',
    borderTopWidth: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  badgePaid: {
    backgroundColor: '#133923',
  },
  badgePending: {
    backgroundColor: '#382f14',
  },
  badgeFulfilled: {
    backgroundColor: '#1a334a',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  fulfillBtn: {
    backgroundColor: '#1a1a1a',
    borderColor: '#444',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 3,
  },
  fulfillBtnText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
