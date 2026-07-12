import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building as BuildingIcon, Layers, Home, Plus, Edit2, 
  Trash2, MapPin, AlignLeft, Info, HelpCircle, Save, X 
} from 'lucide-react';
import { Building, Floor, Apartment, UserRole } from '../types';

interface BuildingViewProps {
  buildings: Building[];
  floors: Floor[];
  apartments: Apartment[];
  userRole: UserRole;
  onAddBuilding: (b: Omit<Building, 'id'>) => void;
  onUpdateBuilding: (b: Building) => void;
  onDeleteBuilding: (id: string) => void;
  onAddFloor: (f: Omit<Floor, 'id'>) => void;
  onUpdateFloor: (f: Floor) => void;
  onDeleteFloor: (id: string) => void;
  onAddApartment: (a: Omit<Apartment, 'id'>) => void;
  onUpdateApartment: (a: Apartment) => void;
  onDeleteApartment: (id: string) => void;
}

export default function BuildingView({
  buildings,
  floors,
  apartments,
  userRole,
  onAddBuilding,
  onUpdateBuilding,
  onDeleteBuilding,
  onAddFloor,
  onUpdateFloor,
  onDeleteFloor,
  onAddApartment,
  onUpdateApartment,
  onDeleteApartment
}: BuildingViewProps) {
  const isReadOnly = userRole === 'read_only';
  const canDelete = userRole === 'admin' || userRole === 'landlord';

  // Selected state for navigation
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(buildings[0]?.id || '');
  
  // Modals / forms states
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [buildingName, setBuildingName] = useState('');
  const [buildingAddress, setBuildingAddress] = useState('');
  const [buildingDesc, setBuildingDesc] = useState('');

  const [showFloorModal, setShowFloorModal] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [floorName, setFloorName] = useState('');
  const [floorBuildingId, setFloorBuildingId] = useState('');

  const [showAptModal, setShowAptModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Apartment | null>(null);
  const [aptNumber, setAptNumber] = useState('');
  const [aptFloorId, setAptFloorId] = useState('');
  const [aptBuildingId, setAptBuildingId] = useState('');
  const [aptRent, setAptRent] = useState(0);
  const [aptStatus, setAptStatus] = useState<'Occupied' | 'Vacant' | 'Maintenance'>('Vacant');
  const [aptDesc, setAptDesc] = useState('');

  // Building modal openers
  const openAddBuilding = () => {
    setEditingBuilding(null);
    setBuildingName('');
    setBuildingAddress('');
    setBuildingDesc('');
    setShowBuildingModal(true);
  };

  const openEditBuilding = (b: Building) => {
    setEditingBuilding(b);
    setBuildingName(b.name);
    setBuildingAddress(b.address);
    setBuildingDesc(b.description);
    setShowBuildingModal(true);
  };

  const handleSaveBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBuilding) {
      onUpdateBuilding({
        ...editingBuilding,
        name: buildingName,
        address: buildingAddress,
        description: buildingDesc
      });
    } else {
      onAddBuilding({
        name: buildingName,
        address: buildingAddress,
        description: buildingDesc
      });
    }
    setShowBuildingModal(false);
  };

  // Floor modal openers
  const openAddFloor = () => {
    setEditingFloor(null);
    setFloorName('');
    setFloorBuildingId(selectedBuildingId);
    setShowFloorModal(true);
  };

  const openEditFloor = (f: Floor) => {
    setEditingFloor(f);
    setFloorName(f.name);
    setFloorBuildingId(f.buildingId);
    setShowFloorModal(true);
  };

  const handleSaveFloor = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFloor) {
      onUpdateFloor({
        ...editingFloor,
        name: floorName,
        buildingId: floorBuildingId
      });
    } else {
      onAddFloor({
        name: floorName,
        buildingId: floorBuildingId
      });
    }
    setShowFloorModal(false);
  };

  // Apartment modal openers
  const openAddApt = (floorId: string) => {
    setEditingApt(null);
    setAptNumber('');
    setAptFloorId(floorId);
    setAptBuildingId(selectedBuildingId);
    setAptRent(40000);
    setAptStatus('Vacant');
    setAptDesc('');
    setShowAptModal(true);
  };

  const openEditApt = (a: Apartment) => {
    setEditingApt(a);
    setAptNumber(a.number);
    setAptFloorId(a.floorId);
    setAptBuildingId(a.buildingId);
    setAptRent(a.monthlyRent);
    setAptStatus(a.status);
    setAptDesc(a.description);
    setShowAptModal(true);
  };

  const handleSaveApt = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingApt) {
      onUpdateApartment({
        ...editingApt,
        number: aptNumber,
        floorId: aptFloorId,
        buildingId: aptBuildingId,
        monthlyRent: Number(aptRent),
        status: aptStatus,
        description: aptDesc
      });
    } else {
      onAddApartment({
        number: aptNumber,
        floorId: aptFloorId,
        buildingId: aptBuildingId,
        monthlyRent: Number(aptRent),
        status: aptStatus,
        description: aptDesc
      });
    }
    setShowAptModal(false);
  };

  // Filter structures
  const activeBuilding = buildings.find(b => b.id === selectedBuildingId) || buildings[0];
  const buildingFloors = floors.filter(f => f.buildingId === selectedBuildingId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Properties & Hierarchy / جائیدادیں اور عمارتیں</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Construct buildings, floors, and dynamic apartment assignments / عمارتوں، منزلوں اور فلیٹوں کی تفصیل
          </p>
        </div>
        {!isReadOnly && (
          <button
            onClick={openAddBuilding}
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-colors text-white py-2 px-4 rounded-xl text-sm font-semibold cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            <Plus className="w-4 h-4" />
            Add Building / عمارت شامل کریں
          </button>
        )}
      </div>

      {/* Buildings Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buildings.map((b) => {
          const isSelected = b.id === selectedBuildingId;
          const apts = apartments.filter(a => a.buildingId === b.id);
          const occupiedCount = apts.filter(a => a.status === 'Occupied').length;
          
          return (
            <motion.div
              key={b.id}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedBuildingId(b.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10 shadow-md shadow-emerald-500/5' 
                  : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    <BuildingIcon className="w-5 h-5" />
                  </div>
                  {!isReadOnly && isSelected && (
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => openEditBuilding(b)}
                        className="p-1 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && (
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${b.name}? This will delete all floors and apartments inside it!`)) {
                              onDeleteBuilding(b.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <h3 className={`font-bold mt-4 text-base ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                  {b.name}
                </h3>
                <p className="text-slate-400 text-xs mt-1 line-clamp-2">
                  {b.description || 'No description supplied.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {b.address.split(',')[0]}
                </span>
                <span>{occupiedCount}/{apts.length} Occupied</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floors and Apartments Hierarchy */}
      {activeBuilding && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                Floor Scheme: {activeBuilding.name}
              </h2>
              <p className="text-xs text-slate-400">Manage floors, structural maps, and houses inside them.</p>
            </div>
            {!isReadOnly && (
              <button
                onClick={openAddFloor}
                className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-slate-700 dark:text-white py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Floor to Building
              </button>
            )}
          </div>

          <div className="space-y-6">
            {buildingFloors.map((f) => {
              const floorApts = apartments.filter(a => a.floorId === f.id);
              
              return (
                <div key={f.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        {f.name}
                      </span>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-500 py-0.5 px-2 rounded-full font-mono">
                        {floorApts.length} Apartments
                      </span>
                    </div>
                    
                    {!isReadOnly && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => openAddApt(f.id)}
                          className="text-xs text-emerald-500 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <Plus className="w-3 h-3" /> Add House
                        </button>
                        <span className="text-slate-300">|</span>
                        <button 
                          onClick={() => openEditFloor(f)}
                          className="p-1 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button 
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${f.name}? All apartments inside it will be orphaned.`)) {
                                onDeleteFloor(f.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Apartments inside Floor Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {floorApts.map((apt) => (
                      <div 
                        key={apt.id} 
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 p-4 relative hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {apt.number}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-full ${
                            apt.status === 'Occupied' 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : apt.status === 'Maintenance' 
                                ? 'bg-amber-500/10 text-amber-500' 
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-300'
                          }`}>
                            {apt.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex justify-between">
                            <span>Rent:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                              PKR {apt.monthlyRent.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-400 line-clamp-1 mt-1 font-sans">
                            {apt.description || 'No description.'}
                          </p>
                        </div>

                        {!isReadOnly && (
                          <div className="flex justify-end gap-1 border-t border-slate-50 dark:border-slate-700/50 mt-3 pt-2">
                            <button 
                              onClick={() => openEditApt(apt)}
                              className="p-1 text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            {canDelete && (
                              <button 
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${apt.number}?`)) {
                                    onDeleteApartment(apt.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}

                    {floorApts.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400 font-mono">
                        No houses created on this floor yet.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {buildingFloors.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-slate-700 dark:text-slate-300 font-semibold text-sm">No floors created yet</h4>
                <p className="text-slate-400 text-xs mt-1">Add floors to this building to start hosting apartments.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BUILDING MODAL */}
      <AnimatePresence>
        {showBuildingModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingBuilding ? 'Update Building' : 'Create New Building'}
                </h3>
                <button onClick={() => setShowBuildingModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBuilding} className="space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    Building Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="Al-Haram Heights"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    Address *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={buildingAddress}
                      onChange={(e) => setBuildingAddress(e.target.value)}
                      placeholder="Plot 42-C, Sector F-11, Islamabad"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={buildingDesc}
                    onChange={(e) => setBuildingDesc(e.target.value)}
                    placeholder="Provide any description details or amenities..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowBuildingModal(false)}
                    className="py-2 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    <Save className="w-4 h-4" />
                    Save Building
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOOR MODAL */}
      <AnimatePresence>
        {showFloorModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingFloor ? 'Update Floor' : 'Create New Floor'}
                </h3>
                <button onClick={() => setShowFloorModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFloor} className="space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    Floor Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={floorName}
                    onChange={(e) => setFloorName(e.target.value)}
                    placeholder="Floor 1 or Basement"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    Associated Building
                  </label>
                  <select
                    value={floorBuildingId}
                    onChange={(e) => setFloorBuildingId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowFloorModal(false)}
                    className="py-2 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    <Save className="w-4 h-4" />
                    Save Floor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APARTMENT MODAL */}
      <AnimatePresence>
        {showAptModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-100 dark:border-slate-700 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingApt ? 'Update Apartment' : 'Create New Apartment'}
                </h3>
                <button onClick={() => setShowAptModal(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveApt} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Apartment Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={aptNumber}
                      onChange={(e) => setAptNumber(e.target.value)}
                      placeholder="House 1 or Apt 101"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Monthly Rent (PKR) *
                    </label>
                    <input
                      type="number"
                      required
                      value={aptRent}
                      onChange={(e) => setAptRent(Number(e.target.value))}
                      placeholder="45000"
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Floor Assignment
                    </label>
                    <select
                      value={aptFloorId}
                      onChange={(e) => setAptFloorId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {floors.filter(f => f.buildingId === aptBuildingId).map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                      Apt Status
                    </label>
                    <select
                      value={aptStatus}
                      onChange={(e) => setAptStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="Vacant">Vacant</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={aptDesc}
                    onChange={(e) => setAptDesc(e.target.value)}
                    placeholder="Provide details (e.g. 2 bedrooms, marble flooring...)"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => setShowAptModal(false)}
                    className="py-2 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 px-4 rounded-xl text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10"
                  >
                    <Save className="w-4 h-4" />
                    Save Apartment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
