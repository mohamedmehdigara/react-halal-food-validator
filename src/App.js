import React, { useState, useMemo, Component } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import styled, { createGlobalStyle } from 'styled-components';

// --- 1. GLOBAL STYLES & THEME ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0; padding: 0;
    font-family: 'Inter', sans-serif;
    background-color: #020617;
    color: #f1f5f9;
  }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
`;

// --- 2. SENIOR STATE MANAGEMENT (Zustand + Persistence) ---
const useVendorStore = create(
  persist(
    (set) => ({
      vendorName: '',
      view: 'terminal', // 'terminal' or 'analytics'
      madhhab: 'General',
      history: [],
      disposalList: [],
      
      setVendor: (name) => set({ vendorName: name }),
      setView: (v) => set({ view: v }),
      setMadhhab: (m) => set({ madhhab: m }),
      
      recordScan: (product, status) => set((state) => ({
        history: [{ ...product, status, time: new Date().toISOString() }, ...state.history]
      })),
      
      addToDisposal: (product) => set((state) => ({
        disposalList: [...state.disposalList, { ...product, id: Date.now() }]
      })),
      
      logout: () => set({ vendorName: '', view: 'terminal' }),
    }),
    { name: 'enterprise-vendor-storage' }
  )
);

// --- 3. MOCK DATABASE ---
const FOOD_DATABASE = [
  { barcode: "111", name: "Gummy Bears", brand: "SugarCo", ingredients: [{ en: "Pork Gelatin", status: "haram" }, { en: "Sugar", status: "halal" }] },
  { barcode: "222", name: "Beef Stew", brand: "HalalFoods", ingredients: [{ en: "Beef", status: "halal" }, { en: "Water", status: "halal" }] },
  { barcode: "333", name: "Seaweed Snacks", brand: "Marine", ingredients: [{ en: "Seaweed", status: "halal" }, { en: "Carmine", status: "haram" }] },
];

// --- 4. ERROR BOUNDARY (Senior Resilience Pattern) ---
class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div style={{padding: '20px', color: 'red'}}>Critical System Failure. Please Refresh.</div>;
    return this.props.children;
  }
}

// --- 5. STYLED COMPONENTS ---
const Container = styled.div` display: grid; grid-template-columns: 260px 1fr; height: 100vh; `;
const Sidebar = styled.nav` background: #0f172a; padding: 20px; border-right: 1px solid #1e293b; display: flex; flex-direction: column; `;
const Main = styled.main` padding: 30px; overflow-y: auto; background: #020617; `;
const StatCard = styled.div` background: #1e293b; padding: 20px; border-radius: 10px; border-left: 4px solid ${props => props.color}; `;
const SearchInput = styled.input` width: 100%; padding: 15px; background: #1e293b; border: 1px solid #334155; color: white; border-radius: 8px; margin-bottom: 20px; `;

// --- 6. ANALYTICS COMPONENT ---
const AnalyticsView = ({ history }) => {
  const stats = useMemo(() => {
    const total = history.length;
    const haram = history.filter(h => h.status === 'HARAM').length;
    const halal = total - haram;
    return { total, haram, halal, rate: total ? ((haram / total) * 100).toFixed(1) : 0 };
  }, [history]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
      <StatCard color="#3b82f6"><h3>Total Scans</h3><h1>{stats.total}</h1></StatCard>
      <StatCard color="#ef4444"><h3>Haram Flagged</h3><h1>{stats.haram}</h1></StatCard>
      <StatCard color="#22c55e"><h3>Halal Approved</h3><h1>{stats.halal}</h1></StatCard>
      <StatCard color="#f59e0b"><h3>Rejection Rate</h3><h1>{stats.rate}%</h1></StatCard>
    </div>
  );
};

// --- 7. TERMINAL COMPONENT (with Fuzzy Search) ---
const TerminalView = () => {
  const [query, setQuery] = useState('');
  const { recordScan, addToDisposal } = useVendorStore();

  // Simple Fuzzy Search implementation
  const filteredProducts = useMemo(() => {
    if (!query) return [];
    return FOOD_DATABASE.filter(p => 
      p.barcode.includes(query) || p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  const handleAction = (product) => {
    const isHaram = product.ingredients.some(i => i.status === 'haram');
    const status = isHaram ? 'HARAM' : 'HALAL';
    recordScan(product, status);
    if (isHaram) addToDisposal(product);
    setQuery('');
    alert(`Logged as ${status}`);
  };

  return (
    <div>
      <SearchInput placeholder="Search by Barcode or Name (Try '111' or 'Beef')..." value={query} onChange={e => setQuery(e.target.value)} />
      {filteredProducts.map(p => (
        <div key={p.barcode} style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
          <div><strong>{p.name}</strong> <small>{p.brand}</small></div>
          <button onClick={() => handleAction(p)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Verify</button>
        </div>
      ))}
    </div>
  );
};

// --- 8. MAIN APP ---
export default function App() {
  const store = useVendorStore();

  if (!store.vendorName) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#020617' }}>
        <div style={{ background: '#1e293b', padding: '40px', borderRadius: '12px', textAlign: 'center' }}>
          <h2>Compliance Login</h2>
          <input placeholder="Enter Employee Name" onKeyDown={e => e.key === 'Enter' && store.setVendor(e.target.value)} style={{ padding: '10px', borderRadius: '4px', border: 'none' }} />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <GlobalStyle />
      <Container>
        <Sidebar>
          <h3>Workstation</h3>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Vendor: {store.vendorName}</p>
          <hr style={{ width: '100%', borderColor: '#1e293b', margin: '20px 0' }} />
          <button onClick={() => store.setView('terminal')} style={{ padding: '10px', marginBottom: '10px', background: store.view === 'terminal' ? '#3b82f6' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}>🔍 Scan Terminal</button>
          <button onClick={() => store.setView('analytics')} style={{ padding: '10px', marginBottom: '10px', background: store.view === 'analytics' ? '#3b82f6' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', borderRadius: '4px' }}>📊 Market Analytics</button>
          <div style={{ marginTop: 'auto' }}>
            <button onClick={store.logout} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>End Shift</button>
          </div>
        </Sidebar>

        <Main>
          <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between' }}>
            <h2>{store.view === 'terminal' ? 'Product Verification' : 'Compliance Insights'}</h2>
            <div style={{ background: '#1e293b', padding: '5px 15px', borderRadius: '20px', fontSize: '0.8rem' }}>System: Online (Local Storage Active)</div>
          </header>

          {store.view === 'terminal' ? <TerminalView /> : <AnalyticsView history={store.history} />}

          {store.disposalList.length > 0 && store.view === 'terminal' && (
            <div style={{ marginTop: '40px', padding: '20px', background: '#450a0a', borderRadius: '8px', border: '1px solid #ef4444' }}>
              <h4>⚠️ Active Disposal List</h4>
              {store.disposalList.map((d, i) => <div key={i} style={{ fontSize: '0.85rem' }}>• {d.name} ({d.brand})</div>)}
            </div>
          )}
        </Main>
      </Container>
    </ErrorBoundary>
  );
}