import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Download, Printer, RotateCcw, ChevronDown } from 'lucide-react';
import {
  INITIAL_MARKETS,
  INITIAL_CHECKLIST,
  DEFAULT_PRODUCTS,
} from './data/marketsData';
import SplitWorkspace from './components/SplitWorkspace';
import PocketCompareTab from './components/PocketCompareTab';
import ChecklistTab from './components/ChecklistTab';
import MarketFormModal from './components/MarketFormModal';

const STORAGE_KEYS = {
  marketsLegacyV2: 'tw_pet_markets_v2',
  marketsLegacyV3: 'tw_pet_markets_v3',
  markets: 'tw_pet_markets_v4',
  favorites: 'tw_pet_favs_v2',
  checklistLegacy: 'tw_pet_checklist_v1',
  checklistSections: 'tw_pet_checklist_sections_v2',
  products: 'tw_pet_products_v1',
};

function loadInitialMarkets() {
  try {
    const savedV4 = localStorage.getItem(STORAGE_KEYS.markets);
    if (savedV4) {
      const parsed = JSON.parse(savedV4);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const prevRaw =
      localStorage.getItem(STORAGE_KEYS.marketsLegacyV3) ||
      localStorage.getItem(STORAGE_KEYS.marketsLegacyV2);
    if (prevRaw) {
      const parsedPrev = JSON.parse(prevRaw);
      if (Array.isArray(parsedPrev)) {
        const customOld = parsedPrev
          .filter((m) => m.isCustom)
          .map((m) => ({ frequencyType: '特殊檔期', ...m }));
        const notesById = new Map(parsedPrev.map((m) => [m.id, m.notes || '']));
        const mergedBuiltins = INITIAL_MARKETS.map((m) => ({
          ...m,
          notes: notesById.get(m.id) || m.notes || '',
        }));
        return [...customOld, ...mergedBuiltins];
      }
    }
  } catch {
    // fallback
  }
  return INITIAL_MARKETS;
}

function flatChecklistToSections(flatList) {
  const map = new Map();
  flatList.forEach((item, idx) => {
    const grp = item.group || '一般準備';
    if (!map.has(grp)) {
      map.set(grp, { id: `sec-init-${map.size + 1}`, title: grp, items: [] });
    }
    map.get(grp).items.push({
      id: item.id || `ck-${idx}`,
      text: item.text,
      done: Boolean(item.done),
    });
  });
  return Array.from(map.values());
}

function loadInitialChecklistSections() {
  try {
    const savedV2 = localStorage.getItem(STORAGE_KEYS.checklistSections);
    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      if (Array.isArray(parsed)) return parsed;
    }
    const savedV1 = localStorage.getItem(STORAGE_KEYS.checklistLegacy);
    if (savedV1) {
      const parsedV1 = JSON.parse(savedV1);
      if (Array.isArray(parsedV1) && parsedV1.length > 0) {
        return flatChecklistToSections(parsedV1);
      }
    }
  } catch {
    // Fallback to built-in default
  }
  return flatChecklistToSections(INITIAL_CHECKLIST);
}

