import React from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Contact, createContact, deleteContact, listContacts, updateContact } from '../api/contacts';
import { AppHeader } from '../components/AppHeader';
import { StoreCard } from '../components/StoreCard';
import { colors, radius, spacing } from '../theme';
import { sharedStyles } from '../styles/shared';

export default function ContactsScreen() {
  const navigation = useNavigation();
  const [contacts, setContacts] = React.useState<Contact[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [editorVisible, setEditorVisible] = React.useState(false);
  const [editing, setEditing] = React.useState<Contact | null>(null);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const fetchAll = React.useCallback(async (opts?: { isRefresh?: boolean }) => {
    if (!opts?.isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await listContacts();
      setContacts(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchAll({ isRefresh: true });
  }, [fetchAll]);

  const openCreate = React.useCallback(() => {
    setEditing(null);
    setName('');
    setPhone('');
    setEditorVisible(true);
  }, []);

  const openEdit = React.useCallback((c: Contact) => {
    setEditing(c);
    setName(c.name || '');
    setPhone(c.phone_number || '');
    setEditorVisible(true);
  }, []);

  const onSubmit = React.useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName || !trimmedPhone) {
      Alert.alert('Missing info', 'Please enter name and phone number.');
      return;
    }
    try {
      if (editing) {
        await updateContact(editing.id, { name: trimmedName, phone_number: trimmedPhone });
      } else {
        await createContact({ name: trimmedName, phone_number: trimmedPhone });
      }
      setEditorVisible(false);
      await fetchAll();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message || 'Unable to save contact');
    }
  }, [editing, name, phone, fetchAll]);

  const onDelete = React.useCallback((c: Contact) => {
    Alert.alert('Delete contact', `Delete ${c.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteContact(c.id);
            await fetchAll();
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message || 'Unable to delete contact');
          }
        },
      },
    ]);
  }, [fetchAll]);

  const dial = React.useCallback((raw: string) => {
    const tel = raw.replace(/[^\d+]/g, '');
    Linking.openURL(`tel:${tel}`).catch(() =>
      Alert.alert('Call failed', 'Unable to initiate the call on this device.'),
    );
  }, []);

  const headerActions = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      <TouchableOpacity onPress={openCreate} style={sharedStyles.secondaryButton}>
        <Text style={sharedStyles.secondaryButtonText}>Add</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()} style={sharedStyles.secondaryButton}>
        <Text style={sharedStyles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <AppHeader title="Contacts" action={headerActions} />

      {loading && !contacts ? (
        <View style={sharedStyles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={sharedStyles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={sharedStyles.centerBox}>
          <Text style={sharedStyles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={contacts || []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={sharedStyles.listContent}
          renderItem={({ item }) => (
            <StoreCard>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <TouchableOpacity onPress={() => dial(item.phone_number)}>
                    <Text style={sharedStyles.link}>{item.phone_number}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={sharedStyles.secondaryButtonSmall}>
                    <Text style={sharedStyles.secondaryButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item)} style={sharedStyles.secondaryButtonSmall}>
                    <Text style={sharedStyles.secondaryButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </StoreCard>
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            !loading && (!contacts || contacts.length === 0) ? (
              <View style={sharedStyles.centerBox}>
                <Text style={sharedStyles.muted}>No contacts</Text>
              </View>
            ) : null
          }
        />
      )}

      <Modal visible={editorVisible} transparent animationType="fade" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditorVisible(false)} />
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Contact' : 'Add Contact'}</Text>
            <Text style={sharedStyles.fieldLabel}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor={colors.textPlaceholder}
              style={sharedStyles.input}
            />
            <Text style={[sharedStyles.fieldLabel, { marginTop: spacing.md }]}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +1-222-333-4444"
              placeholderTextColor={colors.textPlaceholder}
              keyboardType="phone-pad"
              style={sharedStyles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setEditorVisible(false)} style={sharedStyles.secondaryButton}>
                <Text style={sharedStyles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSubmit} style={sharedStyles.primaryButton}>
                <Text style={sharedStyles.primaryButtonText}>{editing ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.bgDefault,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalPanel: {
    width: '90%',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 6,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
