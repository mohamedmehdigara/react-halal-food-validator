import React, { useState, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// --- 1. GLOBAL STYLES ---
const GlobalStyle = createGlobalStyle`
  body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #0f172a; }
  * { box-sizing: border-box; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- 2. THE PRINCIPAL STORE ---
const useStore = create(
  persist(
    (set) => ({
      activeStandard: 'HMC',
      history: [],
      auth: { managerId: null },
      setStandard: (s) => set({ activeStandard: s }),
      setManager: (id) => set((state) => ({ auth: { ...state.auth, managerId: id } })),
      logAudit: (product) => set((state) => ({
        history: [{ ...product, auditId: Date.now() }, ...state.history].slice(0, 10)
      })),
      reset: () => set({ history: [], auth: { managerId: null } })
    }),
    { name: 'catalog-auditor-v8' }
  )
);

// --- 3. THE PRODUCT REPOSITORY (The Source of Truth) ---
const PRODUCT_REPOSITORY = [
  {
    id: "999", name: "Artisan Sea Salt Mix", brand: "OceanGourmet", category: "Pantry", img: "🧂",
    regulations: {
      HMC: { status: 'halal', note: 'Natural mineral source.' },
      JAKIM: { status: 'mushbooh', note: 'Facility audit pending.' },
      GIMDES: { status: 'halal', note: 'Certified origin.' }
    }
  },
  {
    id: "888", name: "Enriched Baker's Flour", brand: "GrainMaster", category: "Bakery", img: "🍞",
    regulations: {
      HMC: { status: 'halal', note: 'Standard fortification.' },
      JAKIM: { status: 'halal', note: 'JAKIM-approved vitamins.' },
      GIMDES: { status: 'haram', note: 'E924 additive detected.' }
    }
  },
  {
    id: "777", name: "Premium Beef Broth", brand: "StockHouse", category: "Pantry", img: "🥣",
    regulations: {
      HMC: { status: 'halal', note: 'Hand-slaughtered source.' },
      JAKIM: { status: 'halal', note: 'Standard Halal process.' },
      GIMDES: { status: 'mushbooh', note: 'Enzymatic analysis required.' }
    }
  },
  {
    id: "666", name: "Wildflower Honey", brand: "BeePure", category: "Sweets", img: "🍯",
    regulations: {
      HMC: { status: 'halal', note: 'Pure honey.' },
      JAKIM: { status: 'halal', note: 'Natural product.' },
      GIMDES: { status: 'halal', note: 'No additives.' }
    }
  }
];

// --- 4. STYLED COMPONENTS ---
const Layout = styled.div` display: grid; grid-template-columns: 280px 1fr; height: 100vh; `;
const Sidebar = styled.aside` background: #0f172a; color: white; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; `;
const Viewport = styled.main` padding: 2.5rem; overflow-y: auto; display: grid; grid-template-columns: 1fr 380px; gap: 2.5rem; `;

const ProductGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem;
`;

const SelectableCard = styled.div`
  background: white; border-radius: 16px; padding: 1.5rem; cursor: pointer;
  border: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  &:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
`;

const AuditPanel = styled.div`
  background: white; border-radius: 20px; padding: 2rem; position: sticky; top: 0;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); animation: ${fadeIn} 0.3s ease;
  height: fit-content; border: 1px solid #e2e8f0;
`;

const StatusBadge = styled.span`
  padding: 6px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
  background: ${props => props.type === 'halal' ? '#dcfce7' : props.type === 'mushbooh' ? '#fef3c7' : '#fecaca'};
  color: ${props => props.type === 'halal' ? '#166534' : props.type === '92400e' ? '#92400e' : '#991b1b'};
