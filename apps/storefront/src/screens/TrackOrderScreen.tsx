import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface TrackOrderScreenProps {
  initialOrderNumber?: string;
  onContinueShopping: () => void;
}

export default function TrackOrderScreen({
  initialOrderNumber = '',
  onContinueShopping,
}: TrackOrderScreenProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleTrack = async () => {
    if (!orderNumber.trim()) {
      Alert.alert('Required', 'Please enter your VORQUEN order number (e.g. VQ-2026-...)');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          order_status,
          payment_status,
          fulfillment_status,
          total_amount,
          placed_at,
          shipments (
            id,
            courier_name,
            awb_number,
            shipment_status,
            tracking_url
          )
        `)
        .eq('order_number', orderNumber.trim())
        .single();

      if (error || !data) {
        setOrder(null);
      } else {
        setOrder(data);
      }
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Track Atelier Requisition</Text>
        <Text style={styles.subtitle}>Real-Time Courier &amp; Fulfillment Milestones</Text>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Enter Order Number (e.g. VQ-2026-12345)"
          placeholderTextColor="#666"
          value={orderNumber}
          onChangeText={setOrderNumber}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.trackBtn} onPress={handleTrack} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0d0d0d" />
          ) : (
            <Text style={styles.trackBtnText}>LOCATE</Text>
          )}
        </TouchableOpacity>
      </View>

      {searched && !loading && !order && (
        <View style={styles.card}>
          <Text style={styles.notFoundTitle}>Order Not Found</Text>
          <Text style={styles.notFoundDesc}>
            No requisition matching "{orderNumber}" was found in our atelier records.
          </Text>
        </View>
      )}

      {order && (
        <View style={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.cardOrderNum}>{order.order_number}</Text>
              <Text style={styles.cardDate}>
                Placed: {new Date(order.placed_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.cardAmount}>₹{order.total_amount?.toLocaleString('en-IN')}</Text>
          </View>

          {/* Timeline Milestones */}
          <View style={styles.timeline}>
            <View style={styles.milestone}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Requisition Received & Verified</Text>
                <Text style={styles.milestoneSub}>Order registered in atelier database.</Text>
              </View>
            </View>

            <View style={styles.milestone}>
              <View
                style={[
                  styles.dot,
                  order.fulfillment_status === 'processing' || order.fulfillment_status === 'fulfilled'
                    ? styles.dotActive
                    : styles.dotInactive,
                ]}
              />
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Garment Inspection & Preparation</Text>
                <Text style={styles.milestoneSub}>Silhouettes inspected and packed with security seals.</Text>
              </View>
            </View>

            <View style={styles.milestone}>
              <View
                style={[
                  styles.dot,
                  order.fulfillment_status === 'fulfilled' ? styles.dotActive : styles.dotInactive,
                ]}
              />
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Dispatched with Logistics Courier</Text>
                <Text style={styles.milestoneSub}>
                  {order.shipments?.[0]?.courier_name
                    ? `${order.shipments[0].courier_name} • AWB: ${order.shipments[0].awb_number}`
                    : 'Awaiting courier airway bill generation.'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.continueBtn} onPress={onContinueShopping}>
        <Text style={styles.continueBtnText}>← CONTINUE BROWSING ATELIER</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#c9a96e',
    marginTop: 2,
  },
  searchBox: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#141414',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  trackBtn: {
    backgroundColor: '#c9a96e',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 4,
  },
  trackBtnText: {
    color: '#0d0d0d',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 6,
    padding: 18,
    marginBottom: 24,
  },
  notFoundTitle: {
    color: '#ff6b72',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  notFoundDesc: {
    color: '#888',
    fontSize: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    borderBottomColor: '#202020',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  cardOrderNum: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  cardDate: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  cardAmount: {
    color: '#c9a96e',
    fontSize: 16,
    fontWeight: '800',
  },
  timeline: {
    paddingLeft: 4,
  },
  milestone: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
    marginTop: 3,
  },
  dotActive: {
    backgroundColor: '#c9a96e',
  },
  dotInactive: {
    backgroundColor: '#333',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  milestoneSub: {
    color: '#777',
    fontSize: 11,
  },
  continueBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  continueBtnText: {
    color: '#c9a96e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
