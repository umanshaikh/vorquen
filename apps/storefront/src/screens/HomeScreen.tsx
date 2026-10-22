import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface HomeScreenProps {
  onExploreShop: () => void;
  onSelectFeatured: (productId: string) => void;
}

export default function HomeScreen({ onExploreShop, onSelectFeatured }: HomeScreenProps) {
  return (
    <ScrollView style={styles.container}>
      {/* Hero Banner */}
      <View style={styles.hero}>
        <Text style={styles.heroPretitle}>HAUTE COUTURE &bull; SCULPTURAL ATELIER</Text>
        <Text style={styles.heroTitle}>VORQUEN</Text>
        <Text style={styles.heroTagline}>
          Artisanal luxury silhouettes, sculptural tailoring, and visionary 3D fashion.
        </Text>

        <TouchableOpacity style={styles.heroBtn} onPress={onExploreShop}>
          <Text style={styles.heroBtnText}>EXPLORE ATELIER COLLECTION</Text>
        </TouchableOpacity>
      </View>

      {/* Featured 3D Garment Highlight */}
      <View style={styles.highlightCard}>
        <View style={styles.badgeRow}>
          <Text style={styles.highlightBadge}>3D INTERACTIVE SIGNATURE PIECE</Text>
        </View>
        <Text style={styles.highlightTitle}>VORQUEN Sculpted Silk Trench</Text>
        <Text style={styles.highlightDesc}>
          Tailored from pure Mulberry raw silk with architectural storm flaps, double-breasted horn buttons, and sculpted shoulders.
        </Text>
        <Text style={styles.highlightPrice}>₹12,999</Text>

        <TouchableOpacity
          style={styles.view3dBtn}
          onPress={() => onSelectFeatured('a1111111-1111-4000-8000-000000000001')}
        >
          <Text style={styles.view3dBtnText}>VIEW 3D SILHOUETTE &amp; DETAILS</Text>
        </TouchableOpacity>
      </View>

      {/* Pillars Section */}
      <View style={styles.pillarsGrid}>
        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>01</Text>
          <Text style={styles.pillarTitle}>Bespoke Craft</Text>
          <Text style={styles.pillarText}>Every silhouette cut with mathematical precision and hand-finished seams.</Text>
        </View>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>02</Text>
          <Text style={styles.pillarTitle}>Digital Atelier</Text>
          <Text style={styles.pillarText}>Interactive 3D geometry allowing 360-degree inspection of garment drape.</Text>
        </View>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>03</Text>
          <Text style={styles.pillarTitle}>White-Glove Delivery</Text>
          <Text style={styles.pillarText}>Express air shipping across India with sealed security tamper tags.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  hero: {
    paddingVertical: 40,
    alignItems: 'center',
    borderBottomColor: '#222',
    borderBottomWidth: 1,
    marginBottom: 28,
  },
  heroPretitle: {
    color: '#c9a96e',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 12,
  },
  heroTagline: {
    color: '#999999',
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
    marginBottom: 24,
  },
  heroBtn: {
    backgroundColor: '#c9a96e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 3,
  },
  heroBtnText: {
    color: '#0d0d0d',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2,
  },
  highlightCard: {
    backgroundColor: '#141414',
    borderColor: '#262626',
    borderWidth: 1,
    borderRadius: 8,
    padding: 24,
    marginBottom: 28,
  },
  badgeRow: {
    marginBottom: 8,
  },
  highlightBadge: {
    color: '#d4af37',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  highlightTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  highlightDesc: {
    color: '#888888',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  highlightPrice: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 18,
  },
  view3dBtn: {
    backgroundColor: '#1e1a14',
    borderColor: '#c9a96e',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 3,
    alignItems: 'center',
  },
  view3dBtnText: {
    color: '#d4af37',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 40,
  },
  pillarCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: '#121212',
    borderColor: '#222222',
    borderWidth: 1,
    borderRadius: 6,
    padding: 16,
  },
  pillarNumber: {
    color: '#444444',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  pillarTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  pillarText: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 16,
  },
});