function loadSaved(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function buildCalcForMarket(m) {
  if (!m) {
    return {
      days: 2,
      rentPerDay: 2000,
      electricityPerDay: 150,
      equipmentFee: 600,
      sampleAndPackCost: 800,
      dailyTravelMeal: 700,
      expectedPacksPerDay: 35,
    };
  }
  const isLargeExpo = m.category === '大型寵物展';
  const isFreePark = m.category === '零租金拍片公園';
  return {
    days: m.defaultDays || 2,
    rentPerDay: m.rentPerDay ?? 0,
    electricityPerDay: m.electricityPerDay ?? 0,
    equipmentFee: m.equipmentFee ?? 0,
    sampleAndPackCost: isLargeExpo ? 2500 : isFreePark ? 400 : 800,
    dailyTravelMeal: isLargeExpo ? 800 : isFreePark ? 300 : 700,
    expectedPacksPerDay: isLargeExpo ? 150 : isFreePark ? 15 : 35,
  };
}

export default function App() {
  const [activeView, setActiveView] = useState('workspace');
  const [markets, setMarkets] = useState(loadInitialMarkets);
  const [favorites, setFavorites] = useState(() =>
    loadSaved(STORAGE_KEYS.favorites, ['n-1', 's-2', 's-3', 's-8'])
  );
  const [comparedIds, setComparedIds] = useState(() =>
    loadSaved(STORAGE_KEYS.favorites, ['n-1', 's-2', 's-3', 's-8'])
  );
  const [checklistSections, setChecklistSections] = useState(loadInitialChecklistSections);
  const [products, setProducts] = useState(() =>
    loadSaved(STORAGE_KEYS.products, DEFAULT_PRODUCTS)
  );

  // Filters & Selection (synced to first venue on initial load)
  const [regionFilter, setRegionFilter] = useState('全部');
  const [categoryFilter, setCategoryFilter] = useState('全部類型');
  const [frequencyFilter, setFrequencyFilter] = useState('不限頻率');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState(() => {
    const initMarkets = loadInitialMarkets();
    return initMarkets[0]?.id || INITIAL_MARKETS[0].id;
  });
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  // Live Ledger State (100% transparent 6 visible inputs, synced to selected venue)
  const [calcState, setCalcState] = useState(() => {
    const initMarkets = loadInitialMarkets();
    return buildCalcForMarket(initMarkets[0] || INITIAL_MARKETS[0]);
  });

  // Topbar "More" dropdown menu
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.markets, JSON.stringify(markets));
  }, [markets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.checklistSections, JSON.stringify(checklistSections));
  }, [checklistSections]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);

  // Close "More" dropdown on outside click or Escape
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handleClickOutside = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreMenuOpen]);

  const filteredMarkets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return markets.filter((m) => {
      if (regionFilter !== '全部' && m.region !== regionFilter) return false;
      if (categoryFilter !== '全部類型' && m.category !== categoryFilter) return false;
      if (frequencyFilter !== '不限頻率' && (m.frequencyType || '特殊檔期') !== frequencyFilter)
        return false;
      if (q) {
        const hay = `${m.region} ${m.city} ${m.name} ${m.venue} ${m.organizer} ${m.highlights} ${m.notes} ${m.frequencyType || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [markets, regionFilter, categoryFilter, frequencyFilter, searchTerm]);

  const selectedMarket = useMemo(() => {
    return (
      filteredMarkets.find((m) => m.id === selectedId) ||
      filteredMarkets[0] ||
      null
    );
  }, [filteredMarkets, selectedId]);

  const lastSyncedIdRef = useRef(selectedMarket?.id || null);

  useEffect(() => {
    if (selectedMarket && selectedMarket.id !== lastSyncedIdRef.current) {
      lastSyncedIdRef.current = selectedMarket.id;
      setSelectedId(selectedMarket.id);
      setCalcState(buildCalcForMarket(selectedMarket));
    }
  }, [selectedMarket]);

  const handleSelectMarket = (m) => {
    if (!m) return;
    lastSyncedIdRef.current = m.id;
    setSelectedId(m.id);
    setCalcState(buildCalcForMarket(m));
  };

  const handleResetCalcForSelected = () => {
    if (!selectedMarket) return;
    setCalcState(buildCalcForMarket(selectedMarket));
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        setComparedIds((c) => c.filter((x) => x !== id));
        return prev.filter((x) => x !== id);
      } else {
        setComparedIds((c) => (c.includes(id) ? c : [...c, id]));
        return [...prev, id];
      }
    });
  };

  const toggleCompareId = (id) => {
    setComparedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSaveMarket = (item) => {
    setMarkets((prev) => {
      const exists = prev.some((m) => m.id === item.id);
      if (exists) return prev.map((m) => (m.id === item.id ? item : m));
      return [item, ...prev];
    });
    handleSelectMarket(item);
  };

  const handleDeleteMarket = (id) => {
    if (!window.confirm('確定要移除這個擺攤地點嗎？')) return false;
    setMarkets((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (selectedId === id) {
        const fallback = next[0] || null;
        if (fallback) {
          lastSyncedIdRef.current = fallback.id;
          setSelectedId(fallback.id);
          setCalcState(buildCalcForMarket(fallback));
        }
      }
      return next;
    });
    setFavorites((prev) => prev.filter((x) => x !== id));
    setComparedIds((prev) => prev.filter((x) => x !== id));
    return true;
  };

  const handleResetDefaults = () => {
    setMoreMenuOpen(false);
    if (!window.confirm('確定要還原成原本的全台清單嗎？')) return;
    setMarkets(INITIAL_MARKETS);
    setRegionFilter('全部');
    setCategoryFilter('全部類型');
    setFrequencyFilter('不限頻率');
    setSearchTerm('');
    handleSelectMarket(INITIAL_MARKETS[0]);
  };

  const toggleCheck = (secId, itemId) => {
    setChecklistSections((prev) =>
      prev.map((sec) =>
        sec.id === secId
          ? {
              ...sec,
              items: sec.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            }
          : sec
      )
    );
  };

  const clearAllChecks = () => {
    setChecklistSections((prev) =>
      prev.map((sec) => ({
        ...sec,
        items: sec.items.map((item) => ({ ...item, done: false })),
      }))
    );
  };

  const restoreDefaultChecklist = () => {
    if (!window.confirm('確定要恢復成原本的 4 大區塊、16 個預設檢查項目嗎？（您自行新增的區塊與項目會被覆蓋）')) return;
    setChecklistSections(flatChecklistToSections(INITIAL_CHECKLIST));
  };

  const exportToCsv = (rows, filenamePrefix = '全台毛孩零食擺攤與寵物展清單') => {
    const headers = [
      '地區', '縣市', '類型', '出現頻率', '場地名稱', '舉辦地點', '檔期', '天數',
      '每日攤租(元)', '每日電費(元)', '器材預估(元)', '適合客群', '官方網址', '筆記',
    ];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csvLines = [
      headers.map(esc).join(','),
      ...rows.map((m) =>
        [
          m.region, m.city, m.category, m.frequencyType || '特殊檔期', m.name, m.venue, m.schedule, m.defaultDays,
          m.rentPerDay, m.electricityPerDay, m.equipmentFee, m.petAudience, m.url, m.notes,
        ]
          .map(esc)
          .join(',')
      ),
    ];
    const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenamePrefix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCheckCount = checklistSections.reduce((sum, s) => sum + s.items.length, 0);
  const doneCheckCount = checklistSections.reduce(
    (sum, s) => sum + s.items.filter((c) => c.done).length,
    0
  );

  return (
    <div className="app-root">
      {/* Quiet Top Bar (1 row desktop, compact 2-tier mobile) */}
      <header className="topbar">
        <div className="brand-mark">
          <span className="brand-dot" />
          毛孩擺攤手冊
        </div>

        <nav className="nav-links no-print" aria-label="主導覽">
          <button
            type="button"
            className={`nav-item ${activeView === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveView('workspace')}
          >
            <span>找場地與算帳</span>
            <span className="nav-badge">{markets.length}</span>
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === 'pocket' ? 'active' : ''}`}
            onClick={() => setActiveView('pocket')}
          >
            <span>口袋比預算</span>
            <span className="nav-badge">{favorites.length}</span>
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === 'checklist' ? 'active' : ''}`}
            onClick={() => setActiveView('checklist')}
          >
            <span>行前清單</span>
            <span className="nav-badge">
              {doneCheckCount}/{totalCheckCount}
            </span>
          </button>
        </nav>

        <div className="topbar-actions no-print">
          <button
            type="button"
            className="btn btn-ghost desktop-only-btn"
            onClick={() => exportToCsv(filteredMarkets)}
          >
            <Download size={14} /> 匯出 Excel
          </button>
          <button
            type="button"
            className="btn btn-ghost desktop-only-btn"
            onClick={() => window.print()}
          >
            <Printer size={14} /> 列印
          </button>
          <button
            type="button"
            className="btn btn-primary btn-add-venue"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
          >
            <Plus size={15} /> 新增場次
          </button>

          <div className="more-menu-wrap" ref={moreMenuRef}>
            <button
              type="button"
              className={`btn btn-quiet ${moreMenuOpen ? 'is-open' : ''}`}
              aria-expanded={moreMenuOpen}
              aria-haspopup="menu"
              onClick={() => setMoreMenuOpen((v) => !v)}
            >
              更多 <ChevronDown size={14} />
            </button>

            {moreMenuOpen && (
              <div className="more-menu-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="more-menu-item"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    exportToCsv(filteredMarkets);
                  }}
                >
                  <Download size={14} /> 匯出 Excel
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="more-menu-item"
                  onClick={() => {
                    setMoreMenuOpen(false);
                    window.print();
                  }}
                >
                  <Printer size={14} /> 列印本頁
                </button>
                <div className="more-menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  className="more-menu-item"
                  onClick={handleResetDefaults}
                >
                  <RotateCcw size={14} /> 還原預設清單
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      {activeView === 'workspace' && (
        <SplitWorkspace
          markets={filteredMarkets}
          selectedMarket={selectedMarket}
          onSelectMarket={handleSelectMarket}
          mobileDetailOpen={mobileDetailOpen}
          setMobileDetailOpen={setMobileDetailOpen}
          regionFilter={regionFilter}
          setRegionFilter={setRegionFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          frequencyFilter={frequencyFilter}
          setFrequencyFilter={setFrequencyFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          onEdit={(m) => {
            setEditingItem(m);
            setModalOpen(true);
          }}
          calcState={calcState}
          setCalcState={setCalcState}
          onResetCalc={handleResetCalcForSelected}
          products={products}
          setProducts={setProducts}
        />
      )}

      {activeView === 'pocket' && (
        <PocketCompareTab
          markets={markets}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          comparedIds={comparedIds}
          toggleCompareId={toggleCompareId}
          products={products}
          onJumpToMarket={(m) => {
            setRegionFilter('全部');
            setCategoryFilter('全部類型');
            setSearchTerm('');
            handleSelectMarket(m);
            setActiveView('workspace');
            setMobileDetailOpen(true);
          }}
          onExportCsv={exportToCsv}
        />
      )}

      {activeView === 'checklist' && (
        <ChecklistTab
          sections={checklistSections}
          setSections={setChecklistSections}
          toggleCheck={toggleCheck}
          clearAllChecks={clearAllChecks}
          restoreDefaultChecklist={restoreDefaultChecklist}
        />
      )}

      <MarketFormModal
        isOpen={modalOpen}
        editingItem={editingItem}
        onClose={() => {
          setModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveMarket}
        onDelete={handleDeleteMarket}
      />
    </div>
  );
}
