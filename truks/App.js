import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, SafeAreaView, StatusBar, StyleSheet, Dimensions, Animated
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INITIAL_TRUCKS = [
  { id: 1, plate: 'СА 1234 АВ', lastOilKm: 120000, lastOilDate: '2026-01-10', lastServiceKm: 145000, lastServiceDate: '2026-06-08', currentKm: 145000 },
  { id: 2, plate: 'В 5678 СВ', lastOilKm: 98000, lastOilDate: '2026-03-15', lastServiceKm: 130000, lastServiceDate: '2026-05-25', currentKm: 130000 },
  { id: 3, plate: 'Х 9012 МН', lastOilKm: 200000, lastOilDate: '2026-04-02', lastServiceKm: 210000, lastServiceDate: '2026-06-01', currentKm: 249000 },
  { id: 4, plate: 'ПК 3456 КА', lastOilKm: 310000, lastOilDate: '2025-12-20', lastServiceKm: 355000, lastServiceDate: '2026-06-10', currentKm: 362000 },
];

const OIL_LIMIT = 50000;
const OIL_WARN = 49000;

function getOilStatus(truck) {
  const diff = truck.currentKm - truck.lastOilKm;
  if (diff >= OIL_LIMIT) return { diff, status: 'danger' };
  if (diff >= OIL_WARN) return { diff, status: 'warn' };
  return { diff, status: 'ok' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2,'0')}.${(d.getMonth()+1).toString().padStart(2,'0')}.${d.getFullYear()}`;
}

function formatKm(n) {
  if (!n && n !== 0) return '—';
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' км';
}

const SC = {
  ok: { border: '#334155', card: '#1e293b', badge: '#3b82f6', label: null, labelColor: null },
  warn: { border: '#f59e0b', card: '#1e1a09', badge: '#f59e0b', label: '⚠ СКОРО МАСЛО', labelColor: '#f59e0b' },
  danger: { border: '#ef4444', card: '#1e0a0a', badge: '#ef4444', label: '🔴 МАСЛО СЕГА!', labelColor: '#ef4444' },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <View pointerEvents="none" style={[s.toastWrap, { backgroundColor: toast.color }]}>
      <Text style={s.toastText}>{toast.msg}</Text>
    </View>
  );
}

// ─── StatPill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }) {
  return (
    <View style={[s.statPill, { borderColor: color + '44' }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── ActionBtn ────────────────────────────────────────────────────────────────
function ActionBtn({ label, color, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[s.actionBtn, { borderColor: color + '88', backgroundColor: color + '22' }]}
    >
      <Text style={[s.actionBtnText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── InfoCell ─────────────────────────────────────────────────────────────────
function InfoCell({ icon, label, km, date, borderColor, bgColor, textColor }) {
  return (
    <View style={[s.infoCell, { backgroundColor: bgColor, borderColor }]}>
      <Text style={s.infoCellLabel}>{icon} {label}</Text>
      <Text style={[s.infoCellKm, { color: textColor }]}>{formatKm(km)}</Text>
      <Text style={s.infoCellDate}>{formatDate(date)}</Text>
    </View>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct, barColor }) {
  const w = Math.min(100, pct);
  return (
    <View style={s.progressTrack}>
      <View style={[s.progressFill, { width: `${w}%`, backgroundColor: barColor }]} />
    </View>
  );
}

// ─── TruckCard ────────────────────────────────────────────────────────────────
function TruckCard({ truck, onOil, onService, onDelete }) {
  const { diff, status } = getOilStatus(truck);
  const sc = SC[status];
  const pct = Math.min(100, Math.round((diff / OIL_LIMIT) * 100));
  const barColor = status === 'danger' ? '#ef4444' : status === 'warn' ? '#f59e0b' : '#22c55e';

  const svcCell = status === 'danger'
    ? { bg: '#1e0a0a', border: '#ef4444', text: '#fca5a5' }
    : status === 'warn'
    ? { bg: '#1e1a09', border: '#f59e0b', text: '#fcd34d' }
    : { bg: '#0f172a', border: '#1e293b', text: '#e2e8f0' };

  return (
    <View style={[s.card, { backgroundColor: sc.card, borderColor: sc.border }]}>
      {/* Header */}
      <View style={s.cardHeader}>
        <View style={s.cardHeaderLeft}>
          <View style={[s.plateBadge, { backgroundColor: sc.badge }]}>
            <Text style={s.plateText}>{truck.plate}</Text>
          </View>
          {sc.label && (
            <Text style={[s.statusLabel, { color: sc.labelColor }]}>{sc.label}</Text>
          )}
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.deleteBtn}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={s.progressWrap}>
        <View style={s.progressRow}>
          <Text style={s.progressLabel}>От последна смяна на масло</Text>
          <Text style={[s.progressKm, { color: barColor }]}>
            {formatKm(diff).replace(' км','')} / {formatKm(OIL_LIMIT)}
          </Text>
        </View>
        <ProgressBar pct={pct} barColor={barColor} />
        <Text style={s.progressPct}>{pct}%</Text>
      </View>

      {/* Info cells */}
      <View style={s.cellRow}>
        <InfoCell
          icon="🛢️" label="Смяна масло"
          km={truck.lastOilKm} date={truck.lastOilDate}
          borderColor="#1e293b" bgColor="#0f172a" textColor="#e2e8f0"
        />
        <InfoCell
          icon="⚙️" label="Гресиране"
          km={truck.lastServiceKm} date={truck.lastServiceDate}
          borderColor={svcCell.border} bgColor={svcCell.bg} textColor={svcCell.text}
        />
      </View>

      {/* Buttons */}
      <View style={s.btnRow}>
        <ActionBtn label="🛢️ Смяна масло" color="#f97316" onPress={onOil} />
        <ActionBtn label="⚙️ Гресиране" color="#3b82f6" onPress={onService} />
      </View>
    </View>
  );
}

// ─── RecordModal ──────────────────────────────────────────────────────────────
function RecordModal({ visible, type, truck, onClose, onSave }) {
  const [kmInput, setKmInput] = useState('');
  const [dateInput, setDateInput] = useState('');

  React.useEffect(() => {
    if (visible) {
      setKmInput('');
      const t = new Date();
      setDateInput(`${t.getDate().toString().padStart(2,'0')}.${(t.getMonth()+1).toString().padStart(2,'0')}.${t.getFullYear()}`);
    }
  }, [visible]);

  const km = parseInt(kmInput.replace(/\s/g, '')) || 0;
  const diff = truck ? km - truck.lastOilKm : 0;
  const modalStatus = km > 0 ? (diff >= OIL_LIMIT ? 'danger' : diff >= OIL_WARN ? 'warn' : 'ok') : null;

  function handleSave() {
    const parsed = parseInt(kmInput.replace(/\s/g, ''));
    if (!parsed || parsed <= 0) return;
    onSave(parsed, dateInput);
  }

  if (!truck) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => {}}>
          <Text style={s.modalTitle}>
            {type === 'oil' ? '🛢️ Смяна на масло' : '⚙️ Гресиране'}
          </Text>
          <Text style={s.modalSub}>{truck.plate}</Text>

          <Text style={s.inputLabel}>Дата</Text>
          <TextInput
            style={s.input}
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="дд.мм.гггг"
            placeholderTextColor="#475569"
          />

          <Text style={s.inputLabel}>Километри при обслужването</Text>
          <TextInput
            style={s.input}
            value={kmInput}
            onChangeText={setKmInput}
            placeholder="напр. 155000"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            returnKeyType="done"
          />

          {type === 'service' && modalStatus === 'danger' && (
            <View style={[s.alertBox, { backgroundColor: '#1e0a0a', borderColor: '#ef4444' }]}>
              <Text style={[s.alertText, { color: '#fca5a5' }]}>
                🔴 {formatKm(diff)} от смяна! Маслото трябва да се смени ВЕДНАГА.
              </Text>
            </View>
          )}
          {type === 'service' && modalStatus === 'warn' && (
            <View style={[s.alertBox, { backgroundColor: '#1e1a09', borderColor: '#f59e0b' }]}>
              <Text style={[s.alertText, { color: '#fcd34d' }]}>
                ⚠️ {formatKm(diff)} от смяна — скоро е нужна смяна на масло.
              </Text>
            </View>
          )}

          <View style={s.modalBtnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelBtnText}>Отказ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: type === 'oil' ? '#f97316' : '#3b82f6' }]}
              onPress={handleSave}
            >
              <Text style={s.saveBtnText}>Запиши</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── AddTruckModal ────────────────────────────────────────────────────────────
function AddTruckModal({ visible, onClose, onAdd }) {
  const [plate, setPlate] = useState('');
  const [currentKm, setCurrentKm] = useState('');

  React.useEffect(() => { if (visible) { setPlate(''); setCurrentKm(''); } }, [visible]);

  function handleAdd() {
    const km = parseInt(currentKm.replace(/\s/g, ''));
    if (!plate.trim() || !km) return;
    onAdd(plate.trim(), km);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={s.modalSheet} activeOpacity={1} onPress={() => {}}>
          <Text style={s.modalTitle}>🚛 Добави камион</Text>

          <Text style={s.inputLabel}>Регистрационен номер</Text>
          <TextInput
            style={s.input}
            value={plate}
            onChangeText={setPlate}
            placeholder="напр. СА 1234 АВ"
            placeholderTextColor="#475569"
            autoCapitalize="characters"
          />

          <Text style={s.inputLabel}>Текущи километри</Text>
          <TextInput
            style={s.input}
            value={currentKm}
            onChangeText={setCurrentKm}
            placeholder="напр. 120000"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            returnKeyType="done"
          />

          <View style={s.modalBtnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
              <Text style={s.cancelBtnText}>Отказ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: '#22c55e' }]} onPress={handleAdd}>
              <Text style={s.saveBtnText}>Добави</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [trucks, setTrucks] = useState(INITIAL_TRUCKS);
  const [modal, setModal] = useState(null); // { type, truckId }
  const [addModal, setAddModal] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(msg, color = '#22c55e') {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave(km, dateStr) {
    setTrucks(prev => prev.map(t => {
      if (t.id !== modal.truckId) return t;
      if (modal.type === 'oil') {
        return { ...t, lastOilKm: km, lastOilDate: dateStr, currentKm: Math.max(t.currentKm, km) };
      } else {
        return { ...t, lastServiceKm: km, lastServiceDate: dateStr, currentKm: Math.max(t.currentKm, km) };
      }
    }));
    showToast(`✓ ${modal.type === 'oil' ? 'Смяна на масло' : 'Гресиране'} записано`);
    setModal(null);
  }

  function handleAddTruck(plate, km) {
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2,'0')}.${(today.getMonth()+1).toString().padStart(2,'0')}.${today.getFullYear()}`;
    setTrucks(prev => [...prev, {
      id: Date.now(), plate,
      lastOilKm: km, lastOilDate: dateStr,
      lastServiceKm: km, lastServiceDate: dateStr,
      currentKm: km
    }]);
    setAddModal(false);
    showToast('✓ Камионът е добавен');
  }

  function deleteTruck(id) {
    setTrucks(prev => prev.filter(t => t.id !== id));
    showToast('Камионът е премахнат', '#64748b');
  }

  const selectedTruck = modal ? trucks.find(t => t.id === modal.truckId) : null;
  const dangerCount = trucks.filter(t => getOilStatus(t).status === 'danger').length;
  const warnCount = trucks.filter(t => getOilStatus(t).status === 'warn').length;
  const okCount = trucks.filter(t => getOilStatus(t).status === 'ok').length;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerIcon}>🚛</Text>
        <View>
          <Text style={s.headerTitle}>Управление на флот</Text>
          <Text style={s.headerSub}>Сервизна история & Известия</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsBar}>
        <StatPill label="Общо" value={trucks.length} color="#60a5fa" />
        <StatPill label="⚠ Скоро" value={warnCount} color="#f59e0b" />
        <StatPill label="🔴 Масло" value={dangerCount} color="#ef4444" />
        <StatPill label="✓ ОК" value={okCount} color="#22c55e" />
      </View>

      {/* List */}
      <ScrollView contentContainerStyle={s.list} keyboardShouldPersistTaps="handled">
        {trucks.map(truck => (
          <TruckCard
            key={truck.id}
            truck={truck}
            onOil={() => setModal({ type: 'oil', truckId: truck.id })}
            onService={() => setModal({ type: 'service', truckId: truck.id })}
            onDelete={() => deleteTruck(truck.id)}
          />
        ))}

        {/* Add button */}
        <TouchableOpacity style={s.addBtn} onPress={() => setAddModal(true)} activeOpacity={0.7}>
          <Text style={s.addBtnText}>＋ Добави камион</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <RecordModal
        visible={!!modal}
        type={modal?.type}
        truck={selectedTruck}
        onClose={() => setModal(null)}
        onSave={handleSave}
      />
      <AddTruckModal
        visible={addModal}
        onClose={() => setAddModal(false)}
        onAdd={handleAddTruck}
      />

      {/* Toast */}
      <Toast toast={toast} />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: '#1e293b', borderBottomWidth: 2,
                  borderBottomColor: '#f97316', paddingHorizontal: 16, paddingVertical: 14 },
  headerIcon: { fontSize: 26 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  headerSub: { fontSize: 11, color: '#94a3b8' },

  statsBar: { flexDirection: 'row', gap: 8, padding: 12,
                  backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  statPill: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10,
                  paddingVertical: 8, alignItems: 'center', borderWidth: 1 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 9, color: '#64748b', marginTop: 1 },

  list: { padding: 12, gap: 12 },

  card: { borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', marginBottom: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between', padding: 12, paddingBottom: 6 },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  plateBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  plateText: { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: 1, fontFamily: 'monospace' },
  statusLabel: { fontSize: 12, fontWeight: '700' },
  deleteBtn: { color: '#475569', fontSize: 16, padding: 4 },

  progressWrap: { paddingHorizontal: 14, paddingVertical: 8 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel:{ fontSize: 11, color: '#94a3b8' },
  progressKm: { fontSize: 11, fontWeight: '600' },
  progressTrack:{ backgroundColor: '#334155', borderRadius: 6, height: 8, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 6 },
  progressPct: { fontSize: 10, color: '#64748b', marginTop: 2, textAlign: 'right' },

  cellRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  infoCell: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 8 },
  infoCellLabel:{ fontSize: 10, color: '#64748b', marginBottom: 3 },
  infoCellKm: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  infoCellDate: { fontSize: 11, color: '#64748b' },

  btnRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  actionBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5,
                  paddingVertical: 10, alignItems: 'center' },
  actionBtnText:{ fontSize: 13, fontWeight: '600' },

  addBtn: { borderRadius: 14, borderWidth: 2, borderColor: '#334155',
                  borderStyle: 'dashed', paddingVertical: 18, alignItems: 'center',
                  marginTop: 4 },
  addBtnText: { color: '#64748b', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
                  justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#1e293b', borderTopLeftRadius: 20,
                  borderTopRightRadius: 20, padding: 24, paddingBottom: 40,
                  borderWidth: 1, borderColor: '#334155' },
  modalTitle: { fontSize: 20, color: '#f8fafc', fontWeight: '700', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#94a3b8', marginBottom: 18 },
  inputLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  input: { backgroundColor: '#0f172a', borderWidth: 1.5, borderColor: '#334155',
                  borderRadius: 10, padding: 12, color: '#e2e8f0', fontSize: 15,
                  fontFamily: 'monospace', marginBottom: 12 },
  alertBox: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 8 },
  alertText: { fontSize: 13, fontWeight: '600' },
  modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, borderColor: '#334155',
                  paddingVertical: 13, alignItems: 'center' },
  cancelBtnText:{ color: '#94a3b8', fontSize: 14 },
  saveBtn: { flex: 1, borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Toast
  toastWrap: { position: 'absolute', bottom: 32, alignSelf: 'center',
                  paddingHorizontal: 20, paddingVertical: 12,
                  borderRadius: 12, zIndex: 999,
                  shadowColor: '#000', shadowOpacity: 0.4,
                  shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 10 },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
