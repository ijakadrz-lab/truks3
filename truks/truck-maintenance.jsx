import { useState } from "react";

const INITIAL_TRUCKS = [
  { id: 1, plate: "СА 1234 АВ", lastOilKm: 120000, lastOilDate: "2026-01-10", lastServiceKm: 145000, lastServiceDate: "2026-06-08", currentKm: 145000 },
  { id: 2, plate: "В 5678 СВ", lastOilKm: 98000, lastOilDate: "2026-03-15", lastServiceKm: 130000, lastServiceDate: "2026-05-25", currentKm: 130000 },
  { id: 3, plate: "Х 9012 МН", lastOilKm: 200000, lastOilDate: "2026-04-02", lastServiceKm: 210000, lastServiceDate: "2026-06-01", currentKm: 249000 },
  { id: 4, plate: "ПК 3456 КА", lastOilKm: 310000, lastOilDate: "2025-12-20", lastServiceKm: 355000, lastServiceDate: "2026-06-10", currentKm: 362000 },
];

const OIL_LIMIT = 50000;
const OIL_WARN = 49000; // warn threshold

// Returns: 'ok' | 'warn' | 'danger'
function getOilStatus(truck) {
  const diff = truck.currentKm - truck.lastOilKm;
  if (diff >= OIL_LIMIT) return { diff, status: "danger" };
  if (diff >= OIL_WARN) return { diff, status: "warn" };
  return { diff, status: "ok" };
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("bg-BG");
}

const STATUS_COLORS = {
  ok:     { border: "#334155", card: "#1e293b", badge: "#3b82f6", label: null },
  warn:   { border: "#f59e0b", card: "#1e1a0e", badge: "#f59e0b", label: "⚠ СКОРО МАСЛО" },
  danger: { border: "#ef4444", card: "#1e0e0e", badge: "#ef4444", label: "🔴 МАСЛО СЕГА!" },
};

