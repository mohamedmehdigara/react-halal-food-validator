import React, { useState, useMemo, useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// --- 1. GLOBAL STYLES ---
const GlobalStyle = createGlobalStyle`
  body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f1f5f9; color: #0f172a; }
  * { box-sizing: border-box; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

// --- 2. THE PRINCIPAL STORE (Security & Buffer) ---
const useStore = create(
  persist(
    (set) => ({
      auth: { scannerId: 'STAFF_01', managerId: null },
      activeStandard: 'HMC', // HMC vs JAKIM vs GIMDES
      batchBuffer: [],
      history: [],
      
      setManager: (id) => set((state) => ({ auth: { ...state.auth, managerId: id } })),
      setStandard: (s) => set({ activeStandard: s }),
      
      addToBuffer: (barcode) => set((state) => ({ 
        batchBuffer: [...state.batchBuffer, { barcode, id: Date.now(), status: 'pending' }] 
      })),
      
      processBuffer: (results) => set((state) => ({
        history: [...results, ...state.history].slice(0, 50),
        batchBuffer: []
      })),

      clearSession: () => set({ history: [], batchBuffer: [], auth: { scannerId: 'STAFF_01', managerId: null } })
    }),
    { name: 'principal-compliance-v7' }
  )
);

// --- 3. MULTI-REGULATORY DATA MATRIX ---
const PRODUCT_MATRIX = {
  "999": {
    name: "Artisan Sea Salt Mix",
    category: "Pantry",
    regulations: {
      HMC: { status: 'halal', risk: 'Low', note: 'Standard mineral check.' },
      JAKIM: { status: 'mushbooh', risk: 'Medium', note: 'Trace minerals require facility audit.' },
      GIMDES: { status: 'halal', risk: 'Low', note: 'Verified origin.' }
    }
  },
  "888": {
    name: "Enriched Flour",
    category: "Bakery",
    regulations: {
      HMC: { status: 'halal', risk: 'Low', note: 'Synthetic vitamins approved.' },
      JAKIM: { status: 'halal', risk: 'Low', note: 'Standard fortification.' },
      GIMDES: { status: 'haram', risk: 'High', note: 'E924 additive used in milling.' }
    }
  }
};

// --- 4. STYLED COMPONENTS ---
const AppGrid = styled.div` display: grid; grid-template-columns: 280px 1fr; height: 100vh; `;
const Sidebar = styled.nav` background: #0f172a; color: white; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; `;
const Workspace = styled.main` padding: 2rem; overflow-y: auto; `;
const Card = styled.div` background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 1.5rem; `;

const StatusTag = styled.span`
  padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: bold;
  background: ${props => props.type === 'halal' ? '#dcfce7' : props.type === 'mushbooh' ? '#fef3c7' : '#fecaca'};
  color: ${props => props.type === 'halal' ? '#166534' : props.type === '92400e' ? '#92400e' : '#991b1b'};
`;

const BatchItem = styled.div`
  display: flex; justify-content: space-between; padding: 10px; background: #f8fafc;
  border-radius: 6px; margin-bottom: 8px; border: 1px solid #e2e8f0;
  animation: ${pulse} 2s infinite;
`;

// --- 5. MAIN APPLICATION ---
export default function App() {
  const [input, setInput] = useState('');
  const store = useStore();

  // STAFF LOGIC: Async Batch Processor
  const processBatch = () => {
    const results = store.batchBuffer.map(item => {
      const data = PRODUCT_MATRIX[item.barcode];
      if (!data) return null;
      return { 
        ...data, 
        resolvedStatus: data.regulations[store.activeStandard].status,
        timestamp: new Date().toLocaleTimeString()
      };
    }).filter(Boolean);
    
    store.processBuffer(results);
  };

  return (
    <>
      <GlobalStyle />
      <AppGrid>
        <Sidebar>
          <div>
            <h3 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>Global Auditor</h3>
            <small style={{ color: '#94a3b8' }}>Session: {store.auth.scannerId}</small>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800 }}>REGULATORY BODY</label>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {['HMC', 'JAKIM', 'GIMDES'].map(reg => (
                <button 
                  key={reg} 
                  onClick={() => store.setStandard(reg)}
                  style={{ 
                    padding: '8px', textAlign: 'left', borderRadius: '6px', border: 'none',
                    background: store.activeStandard === reg ? '#3b82f6' : '#1e293b', color: 'white', cursor: 'pointer'
                  }}
                >
                  {reg} {store.activeStandard === reg && '✓'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <button onClick={store.clearSession} style={{ background: 'none', border: '1px solid #334155', color: '#94a3b8', width: '100%', padding: '10px', cursor: 'pointer' }}>
              Terminal Reset
            </button>
          </div>
        </Sidebar>

        <Workspace>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '20px' }}>
            <section>
              <Card>
                <h3>Rapid Intake Buffer</h3>
                <form onSubmit={(e) => { e.preventDefault(); store.addToBuffer(input); setInput(''); }}>
                  <input 
                    placeholder="Fast Scan (Try 888 or 999)..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    style={{ width: '100%', padding: '15px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1rem' }}
                  />
                </form>
                
                {store.batchBuffer.length > 0 && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <small>{store.batchBuffer.length} items in queue</small>
                      <button onClick={processBatch} style={{ background: '#22c55e', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Commit Batch</button>
                    </div>
                    {store.batchBuffer.map(item => (
                      <BatchItem key={item.id}>
                        <span>SKU: {item.barcode}</span>
                        <small>WAITING...</small>
                      </BatchItem>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h3>Compliance History ({store.activeStandard})</h3>
                {store.history.map((h, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <strong>{h.name}</strong> <br />
                      <small style={{ color: '#64748b' }}>{h.regulations[store.activeStandard].note}</small>
                    </div>
                    <StatusTag type={h.resolvedStatus}>{h.resolvedStatus.toUpperCase()}</StatusTag>
                  </div>
                ))}
              </Card>
            </section>

            <section>
              <Card style={{ borderLeft: '4px solid #f59e0b' }}>
                <h4>Security Protocol</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Dual-signature required for <strong>GIMDES</strong> flagged removals.</p>
                {!store.auth.managerId ? (
                  <button 
                    onClick={() => store.setManager('MGMT_ALPHA')}
                    style={{ width: '100%', padding: '10px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Request Manager Sign-off
                  </button>
                ) : (
                  <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', color: '#166534' }}>
                    Authorized by: {store.auth.managerId}
                  </div>
                )}
              </Card>

              <Card>
                <h4>Regulatory Matrix Comparison</h4>
                <div style={{ fontSize: '0.75rem' }}>
                  {store.history[0] && Object.entries(store.history[0].regulations).map(([reg, data]) => (
                    <div key={reg} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                      <span>{reg}</span>
                      <StatusTag type={data.status}>{data.status}</StatusTag>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </div>
        </Workspace>
      </AppGrid>
    </>
  );
}