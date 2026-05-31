'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Search, 
  Phone, 
  Mail, 
  MapPin,
  Filter,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  Pencil,
  Trash2,
  Download,
  Star,
  Users
} from 'lucide-react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  phone: string;
  city: string;
  totalShipments: number;
  totalSpent: number;
  balance: number;
  status: 'VIP' | 'ACTIVE';
}

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Mustafe Ismail', phone: '+252 63 777 8986', city: 'Hargeisa', totalShipments: 12, totalSpent: 4500.00, balance: 0.00, status: 'VIP' },
  { id: '2', name: 'Sahra Hassan', phone: '+252 63 444 2211', city: 'Berbera', totalShipments: 3, totalSpent: 850.00, balance: 150.00, status: 'ACTIVE' },
  { id: '3', name: 'Ahmed Ali', phone: '+252 61 555 1234', city: 'Hargeisa', totalShipments: 28, totalSpent: 12400.00, balance: 0.00, status: 'VIP' },
];

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Add / Edit Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cCity, setCCity] = useState('Hargeisa');
  const [cStatus, setCStatus] = useState<'ACTIVE' | 'VIP'>('ACTIVE');
  const [cShipments, setCShipments] = useState('0');
  const [cSpent, setCSpent] = useState('0');
  const [cBalance, setCBalance] = useState('0');

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error('Failed to load customers');
      const data = await res.json();
      setCustomers(data.map((c: any) => ({
        id: c._id || c.id,
        name: c.name,
        phone: c.phone,
        city: c.city || 'Hargeisa',
        totalShipments: c.totalShipments || 0,
        totalSpent: c.totalSpent || 0,
        balance: c.balance || 0,
        status: c.status || 'ACTIVE'
      })));
    } catch (e) {
      console.error(e);
      setCustomers(DEFAULT_CUSTOMERS);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer account?')) {
      try {
        const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete');
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        alert(`Error: ${err.message}`);
      }
    }
  };

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Customer Name,Phone,City,Total Shipments,Total Spent,Balance,Tier"].join(",") + "\n"
      + customers.map(c => `"${c.name}","${c.phone}","${c.city}",${c.totalShipments},${c.totalSpent},${c.balance},"${c.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "qcargo_crm_customers.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setCName('');
    setCPhone('');
    setCCity('Hargeisa');
    setCStatus('ACTIVE');
    setCShipments('0');
    setCSpent('0');
    setCBalance('0');
    setShowModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setIsEditMode(true);
    setEditingId(cust.id);
    setCName(cust.name);
    setCPhone(cust.phone);
    setCCity(cust.city);
    setCStatus(cust.status);
    setCShipments(cust.totalShipments.toString());
    setCSpent(cust.totalSpent.toString());
    setCBalance(cust.balance ? cust.balance.toString() : '0');
    setShowModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cPhone.trim()) {
      alert('Name and Phone number are required');
      return;
    }

    const payload = {
      name: cName,
      phone: cPhone,
      city: cCity,
      status: cStatus,
      totalShipments: parseInt(cShipments) || 0,
      totalSpent: parseFloat(cSpent) || 0,
      balance: parseFloat(cBalance) || 0,
    };

    try {
      if (isEditMode && editingId) {
        const res = await fetch(`/api/customers?id=${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update customer');
        const updated = await res.json();
        setCustomers(prev => prev.map(c => c.id === editingId ? { ...updated, id: updated._id || updated.id } : c));
      } else {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create customer');
        const saved = await res.json();
        setCustomers(prev => [{ ...saved, id: saved._id || saved.id }, ...prev]);
      }
      setShowModal(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter(cust => 
    cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cust.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-container">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Customer CRM</h1>
          <p className="text-slate-400 font-medium font-sans">Relationship management and client transaction history</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none btn bg-white border border-slate-800 text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 shadow-sm"
          >
            <Download size={18} />
            Export List
          </button>
          <button 
            onClick={openAddModal}
            className="flex-1 md:flex-none btn btn-primary flex items-center justify-center gap-2 shadow-lg shadow-[#F15D38]/20"
          >
            <UserPlus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Portfolio</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-3xl font-black text-slate-100">{customers.length}</h3>
            <div className="p-2 rounded-xl bg-[#F15D38]/10 text-[#F15D38]">
              <Users size={20} />
            </div>
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Account Receivables</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-3xl font-black text-rose-500">${customers.reduce((acc, c) => acc + c.balance, 0).toLocaleString()}</h3>
            <div className="p-2 rounded-xl bg-rose-950/30 text-rose-400 border border-rose-800/20">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>
        <div className="shipment-card">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">VIP Retention</p>
          <div className="flex items-center justify-between mt-2">
            <h3 className="text-3xl font-black text-slate-100">
              {Math.round((customers.filter(c => c.status === 'VIP').length / (customers.length || 1)) * 100)}%
            </h3>
            <div className="p-2 rounded-xl bg-amber-950/30 text-amber-400 border border-amber-800/20">
              <Star size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#F15D38] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search by Name, Phone, or Location..." 
            className="search-input !pl-12 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn bg-white border border-slate-800 text-slate-300 flex items-center gap-2 hover:bg-slate-800 px-6">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* CRM Table */}
      <div className="shipment-card !p-0 overflow-hidden border border-slate-800 shadow-xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 border-b border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer / Contact</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shipment Count</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tier</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Balance</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCustomers.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-800/30 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-slate-400 text-xs">
                        {cust.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-100">{cust.name}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 tracking-wider font-mono">{cust.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-slate-500" />
                      <span className="text-xs font-bold text-slate-300">{cust.city}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{cust.totalShipments}</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Orders</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                      cust.status === 'VIP' ? 'bg-amber-950/30 text-amber-400 border border-amber-800/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {cust.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`font-black text-sm ${cust.balance > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {cust.balance > 0 ? `-$${cust.balance.toFixed(2)}` : 'CLEAN'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 uppercase mt-1">Total: ${cust.totalSpent.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(cust)}
                        className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg transition-colors" 
                        title="View/Edit Profile"
                      >
                        <Pencil size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(cust.id)}
                        className="p-2 hover:bg-rose-950/30 text-slate-400 hover:text-rose-500 rounded-lg transition-colors" 
                        title="Delete Customer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-10 text-center text-xs font-bold text-slate-500">No client portfolio found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRM Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl w-full max-w-lg p-8 shadow-2xl shadow-slate-950/50">
            <h3 className="text-xl font-black text-slate-100 tracking-tight mb-6">
              {isEditMode ? 'Modify Client Profile' : 'Register New Client'}
            </h3>
            
            <form onSubmit={handleSaveCustomer} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer Full Name</label>
                <input 
                  type="text" 
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Mustafe Ismail"
                  className="search-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact Number</label>
                <input 
                  type="text" 
                  value={cPhone}
                  onChange={(e) => setCPhone(e.target.value)}
                  placeholder="e.g. +252 63 777 8986"
                  className="search-input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">City</label>
                  <input 
                    type="text" 
                    value={cCity}
                    onChange={(e) => setCCity(e.target.value)}
                    placeholder="e.g. Hargeisa"
                    className="search-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Tier</label>
                  <select 
                    value={cStatus}
                    onChange={(e: any) => setCStatus(e.target.value)}
                    className="search-input w-full bg-[#0B0F19]"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              {isEditMode && (
                <div className="grid grid-cols-3 gap-4 border-t border-slate-800/60 pt-4">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Shipment Count</label>
                    <input 
                      type="number" 
                      value={cShipments}
                      onChange={(e) => setCShipments(e.target.value)}
                      className="search-input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Total Spent ($)</label>
                    <input 
                      type="number" 
                      value={cSpent}
                      onChange={(e) => setCSpent(e.target.value)}
                      className="search-input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Balance ($)</label>
                    <input 
                      type="number" 
                      value={cBalance}
                      onChange={(e) => setCBalance(e.target.value)}
                      className="search-input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn bg-[#131B2E] border border-slate-800 text-slate-300 px-6"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary px-8 shadow-lg shadow-[#F15D38]/20"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
