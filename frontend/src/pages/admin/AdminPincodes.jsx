// pages/admin/AdminPincodes.jsx — Manage delivery pincode charges
import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, MapPin, Save, X } from 'lucide-react'
import { db } from '../../utils/api'
import LoadingSpinner from '../../components/LoadingSpinner'
import toast from 'react-hot-toast'

export default function AdminPincodes() {
  const [pincodes, setPincodes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [editId, setEditId]     = useState(null)
  const [showForm, setShowForm] = useState(false)

  const emptyForm = { pincode: '', area_city: '', delivery_charge: '' }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { fetchPincodes() }, [])

  async function fetchPincodes() {
    setLoading(true)
    const { data } = await db.orders.getPincodes()
    setPincodes(data || [])
    setLoading(false)
  }

  function startEdit(row) {
    setForm({ pincode: row.pincode, area_city: row.area_city, delivery_charge: String(row.delivery_charge) })
    setEditId(row.id)
    setShowForm(true)
  }

  function cancelForm() {
    setForm(emptyForm); setEditId(null); setShowForm(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.pincode || !form.area_city || form.delivery_charge === '') {
      toast.error('All fields are required'); return
    }
    setSaving(true)
    const { error } = await db.orders.savePincode({
      pincode:         form.pincode.trim(),
      area_city:       form.area_city.trim(),
      delivery_charge: parseFloat(form.delivery_charge),
    })
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success('Pincode saved!')
    cancelForm()
    fetchPincodes()
  }

  async function handleDelete(pincode) {
    if (!window.confirm(`Delete pincode ${pincode}?`)) return
    const { error } = await db.orders.deletePincode(pincode)
    if (error) toast.error(error.message)
    else { toast.success('Deleted'); fetchPincodes() }
  }

  if (loading) return <LoadingSpinner text="Loading pincodes…" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-bark-800">Delivery Pincodes</h1>
          <p className="text-wood-500 text-sm">{pincodes.length} pincodes configured</p>
        </div>
        <button onClick={() => { cancelForm(); setShowForm(true) }}
          className="btn-primary flex items-center gap-2 text-sm py-2">
          <Plus size={16} /> Add Pincode
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 space-y-4">
          <h2 className="font-serif text-xl text-bark-800">{editId ? 'Edit' : 'Add'} Pincode</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1">Pincode *</label>
              <input value={form.pincode} onChange={e => setForm(f => ({...f, pincode: e.target.value.replace(/\D/g,'').slice(0,10)}))}
                className="input-field" placeholder="e.g. 425503" required disabled={!!editId} />
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1">Area / City *</label>
              <input value={form.area_city} onChange={e => setForm(f => ({...f, area_city: e.target.value}))}
                className="input-field" placeholder="e.g. Faizpur, Jalgaon" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-bark-700 mb-1">Delivery Charge (₹) *</label>
              <input type="number" min="0" step="0.01" value={form.delivery_charge}
                onChange={e => setForm(f => ({...f, delivery_charge: e.target.value}))}
                className="input-field" placeholder="0 for free" required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm py-2">
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={cancelForm} className="btn-secondary flex items-center gap-2 text-sm py-2">
              <X size={14} /> Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-bark-800 text-white">
              <tr>
                <th className="px-5 py-3 text-left">Pincode</th>
                <th className="px-5 py-3 text-left">Area / City</th>
                <th className="px-5 py-3 text-right">Delivery Charge</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pincodes.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-cream-50'}>
                  <td className="px-5 py-3 font-mono font-medium text-bark-700">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-wood-400" /> {row.pincode}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-wood-600">{row.area_city}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-semibold ${row.delivery_charge === 0 ? 'text-green-600' : 'text-bark-800'}`}>
                      {row.delivery_charge === 0 ? 'FREE' : `₹${parseFloat(row.delivery_charge).toLocaleString('en-IN')}`}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => startEdit(row)}
                        className="p-1.5 rounded-lg text-wood-500 hover:text-wood-800 hover:bg-cream-100 transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(row.pincode)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pincodes.length === 0 && (
          <div className="text-center py-12 text-wood-500">
            <MapPin size={36} className="mx-auto mb-3 text-cream-300" />
            <p>No pincodes configured yet. Add your first one.</p>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Tip:</strong> Set delivery charge to <strong>0</strong> for free delivery areas. Pincodes not in this list will be charged a default fee. Customers see the charge instantly in checkout.
      </div>
    </div>
  )
}
