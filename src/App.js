import React, { useState, useMemo, useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import styled, { createGlobalStyle } from 'styled-components';

// --- 1. GLOBAL STYLES ---
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0; padding: 0;
    font-family: 'Inter', sans-serif;
    background-color: #020617;
    color: #f1f5f9;
  }
`;

// --- 2. ZUSTAND STORE WITH PERSISTENCE ---
// This ensures that the vendor's shift data and disposal list survive a page refresh.
const useVendorStore = create(
  persist(
    (set) => ({
      vendorName: '',
      language: 'en',
      madhhab: 'General', // Jurisdiction Logic
      scannedProduct: null,
      history: [],
      disposalList: [],
      isSyncing: false,

      setVendor: (name) => set({ vendorName: name }),
      setLanguage: (lang) => set({ language: lang }),
      setMadhhab: (m) => set({ madhhab: m }),
      
      setProduct: (product) => set((state) => ({
        scannedProduct: { ...product, hasPhysicalStamp: false },
        history: [{ ...product, scanTime: new Date().toLocaleTimeString() }, ...state.history].slice(0, 5)
      })),

      toggleStamp: (value) => set((state) => ({
        scannedProduct: { ...state.scannedProduct, hasPhysicalStamp: value }
      })),

      addToDisposal: (product) => set((state) => ({
        disposalList: [...state.disposalList, { ...product, id: Date.now() }],
        scannedProduct: null
      })),

      setSyncing: (status) => set({ isSyncing: status }),
      clearAll: () => set({ scannedProduct: null, history: [], disposalList: [] }),
    }),
    { name: 'vendor-station-storage' }
  )
);

// --- 3. DATABASE WITH JURISDICTIONAL DATA ---
const FOOD_DATABASE = {
  "333": {
    name: "Canned Seafood Mix",
    brand: "OceanPrime",
    ingredients: [
      { id: 1, en: "Shrimp", ar: "جمبري", status: "halal", madhhab_exception: { "Hanafi": "mushbooh" } },
      { id: 2, en: "Shellac Glaze", ar: "ملمع شيلاك", status: "halal", madhhab_exception: { "General": "mushbooh" } }
    ]
  }
};

// --- 4. STYLED COMPONENTS ---
const Layout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 15px;
  padding: 15px;
  height: 100vh;
  box-sizing: border-box;
`;

const Card = styled.div`
  background: #1e293b;
  border-radius: 10px;
  padding: 20px;
  border: 1px solid #334155;
  display: flex;
  flex-direction: column;
`;

const SyncOverlay = styled.div`
  position: absolute;
  top: 10px; right: 10px;
  background: #0ea5e9;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.7rem;
  animation: pulse 1.5s infinite;
  @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
`;

