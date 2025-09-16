import React from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, Modal, RefreshControl, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Contact, createContact, deleteContact, listContacts, updateContact } from '../api/contacts';

export default function ContactsScreen({ onClose }: { onClose: () => void }) {
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
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteContact(c.id);
            await fetchAll();
          } catch (e: any) {
            Alert.alert('Delete failed', e?.message || 'Unable to delete contact');
          }
        }
      }
    ]);
  }, [fetchAll]);

  const dial = React.useCallback((raw: string) => {
    const tel = raw.replace(/[^\d+]/g, '');
    const url = `tel:${tel}`;
    Linking.openURL(url).catch(() => Alert.alert('Call failed', 'Unable to initiate the call on this device.'));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Contacts</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={openCreate} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Add</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && !contacts ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={styles.muted}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={contacts || []}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowSpaceBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <TouchableOpacity onPress={() => dial(item.phone_number)}>
                    <Text style={styles.phone}>{item.phone_number}</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.secondaryButtonSmall}>
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item)} style={styles.secondaryButtonSmall}>
                    <Text style={styles.secondaryButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={(!loading && (!contacts || contacts.length === 0)) ? (
            <View style={styles.centerBox}>
              <Text style={styles.muted}>No contacts</Text>
            </View>
          ) : null}
        />
      )}

      <Modal visible={editorVisible} transparent animationType="fade" onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setEditorVisible(false)} />
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Contact' : 'Add Contact'}</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
            <Text style={[styles.label, { marginTop: 10 }]}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +1-222-333-4444"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
              <TouchableOpacity onPress={() => setEditorVisible(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSubmit} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>{editing ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafafa' },
  headerRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#0f172a', fontSize: 20, fontWeight: '700' },
  centerBox: { alignItems: 'center', justifyContent: 'center', padding: 24 },
  muted: { color: '#6b7280', marginTop: 8 },
  error: { color: '#ef4444', fontWeight: '700' },
  card: { backgroundColor: 'white', borderRadius: 12, padding: 12, marginVertical: 6, borderColor: '#e5e7eb', borderWidth: 1 },
  cardTitle: { color: '#0f172a', fontWeight: '700', marginBottom: 4 },
  phone: { color: '#0ea5e9', fontWeight: '700' },
  rowSpaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secondaryButton: { borderColor: '#334155', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  secondaryButtonSmall: { borderColor: '#334155', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  secondaryButtonText: { color: '#334155', fontSize: 12 },
  primaryButton: { backgroundColor: '#0ea5e9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  label: { color: '#0f172a', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#334155', color: '#0f172a', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  modalPanel: { width: '90%', backgroundColor: 'white', borderRadius: 12, borderColor: '#e5e7eb', borderWidth: 1, padding: 16 },
  modalTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700', marginBottom: 8 },
});


