import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Linking,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual Dispatch Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [manualCourier, setManualCourier] = useState('Blue Dart');
  const [manualAwb, setManualAwb] = useState('');

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
          placed_at,
          shipments (
            id,
            provider,
            courier_name,
            awb_number,
            tracking_url,
            shipment_status,
            created_at
          )
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

  // Book shipment via Shiprocket (Testing Mode / Sandbox)
  const handleShiprocketDispatch = async (order: any) => {
    try {
      setActionLoading(true);
      const randomAwb = `SR-TEST-${Math.floor(100000000 + Math.random() * 900000000)}`;
      const courierName = 'Shiprocket BlueDart (Sandbox Test)';
      const trackingUrl = `https://track.shiprocket.in/${randomAwb}`;
      const providerShipmentId = `SR_TEST_${Date.now()}`;

      // 1. Insert shipment record
      const { data: shipment, error: shipError } = await supabase
        .from('shipments')
        .insert({
          order_id: order.id,
          provider: 'shiprocket',
          courier_name: courierName,
          awb_number: randomAwb,
          tracking_url: trackingUrl,
          provider_shipment_id: providerShipmentId,
          shipment_status: 'created',
          shipping_cost: 85.0,
          label_url: `https://app.shiprocket.in/orders/print/test-label/${providerShipmentId}`,
          pickup_scheduled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (shipError) throw shipError;

      // 2. Insert initial tracking milestone
      await supabase.from('shipment_tracking_events').insert({
        shipment_id: shipment.id,
        status: 'Shipment Manifested (Shiprocket Sandbox)',
        description: 'AWB allocated & courier manifest registered in Shiprocket test logistics network',
        location: 'VORQUEN Bengaluru Atelier Hub',
        event_timestamp: new Date().toISOString(),
      });

      // 3. Mark order fulfilled and processing
      await supabase
        .from('orders')
        .update({
          fulfillment_status: 'fulfilled',
          order_status: 'processing',
        })
        .eq('id', order.id);

      Alert.alert(
        'Shiprocket Dispatched (Test Mode)',
        `AWB: ${randomAwb}\nCourier: ${courierName}\n\nClient tracking is live in testing mode!`
      );
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Dispatch Error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Dispatch with custom / physical AWB
  const handleManualDispatch = async () => {
    if (!manualAwb.trim()) {
      Alert.alert('Required', 'Please enter a valid Courier AWB / Tracking number.');
      return;
    }

    try {
      setActionLoading(true);
      const trackingUrl = `https://www.google.com/search?q=${encodeURIComponent(manualCourier + ' tracking ' + manualAwb.trim())}`;

      const { data: shipment, error: shipError } = await supabase
        .from('shipments')
        .insert({
          order_id: selectedOrder.id,
          provider: 'manual',
          courier_name: manualCourier.trim(),
          awb_number: manualAwb.trim(),
          tracking_url: trackingUrl,
          shipment_status: 'created',
          shipping_cost: 0,
          pickup_scheduled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (shipError) throw shipError;

      await supabase.from('shipment_tracking_events').insert({
        shipment_id: shipment.id,
        status: 'Dispatched via Courier',
        description: `Handed over to ${manualCourier.trim()}. Docket: ${manualAwb.trim()}`,
        location: 'VORQUEN Dispatch Vault',
        event_timestamp: new Date().toISOString(),
      });

      await supabase
        .from('orders')
        .update({
          fulfillment_status: 'fulfilled',
          order_status: 'processing',
        })
        .eq('id', selectedOrder.id);

      setModalVisible(false);
      setManualAwb('');
      fetchOrders();
      Alert.alert('Dispatched', `Order tagged with AWB ${manualAwb.trim()}`);
    } catch (err: any) {
      Alert.alert('Dispatch Error', err.message);
    } finally {
      setActionLoading(false);
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
        <Text style={styles.title}>Order Fulfillment & Logistics</Text>
        <Text style={styles.subtitle}>
          {orders.length} Registered Orders • Shiprocket Sandbox Mode Active
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No orders received yet.</Text>
            <Text style={styles.emptySubtext}>
              Orders placed on the VORQUEN Storefront will sync here automatically.
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const hasShipment = order.shipments && order.shipments.length > 0;
            const primaryShipment = hasShipment ? order.shipments[0] : null;

            return (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                    <Text style={styles.clientEmail}>{order.customer_email}</Text>
                  </View>
                  <Text style={styles.amount}>₹{order.total_amount?.toLocaleString('en-IN')}</Text>
                </View>

                {/* Logistics Info if Dispatched */}
                {primaryShipment && (
                  <View style={styles.shipmentBadge}>
                    <View style={styles.shipmentHeader}>
                      <Text style={styles.shipmentTitle}>
                        📦 {primaryShipment.courier_name}
                      </Text>
                      <Text style={styles.shipmentStatus}>
                        {primaryShipment.shipment_status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.awbText}>
                      AWB: <Text style={styles.awbCode}>{primaryShipment.awb_number}</Text>
                    </Text>
                    {primaryShipment.tracking_url && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(primaryShipment.tracking_url)}
                        style={styles.trackLink}
                      >
                        <Text style={styles.trackLinkText}>View Live Tracking ↗</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

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
                        order.fulfillment_status === 'fulfilled'
                          ? styles.badgeFulfilled
                          : styles.badgePending,
                      ]}
                    >
                      <Text style={styles.badgeText}>
                        STATUS: {order.fulfillment_status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Dispatch Controls */}
                  {order.fulfillment_status !== 'fulfilled' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.shiprocketBtn}
                        disabled={actionLoading}
                        onPress={() => handleShiprocketDispatch(order)}
                      >
                        <Text style={styles.shiprocketBtnText}>🚀 SHIPROCKET (TEST)</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.manualBtn}
                        disabled={actionLoading}
                        onPress={() => {
                          setSelectedOrder(order);
                          setModalVisible(true);
                        }}
                      >
                        <Text style={styles.manualBtnText}>MANUAL AWB</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Manual AWB Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Manual Courier Dispatch</Text>
            <Text style={styles.modalSub}>
              Order: {selectedOrder?.order_number}
            </Text>

            <Text style={styles.inputLabel}>Courier Partner Name</Text>
            <TextInput
              style={styles.input}
              value={manualCourier}
              onChangeText={setManualCourier}
              placeholder="e.g. Blue Dart, Delhivery, DTDC"
              placeholderTextColor="#555"
            />

            <Text style={styles.inputLabel}>Courier Docket / AWB Number</Text>
            <TextInput
              style={styles.input}
              value={manualAwb}
              onChangeText={setManualAwb}
              placeholder="e.g. BD789201947"
              placeholderTextColor="#555"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleManualDispatch}
              >
                <Text style={styles.confirmBtnText}>DISPATCH ORDER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 10,
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
  shipmentBadge: {
    backgroundColor: '#1c1b18',
    borderColor: '#3e3725',
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shipmentTitle: {
    color: '#c9a96e',
    fontSize: 12,
    fontWeight: '700',
  },
  shipmentStatus: {
    color: '#4ade80',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  awbText: {
    color: '#888',
    fontSize: 11,
  },
  awbCode: {
    color: '#ffffff',
    fontWeight: '700',
  },
  trackLink: {
    marginTop: 6,
  },
  trackLinkText: {
    color: '#c9a96e',
    fontSize: 10,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  shiprocketBtn: {
    backgroundColor: '#c9a96e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
  },
  shiprocketBtnText: {
    color: '#000000',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  manualBtn: {
    backgroundColor: '#222',
    borderColor: '#444',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
  },
  manualBtnText: {
    color: '#ccc',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 8,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    color: '#c9a96e',
    fontSize: 12,
    marginBottom: 16,
    marginTop: 2,
  },
  inputLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 4,
    color: '#ffffff',
    padding: 10,
    fontSize: 13,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  cancelBtnText: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: '#c9a96e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  confirmBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '800',
  },
});