export default function App() {
  const [trucks, setTrucks] = useState(INITIAL_TRUCKS);
  const [modal, setModal] = useState(null);
  const [kmInput, setKmInput] = useState("");
  const [dateInput, setDateInput] = useState(new Date().toISOString().split("T")[0]);
  const [addModal, setAddModal] = useState(false);
  const [newTruck, setNewTruck] = useState({ plate: "", currentKm: "" });
  const [toast, setToast] = useState(null);

  function showToast(msg, color = "#22c55e") {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  }

  function openModal(type, truckId) {
    setKmInput("");
    setDateInput(new Date().toISOString().split("T")[0]);
    setModal({ type, truckId });
  }

  function handleSubmit() {
    const km = parseInt(kmInput);
    if (!km || km <= 0) return;
    setTrucks(prev => prev.map(t => {
      if (t.id !== modal.truckId) return t;
      if (modal.type === "oil") {
        return { ...t, lastOilKm: km, lastOilDate: dateInput, currentKm: Math.max(t.currentKm, km) };
      } else {
        return { ...t, lastServiceKm: km, lastServiceDate: dateInput, currentKm: Math.max(t.currentKm, km) };
      }
    }));
    showToast(`✓ ${modal.type === "oil" ? "Смяна на масло" : "Гресиране"} записано`);
    setModal(null);
  }

  function handleAddTruck() {
    const km = parseInt(newTruck.currentKm);
    if (!newTruck.plate || !km) return;
    const today = new Date().toISOString().split("T")[0];
    setTrucks(prev => [...prev, {
      id: Date.now(), plate: newTruck.plate,
      lastOilKm: km, lastOilDate: today,
      lastServiceKm: km, lastServiceDate: today,
      currentKm: km
    }]);
    setNewTruck({ plate: "", currentKm: "" });
    setAddModal(false);
    showToast("✓ Камионът е добавен");
  }

  function deleteTruck(id) {
    setTrucks(prev => prev.filter(t => t.id !== id));
    showToast("Камионът е премахнат", "#64748b");
  }

  const selectedTruck = modal ? trucks.find(t => t.id === modal.truckId) : null;

  const dangerCount = trucks.filter(t => getOilStatus(t).status === "danger").length;
  const warnCount  = trucks.filter(t => getOilStatus(t).status === "warn").length;
  const okCount    = trucks.filter(t => getOilStatus(t).status === "ok").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "'Segoe UI', system-ui, sans-serif", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", borderBottom: "2px solid #f97316", padding: "18px 16px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 26 }}>🚛</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f8fafc" }}>Управление на флот</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>Сервизна история & Известия</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", background: "#1e293b", borderBottom: "1px solid #334155" }}>
        <StatPill label="Общо" value={trucks.length} color="#60a5fa" />
        <StatPill label="⚠ Скоро" value={warnCount} color="#f59e0b" />
        <StatPill label="🔴 Масло!" value={dangerCount} color="#ef4444" />
        <StatPill label="✓ ОК" value={okCount} color="#22c55e" />
      </div>

      {/* Trucks */}
      <div style={{ padding: "14px 12px", display: "flex", flexDirection: "column", gap: 12 }}>
        {trucks.map(truck => {
          const { diff, status } = getOilStatus(truck);
          const sc = STATUS_COLORS[status];
          const pct = Math.min(100, Math.round((diff / OIL_LIMIT) * 100));
          const barColor = status === "danger" ? "#ef4444" : status === "warn" ? "#f59e0b" : "#22c55e";

          // For the service cell: highlight based on status
          const serviceCellColor =
            status === "danger" ? { bg: "rgba(239,68,68,0.15)", border: "#ef4444", text: "#fca5a5" } :
            status === "warn"   ? { bg: "rgba(245,158,11,0.15)", border: "#f59e0b", text: "#fcd34d" } :
                                  { bg: "#0f172a", border: "#1e293b", text: "#e2e8f0" };

          return (
            <div key={truck.id} style={{
              background: sc.card,
              border: `1.5px solid ${sc.border}`,
              borderRadius: 14,
              overflow: "hidden",
              boxShadow: status !== "ok" ? `0 0 16px ${sc.border}28` : "0 2px 8px rgba(0,0,0,0.3)"
            }}>
              {/* Truck header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px 6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    background: sc.badge, borderRadius: 8, padding: "3px 10px",
                    fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 1, fontFamily: "monospace"
                  }}>{truck.plate}</div>
                  {sc.label && <span style={{ fontSize: 12, color: sc.badge, fontWeight: 700 }}>{sc.label}</span>}
                </div>
                <button onClick={() => deleteTruck(truck.id)} style={{
                  background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, padding: 2
                }}>✕</button>
              </div>

              {/* Progress bar */}
              <div style={{ padding: "8px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>
                  <span>От последна смяна на масло</span>
                  <span style={{ color: barColor, fontWeight: 600 }}>
                    {diff.toLocaleString("bg-BG")} / {OIL_LIMIT.toLocaleString("bg-BG")} км
                  </span>
                </div>
                <div style={{ background: "#334155", borderRadius: 6, height: 8, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 6, background: barColor, transition: "width 0.4s" }} />
                </div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2, textAlign: "right" }}>{pct}%</div>
              </div>

              {/* Info cells */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "4px 14px 12px" }}>
                {/* Oil cell - always neutral */}
                <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>🛢️ Последна смяна масло</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", fontFamily: "monospace" }}>
                    {truck.lastOilKm?.toLocaleString("bg-BG")} км
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{formatDate(truck.lastOilDate)}</div>
                </div>

                {/* Grease/service cell - changes color by status */}
                <div style={{
                  background: serviceCellColor.bg,
                  border: `1px solid ${serviceCellColor.border}`,
                  borderRadius: 10, padding: "8px 10px"
                }}>
                  <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>⚙️ Последно гресиране</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: serviceCellColor.text, fontFamily: "monospace" }}>
                    {truck.lastServiceKm?.toLocaleString("bg-BG")} км
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{formatDate(truck.lastServiceDate)}</div>
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 14px 14px" }}>
                <ActionBtn label="🛢️ Смяна масло" color="#f97316" onClick={() => openModal("oil", truck.id)} />
                <ActionBtn label="⚙️ Гресиране" color="#3b82f6" onClick={() => openModal("service", truck.id)} />
              </div>
            </div>
          );
        })}

        {/* Add truck */}
        <button onClick={() => setAddModal(true)} style={{
          background: "none", border: "2px dashed #334155", borderRadius: 14,
          color: "#64748b", padding: "16px", fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6
        }}
          onMouseOver={e => { e.currentTarget.style.borderColor = "#f97316"; e.currentTarget.style.color = "#f97316"; }}
          onMouseOut={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.color = "#64748b"; }}
        >
          ＋ Добави камион
        </button>
      </div>

      {/* Record modal */}
      {modal && selectedTruck && (() => {
        const km = parseInt(kmInput);
        const diff = km ? km - selectedTruck.lastOilKm : null;
        const modalStatus = diff !== null ? (diff >= OIL_LIMIT ? "danger" : diff >= OIL_WARN ? "warn" : "ok") : null;

        return (
          <ModalOverlay onClose={() => setModal(null)}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>
              {modal.type === "oil" ? "🛢️ Смяна на масло" : "⚙️ Гресиране"}
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 18 }}>
              {selectedTruck.plate}
            </div>
            <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Дата</label>
            <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} style={inputStyle} />
            <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4, marginTop: 12 }}>
              Километри при обслужването
            </label>
            <input
              type="number" placeholder="напр. 155000"
              value={kmInput} onChange={e => setKmInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              style={inputStyle} autoFocus
            />

            {/* Live warning inside modal for service type */}
            {modal.type === "service" && modalStatus === "danger" && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(239,68,68,0.15)", border: "1px solid #ef4444", color: "#fca5a5", fontSize: 13, fontWeight: 600 }}>
                🔴 {diff?.toLocaleString("bg-BG")} км от смяна! Маслото трябва да се смени ВЕДНАГА.
              </div>
            )}
            {modal.type === "service" && modalStatus === "warn" && (
              <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(245,158,11,0.15)", border: "1px solid #f59e0b", color: "#fcd34d", fontSize: 13, fontWeight: 600 }}>
                ⚠️ {diff?.toLocaleString("bg-BG")} км от смяна — скоро е нужна смяна на масло.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
              <button onClick={() => setModal(null)} style={{
                padding: "12px", borderRadius: 10, border: "1px solid #334155",
                background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14
              }}>Отказ</button>
              <button onClick={handleSubmit} style={{
                padding: "12px", borderRadius: 10, border: "none",
                background: modal.type === "oil" ? "#f97316" : "#3b82f6",
                color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600
              }}>Запиши</button>
            </div>
          </ModalOverlay>
        );
      })()}

      {/* Add truck modal */}
      {addModal && (
        <ModalOverlay onClose={() => setAddModal(false)}>
          <div style={{ fontSize: 20, marginBottom: 16 }}>🚛 Добави камион</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Регистрационен номер</label>
            <input
              type="text" placeholder="напр. СА 1234 АВ"
              value={newTruck.plate} onChange={e => setNewTruck(p => ({ ...p, plate: e.target.value }))}
              style={inputStyle} autoFocus
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Текущи километри</label>
            <input
              type="number" placeholder="напр. 120000"
              value={newTruck.currentKm} onChange={e => setNewTruck(p => ({ ...p, currentKm: e.target.value }))}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
            <button onClick={() => setAddModal(false)} style={{
              padding: "12px", borderRadius: 10, border: "1px solid #334155",
              background: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14
            }}>Отказ</button>
            <button onClick={handleAddTruck} style={{
              padding: "12px", borderRadius: 10, border: "none",
              background: "#22c55e", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600
            }}>Добави</button>
          </div>
        </ModalOverlay>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.color, color: "#fff", padding: "12px 20px",
          borderRadius: 12, fontSize: 14, fontWeight: 600,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 1000,
          animation: "fadeIn 0.3s ease"
        }}>{toast.msg}</div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateX(-50%) translateY(10px);} to { opacity:1; transform:translateX(-50%) translateY(0);} }
        input:focus { outline: none; border-color: #f97316 !important; }
      `}</style>
    </div>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "#0f172a", borderRadius: 10, padding: "8px 6px", textAlign: "center", border: `1px solid ${color}33` }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 9, color: "#64748b", marginTop: 1 }}>{label}</div>
    </div>
  );
}

function ActionBtn({ label, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: `${color}18`, border: `1.5px solid ${color}55`,
      color, borderRadius: 10, padding: "10px 6px",
      fontSize: 13, fontWeight: 600, cursor: "pointer"
    }}
      onMouseOver={e => e.currentTarget.style.background = `${color}30`}
      onMouseOut={e => e.currentTarget.style.background = `${color}18`}
    >{label}</button>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "flex-end", zIndex: 100
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1e293b", borderRadius: "20px 20px 0 0",
        padding: "24px 20px 36px", width: "100%", border: "1px solid #334155"
      }}>
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box",
  background: "#0f172a", border: "1.5px solid #334155",
  borderRadius: 10, padding: "12px 14px",
  color: "#e2e8f0", fontSize: 15, fontFamily: "monospace"
};
