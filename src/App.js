import React, { useState, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// --- 1. GLOBAL STYLES ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0; padding: 0;
    font-family: 'Inter', -apple-system, sans-serif;
    background-color: #f8fafc;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }
  * { box-sizing: border-box; transition: all 0.2s ease; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- 2. ZUSTAND STORE (State Persistence) ---
const useStore = create(
  persist(
    (set) => ({
      standard: 'Global', // Global vs Strict (Regulatory Toggles)
      history: [],
      vendorNotes: {},
      setStandard: (s) => set({ standard: s }),
      addHistory: (item) => set((state) => ({
        history: [{ ...item, id: Date.now() }, ...state.history].slice(0, 6)
      })),
      saveNote: (id, note) => set((state) => ({
        vendorNotes: { ...state.vendorNotes, [id]: note }
      })),
    }),
    { name: 'staff-verifier-v5' }
  )
);

// --- 3. PRODUCT ENGINE (Risk-Encoded Data) ---
const PRODUCTS = {
  "101": {
    name: "Classic Fruit Chews",
    brand: "SweetStep",
    category: "Snacks",
    img: "🍏",
    ingredients: [
      { name: "Pectin", status: "halal", risk: "Low" },
      { name: "Artificial Flavor", status: "halal", risk: "Medium" },
      { name: "E120 Carmine", status: "haram", risk: "High", source: "Insects" }
    ]
  },
  "202": {
    name: "Organic Berry Bites",
    brand: "PurePath",
    category: "Snacks",
    img: "🍓",
    ingredients: [
      { name: "Berry Juice", status: "halal", risk: "Low" },
      { name: "Agar Agar", status: "halal", risk: "Low" }
    ]
  },
  "303": {
    name: "Whey Protein Bar",
    brand: "TitanForce",
    category: "Supplements",
    img: "💪",
    ingredients: [
      { name: "Whey Isolate", status: "halal", risk: "Medium" },
      { name: "L-Cysteine", status: "mushbooh", risk: "High", source: "Unclear derivation" }
    ]
  }
};

// --- 4. STYLED COMPONENTS (SaaS Dashboard UI) ---
const Layout = styled.div` display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; `;

const Sidebar = styled.nav`
  background: white; border-right: 1px solid #e2e8f0; padding: 2rem;
  display: flex; flex-direction: column; gap: 2rem;
`;

const Main = styled.main` padding: 3rem; max-width: 1100px; margin: 0 auto; width: 100%; `;

const SearchInput = styled.input`
  width: 100%; padding: 1.2rem; border-radius: 12px; border: 2px solid #e2e8f0;
  font-size: 1.1rem; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
  &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
`;

const ProductCard = styled.div`
  background: white; border-radius: 24px; padding: 2.5rem;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.05); animation: ${slideUp} 0.5s ease-out;
`;

const RiskHeatmap = styled.div`
  height: 8px; width: 100%; background: #f1f5f9; border-radius: 4px;
  display: flex; overflow: hidden; margin: 1.5rem 0;
`;

const HeatSegment = styled.div`
  height: 100%; width: ${props => props.width}%; background: ${props => props.color};
`;

const StatusChip = styled.div`
  padding: 0.8rem 1.5rem; border-radius: 10px; font-weight: 800; display: inline-flex; align-items: center; gap: 10px;
  background: ${props => props.type === 'haram' ? '#fef2f2' : props.type === 'mushbooh' ? '#fffbeb' : '#f0fdf4'};
  color: ${props => props.type === 'haram' ? '#991b1b' : props.type === '92400e' ? '#92400e' : '#166534'};
  margin-bottom: 1.5rem;
`;

const SuggestionGrid = styled.div`
  display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem;
`;

const NoteBox = styled.textarea`
  width: 100%; height: 100px; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0;
  background: #fffcf0; font-family: inherit; margin-top: 1rem; resize: none;
`;

// --- 5. MAIN APPLICATION ---
export default function App() {
  const [query, setQuery] = useState('');
  const [activeProduct, setActiveProduct] = useState(null);
  const store = useStore();

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (PRODUCTS[val]) {
      const p = PRODUCTS[val];
      setActiveProduct({ ...p, id: val });
      const status = p.ingredients.some(i => i.status === 'haram') ? 'haram' : 'halal';
      store.addHistory({ name: p.name, status });
    }
  };

  // STAFF LOGIC: Calculate dynamic verdict based on Regulatory Standard
  const verdict = useMemo(() => {
    if (!activeProduct) return null;
    const hasHaram = activeProduct.ingredients.some(i => i.status === 'haram');
    const hasHighRisk = activeProduct.ingredients.some(i => i.risk === 'High');
    
    if (hasHaram) return 'haram';
    if (store.standard === 'Strict' && hasHighRisk) return 'mushbooh';
    return 'halal';
  }, [activeProduct, store.standard]);

  // STAFF LOGIC: Smart Alternative Finder
  const alternatives = useMemo(() => {
    if (!activeProduct || verdict === 'halal') return [];
    return Object.entries(PRODUCTS).filter(([id, p]) => 
      p.category === activeProduct.category && 
      id !== activeProduct.id && 
      !p.ingredients.some(i => i.status === 'haram' || i.risk === 'High')
    ).slice(0, 2);
  }, [activeProduct, verdict]);

  return (
    <>
      <GlobalStyle />
      <Layout>
        <Sidebar>
          <h2 style={{ color: '#3b82f6', letterSpacing: '-1px' }}>CompliancePro</h2>
          
          <div>
            <small style={{ fontWeight: 800, color: '#94a3b8' }}>REGULATORY STANDARD</small>
            <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={() => store.setStandard('Global')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: store.standard === 'Global' ? '#3b82f6' : 'white', color: store.standard === 'Global' ? 'white' : '#64748b', cursor: 'pointer' }}>Global (Standard)</button>
              <button onClick={() => store.setStandard('Strict')} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: store.standard === 'Strict' ? '#3b82f6' : 'white', color: store.standard === 'Strict' ? 'white' : '#64748b', cursor: 'pointer' }}>Strict (Precautionary)</button>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <small style={{ color: '#94a3b8' }}>Session Active: {store.history.length} scans</small>
          </div>
        </Sidebar>

        <Main>
          <SearchInput placeholder="Scan Barcode (101, 202, or 303)..." value={query} onChange={handleSearch} />

          {activeProduct ? (
            <ProductCard>
              <StatusChip type={verdict}>
                {verdict === 'haram' ? '❌ HARAM FLAG' : verdict === 'mushbooh' ? '⚠️ MUSHBOOH / HIGH RISK' : '✅ HALAL CERTIFIED'}
              </StatusChip>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '2.5rem', margin: 0 }}>{activeProduct.img} {activeProduct.name}</h1>
                  <p style={{ color: '#64748b', fontSize: '1.1rem' }}>{activeProduct.brand} • {activeProduct.category}</p>
                </div>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <small style={{ fontWeight: 800, color: '#64748b' }}>INGREDIENT RISK ANALYSIS</small>
                <RiskHeatmap>
                  {activeProduct.ingredients.map((ing, i) => (
                    <HeatSegment 
                      key={i} 
                      width={100 / activeProduct.ingredients.length} 
                      color={ing.status === 'haram' ? '#ef4444' : ing.risk === 'High' ? '#f59e0b' : '#22c55e'}
                    />
                  ))}
                </RiskHeatmap>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                <div>
                  <h4>Technical Breakdown</h4>
                  {activeProduct.ingredients.map((ing, i) => (
                    <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{ing.name}</span>
                        <span style={{ color: ing.risk === 'High' ? '#ef4444' : '#94a3b8' }}>{ing.risk} Risk</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <h4>Local Compliance Wiki</h4>
                  <NoteBox 
                    placeholder="Enter vendor observations or customer feedback..."
                    value={store.vendorNotes[activeProduct.id] || ''}
                    onChange={(e) => store.saveNote(activeProduct.id, e.target.value)}
                  />
                </div>
              </div>

              {alternatives.length > 0 && (
                <div style={{ marginTop: '3rem', padding: '2rem', background: '#f0f9ff', borderRadius: '16px' }}>
                  <h4 style={{ margin: 0, color: '#0369a1' }}>💡 Smart Switch Suggestion</h4>
                  <p style={{ color: '#0c4a6e', fontSize: '0.9rem' }}>The current item doesn't meet the {store.standard} standard. Recommend these instead:</p>
                  <SuggestionGrid>
                    {alternatives.map(([id, p]) => (
                      <div key={id} style={{ background: 'white', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <strong>{p.img} {p.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SKU: {id}</div>
                      </div>
                    ))}
                  </SuggestionGrid>
                </div>
              )}
            </ProductCard>
          ) : (
            <div style={{ textAlign: 'center', marginTop: '15vh', color: '#cbd5e1' }}>
              <div style={{ fontSize: '5rem' }}>🔍</div>
              <h2>Terminal Standby</h2>
              <p>Scan a product barcode to initiate compliance audit.</p>
            </div>
          )}
        </Main>
      </Layout>
    </>
  );
}