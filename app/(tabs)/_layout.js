import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../src/constants/theme';
import { useI18n } from '../../src/i18n';
import { useApp } from '../../src/context/AppContext';

const TAB_ICONS = {
  sort: { normal: require('../../assets/tabs/tab-sort.png'), active: require('../../assets/tabs/tab-sort-active.png') },
  trash: { normal: require('../../assets/tabs/tab-trash.png'), active: require('../../assets/tabs/tab-trash-active.png') },
  duplicates: { normal: require('../../assets/tabs/tab-duplicates.png'), active: require('../../assets/tabs/tab-duplicates-active.png') },
  stats: { normal: require('../../assets/tabs/tab-stats.png'), active: require('../../assets/tabs/tab-stats-active.png') },
  settings: { normal: require('../../assets/tabs/tab-settings.png'), active: require('../../assets/tabs/tab-settings-active.png') },
};

function TabIcon({ iconKey, label, focused, badge }) {
  const icon = focused ? TAB_ICONS[iconKey].active : TAB_ICONS[iconKey].normal;
  return (
    <View style={styles.tabItem}>
      <Image source={icon} style={styles.tabIcon} resizeMode="contain" />
      {badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { trashed } = useApp();
  const { t } = useI18n();

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarShowLabel: false }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon iconKey="sort" label={t('tab_sort')} focused={focused} /> }} />
      <Tabs.Screen name="trash" options={{ tabBarIcon: ({ focused }) => <TabIcon iconKey="trash" label={t('tab_trash')} focused={focused} badge={trashed.length} /> }} />
      <Tabs.Screen name="stats" options={{ tabBarIcon: ({ focused }) => <TabIcon iconKey="stats" label={t('tab_stats')} focused={focused} /> }} />
      <Tabs.Screen name="settings" options={{ tabBarIcon: ({ focused }) => <TabIcon iconKey="settings" label={t('tab_settings')} focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.tabBar,
    borderTopColor: COLORS.tabBarBorder,
    borderTopWidth: 1,
    height: 85,
    paddingTop: 8,
    paddingBottom: 20,
  },
  tabItem: { alignItems: 'center', justifyContent: 'center', position: 'relative', minWidth: 60 },
  tabIcon: { width: 26, height: 26 },
  tabLabel: { fontSize: 10, color: COLORS.tabInactive, marginTop: 3, fontWeight: '500' },
  tabLabelActive: { color: COLORS.tabActive, fontWeight: '700' },
  badge: {
    position: 'absolute', top: -6, right: -14,
    backgroundColor: COLORS.delete, borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