// --- 5. MAIN APPLICATION ---
export default function App() {
  const [barcode, setBarcode] = useState('');
  const store = useVendorStore();

  // MOCK ASYNC SYNC: Simulates pushing to an inventory system
  const handleSync = async () => {
    store.setSyncing(true);
    await new Promise(res => setTimeout(res, 2000)); // Simulate delay
    alert("Central Inventory Updated Successfully");
    store.setSyncing(false);
  };

  // ADVANCED LOGIC: Madhhab-specific filtering
  const finalStatus = useMemo(() => {
    if (!store.scannedProduct) return null;
    
    let haramCount = 0;
    let mushboohCount = 0;

    store.scannedProduct.ingredients.forEach(ing => {
      // Check if this specific Madhhab has a different ruling
      const effectiveStatus = ing.madhhab_exception?.[store.madhhab] || ing.status;
      if (effectiveStatus === 'haram') haramCount++;
      if (effectiveStatus === 'mushbooh') mushboohCount++;
    });

    if (haramCount > 0) return 'HARAM';
    if (mushboohCount > 0 && !store.scannedProduct.hasPhysicalStamp) return 'MUSHBOOH';
    return 'HALAL';
  }, [store.scannedProduct, store.madhhab]);

  if (!store.vendorName) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Card style={{ width: '300px', textAlign: 'center' }}>
          <h3>Shift Login</h3>
          <input 
            placeholder="Vendor Name" 
            onKeyDown={(e) => e.key === 'Enter' && store.setVendor(e.target.value)}
            style={{ padding: '10px', marginBottom: '10px' }}
          />
          <small>Press Enter to start shift</small>
        </Card>
      </div>
    );
  }

  return (
    <>
      <GlobalStyle />
      {store.isSyncing && <SyncOverlay>SYNCING WITH HUB...</SyncOverlay>}
      
      <Layout>
        {/* Left Panel: Settings & Shift Info */}
        <Card>
          <h3>👤 {store.vendorName}</h3>
          <hr style={{ width: '100%', borderColor: '#334155' }} />
          
          <label><small>Jurisdiction (Madhhab)</small></label>
          <select value={store.madhhab} onChange={(e) => store.setMadhhab(e.target.value)} style={{ marginBottom: '15px' }}>
            <option value="General">General / Shafi'i</option>
            <option value="Hanafi">Hanafi</option>
            <option value="Maliki">Maliki</option>
          </select>

          <label><small>Interface Language</small></label>
          <select value={store.language} onChange={(e) => store.setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>

          <button onClick={() => store.setVendor('')} style={{ marginTop: 'auto', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', cursor: 'pointer' }}>
            End Shift
          </button>
        </Card>

        {/* Center: Main Scan Area */}
        <Card style={{ background: '#0f172a' }}>
          <form onSubmit={(e) => { e.preventDefault(); if(FOOD_DATABASE[barcode]) store.setProduct(FOOD_DATABASE[barcode]); setBarcode(''); }}>
            <input 
              value={barcode} 
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Scan Barcode (333)..."
              style={{ width: '100%', padding: '15px', boxSizing: 'border-box', background: '#1e293b', color: 'white', border: 'none', borderRadius: '5px' }}
            />
          </form>

          {store.scannedProduct && (
            <div style={{ marginTop: '20px' }}>
              <div style={{ padding: '15px', borderRadius: '5px', textAlign: 'center', fontWeight: 'bold', background: finalStatus === 'HARAM' ? '#ef4444' : '#22c55e' }}>
                {finalStatus} {store.scannedProduct.hasPhysicalStamp && "✓"}
              </div>
              
              <div style={{ marginTop: '15px' }}>
                <input type="checkbox" checked={store.scannedProduct.hasPhysicalStamp} onChange={(e) => store.toggleStamp(e.target.checked)} />
                <label style={{ marginLeft: '10px' }}>Physical Halal Stamp Present</label>
              </div>

              {store.scannedProduct.ingredients.map(ing => (
                <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #334155' }}>
                  <span>{ing[store.language]}</span>
                  <span style={{ color: (ing.madhhab_exception?.[store.madhhab] || ing.status) === 'haram' ? '#ef4444' : '#94a3b8' }}>
                    {(ing.madhhab_exception?.[store.madhhab] || ing.status).toUpperCase()}
                  </span>
                </div>
              ))}

              <button 
                onClick={() => store.addToDisposal(store.scannedProduct)}
                style={{ width: '100%', marginTop: '20px', padding: '10px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}
              >
                FLAG FOR DISPOSAL
              </button>
            </div>
          )}
        </Card>

        {/* Right: History & Sync */}
        <Card>
          <h4>📦 Disposal Queue</h4>
          <div style={{ flex: 1 }}>
            {store.disposalList.map(item => (
              <div key={item.id} style={{ fontSize: '0.8rem', padding: '5px', background: '#450a0a', marginBottom: '5px' }}>
                {item.name}
              </div>
            ))}
          </div>
          <button 
            disabled={store.disposalList.length === 0 || store.isSyncing}
            onClick={handleSync}
            style={{ padding: '10px', background: '#0ea5e9', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            {store.isSyncing ? "SYNCING..." : "COMMIT TO INVENTORY"}
          </button>
        </Card>
      </Layout>
    </>
  );
}