`;

// --- 5. MAIN APPLICATION ---
export default function App() {
  const store = useStore();
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleAudit = (product) => {
    setSelectedProduct(product);
    store.logAudit(product);
  };

  const currentVerdict = useMemo(() => {
    if (!selectedProduct) return null;
    return selectedProduct.regulations[store.activeStandard];
  }, [selectedProduct, store.activeStandard]);

  return (
    <>
      <GlobalStyle />
      <Layout>
        <Sidebar>
          <div>
            <h2 style={{ color: '#3b82f6', marginBottom: '0.2rem' }}>Catalog-Intel</h2>
            <small style={{ color: '#64748b' }}>Enterprise Auditor v8.0</small>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 800 }}>AUDIT STANDARD</label>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['HMC', 'JAKIM', 'GIMDES'].map(reg => (
                <button 
                  key={reg} 
                  onClick={() => store.setStandard(reg)}
                  style={{ 
                    padding: '12px', textAlign: 'left', borderRadius: '10px', border: 'none',
                    background: store.activeStandard === reg ? '#3b82f6' : '#1e293b', 
                    color: 'white', cursor: 'pointer', fontWeight: 600
                  }}
                >
                  {reg} {store.activeStandard === reg && '✓'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <small style={{ color: '#64748b' }}>Audit Log: {store.history.length} items</small>
            <button onClick={store.reset} style={{ width: '100%', marginTop: '10px', background: 'none', border: '1px solid #334155', color: '#94a3b8', padding: '10px', cursor: 'pointer', borderRadius: '8px' }}>Reset Logs</button>
          </div>
        </Sidebar>

        <Viewport>
          <section>
            <header style={{ marginBottom: '2rem' }}>
              <h1 style={{ margin: 0 }}>Available Inventory</h1>
              <p style={{ color: '#64748b' }}>Select a product from the warehouse floor to perform a regulatory audit.</p>
            </header>
            
            <ProductGrid>
              {PRODUCT_REPOSITORY.map(product => (
                <SelectableCard 
                  key={product.id} 
                  active={selectedProduct?.id === product.id}
                  onClick={() => handleAudit(product)}
                >
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{product.img}</div>
                  <h4 style={{ margin: '0 0 5px 0' }}>{product.name}</h4>
                  <small style={{ color: '#64748b' }}>{product.brand}</small>
                </SelectableCard>
              ))}
            </ProductGrid>
          </section>

          <aside>
            {selectedProduct ? (
              <AuditPanel>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <StatusBadge type={currentVerdict.status}>
                    {currentVerdict.status}
                  </StatusBadge>
                  <small style={{ color: '#94a3b8' }}>ID: {selectedProduct.id}</small>
                </div>

                <h2 style={{ margin: '0 0 0.5rem 0' }}>{selectedProduct.img} {selectedProduct.name}</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                  Compliance report generated under <strong>{store.activeStandard}</strong> jurisdiction.
                </p>

                <div style={{ marginTop: '1.5rem' }}>
                  <h4>Regulatory Verdict</h4>
                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.85rem', color: '#475569' }}>
                    "{currentVerdict.note}"
                  </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <h4>Cross-Body Comparison</h4>
                  {Object.entries(selectedProduct.regulations).map(([reg, data]) => (
                    <div key={reg} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{reg}</span>
                      <StatusBadge type={data.status}>{data.status}</StatusBadge>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#92400e' }}>🛡️ Security Protocol</h4>
                  <p style={{ fontSize: '0.75rem', color: '#b45309', marginBottom: '1rem' }}>
                    Disposal of non-compliant items requires a Manager's electronic signature.
                  </p>
                  {!store.auth.managerId ? (
                    <button 
                      onClick={() => store.setManager('MGMT_OVERSIGHT_01')}
                      style={{ width: '100%', padding: '10px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Authorize Manager Sign-off
                    </button>
                  ) : (
                    <div style={{ color: '#166534', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      ✓ Signed by {store.auth.managerId}
                    </div>
                  )}
                </div>
              </AuditPanel>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '10rem', color: '#cbd5e1' }}>
                <div style={{ fontSize: '4rem' }}>👈</div>
                <h3>Awaiting Selection</h3>
                <p>Select an item to view the compliance matrix.</p>
              </div>
            )}
          </aside>
        </Viewport>
      </Layout>
    </>
  );
}