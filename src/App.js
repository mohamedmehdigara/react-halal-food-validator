import React, { useState, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import styled, { createGlobalStyle, keyframes } from 'styled-components';

// --- 1. GLOBAL STYLES (Modern SaaS Look) ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0; padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
  }
  * { box-sizing: border-box; transition: all 0.2s ease-in-out; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- 2. ZUSTAND STORE ---
const useStore = create(
  persist(
    (set) => ({
      history: [],
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      addHistory: (item) => set((state) => ({
        history: [{ ...item, id: Date.now() }, ...state.history].slice(0, 10)
      })),
    }),
    { name: 'halal-dashboard-v3' }
  )
);

// --- 3. MOCK DATA ---
const PRODUCTS = {
  "123": {
    name: "Golden Honey Gummies",
    brand: "NatureSweet",
    img: "🍬",
    ingredients: [
      { name: "Organic Honey", status: "halal", desc: "Natural sweetener." },
      { name: "Pork Gelatin", status: "haram", desc: "Thickening agent derived from swine.", source: "Standard Fatwa #12" },
      { name: "Pectin", status: "halal", desc: "Fruit-based gelling agent." }
    ]
  },
  "456": {
    name: "Mountain Spring Water",
    brand: "PureLife",
    img: "💧",
    ingredients: [
      { name: "Spring Water", status: "halal", desc: "Natural source." }
    ]
  }
};

// --- 4. STYLED COMPONENTS (The "Non-Terminal" UI) ---
const DashboardLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
`;

const Sidebar = styled.div`
  background: white;
  border-right: 1px solid #e2e8f0;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const MainContent = styled.div`
  padding: 3rem;
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: white;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  font-size: 1rem;
  margin-bottom: 2rem;
  &:focus { outline: 2px solid #3b82f6; border-color: transparent; }
`;

const ProductHero = styled.div`
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  animation: ${fadeIn} 0.4s ease-out;
`;

const StatusBanner = styled.div`
  padding: 1rem 2rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 700;
  margin-bottom: 2rem;
  background: ${props => props.type === 'haram' ? '#fef2f2' : '#f0fdf4'};
  color: ${props => props.type === 'haram' ? '#991b1b' : '#166534'};
  border: 1px solid ${props => props.type === 'haram' ? '#fee2e2' : '#dcfce7'};
`;

const TabContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  border-bottom: 2px solid #f1f5f9;
  margin-bottom: 2rem;
`;

const Tab = styled.button`
  padding: 0.75rem 0;
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  color: ${props => props.active ? '#3b82f6' : '#64748b'};
  font-weight: 600;
  cursor: pointer;
  &:hover { color: #3b82f6; }
`;

const IngredientGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
`;

const IngredientCard = styled.div`
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  position: relative;
  &:hover { border-color: #cbd5e1; transform: translateY(-2px); }
`;

const StatusDot = styled.span`
  height: 10px;
  width: 10px;
  background-color: ${props => props.status === 'halal' ? '#22c55e' : '#ef4444'};
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
`;

// --- 5. MAIN APP ---
export default function App() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { history, addHistory, language, setLanguage } = useStore();

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (PRODUCTS[val]) {
      const p = PRODUCTS[val];
      setSelectedProduct(p);
      const isHaram = p.ingredients.some(i => i.status === 'haram');
      addHistory({ name: p.name, status: isHaram ? 'haram' : 'halal' });
    }
  };

  const isHaram = selectedProduct?.ingredients.some(i => i.status === 'haram');

  return (
    <>
      <GlobalStyle />
      <DashboardLayout>
        <Sidebar>
          <h2 style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🛡️</span> Verifier
          </h2>
          
          <div>
            <small style={{ color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Recent Scans</small>
            <div style={{ marginTop: '1rem' }}>
              {history.map(item => (
                <div key={item.id} style={{ padding: '0.5rem 0', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>{item.name}</span>
                  <StatusDot status={item.status} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ width: '100%', padding: '0.5rem' }}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </Sidebar>

        <MainContent>
          <SearchBar 
            placeholder="Scan barcode or type '123'..." 
            value={query}
            onChange={handleSearch}
          />

          {!selectedProduct ? (
            <div style={{ textAlign: 'center', marginTop: '10rem', color: '#94a3b8' }}>
              <h1 style={{ fontSize: '4rem' }}>🛒</h1>
              <p>Ready to verify. Scan a product to begin.</p>
            </div>
          ) : (
            <ProductHero>
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '4rem', background: '#f1f5f9', padding: '1rem', borderRadius: '20px' }}>
                  {selectedProduct.img}
                </div>
                <div>
                  <h1 style={{ margin: 0 }}>{selectedProduct.name}</h1>
                  <p style={{ color: '#64748b', margin: '0.5rem 0' }}>{selectedProduct.brand}</p>
                </div>
              </div>

              <StatusBanner type={isHaram ? 'haram' : 'halal'}>
                {isHaram ? '⚠️ HARAM PRODUCT DETECTED' : '✅ 100% HALAL COMPLIANT'}
              </StatusBanner>

              <TabContainer>
                <Tab active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>Overview</Tab>
                <Tab active={activeTab === 'ingredients'} onClick={() => setActiveTab('ingredients')}>Ingredients ({selectedProduct.ingredients.length})</Tab>
                <Tab active={activeTab === 'sources'} onClick={() => setActiveTab('sources')}>Certifications</Tab>
              </TabContainer>

              {activeTab === 'overview' && (
                <div style={{ lineHeight: 1.6 }}>
                  <p>This product was analyzed across 3 global databases. It contains {selectedProduct.ingredients.length} total elements.</p>
                  {isHaram && <p style={{ color: '#ef4444', fontWeight: 'bold' }}>Reason for flag: Contains pork-derived gelatin which is strictly prohibited.</p>}
                </div>
              )}

              {activeTab === 'ingredients' && (
                <IngredientGrid>
                  {selectedProduct.ingredients.map((ing, idx) => (
                    <IngredientCard key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <StatusDot status={ing.status} />
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{ing.status.toUpperCase()}</span>
                      </div>
                      <strong>{ing.name}</strong>
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem' }}>{ing.desc}</p>
                    </IngredientCard>
                  ))}
                </IngredientGrid>
              )}

              {activeTab === 'sources' && (
                <div>
                  <p>Verified against:</p>
                  <ul>
                    <li>GIMDES Halal Certification</li>
                    <li>HMC (Halal Monitoring Committee)</li>
                  </ul>
                </div>
              )}
            </ProductHero>
          )}
        </MainContent>
      </DashboardLayout>
    </>
  );
}