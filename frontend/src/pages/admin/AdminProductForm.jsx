import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X, Image as ImageIcon, Link as LinkIcon, Loader } from 'lucide-react'
import { db, uploadImage, getImageSrc } from '../../utils/api'
import toast from 'react-hot-toast'

const CATEGORIES  = ['Living Room', 'Bedroom', 'Dining', 'Office', 'Storage', 'Outdoor']
const PLACEHOLDER = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80'

const EMPTY_FORM = {
  name:        '',
  description: '',
  price:       '',
  category:    '',
  image_url:   '',   // external URL (optional fallback)
  stock:       '',
}

export default function AdminProductForm() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const isEdit        = Boolean(id)
  const fileInputRef  = useRef(null)

  const [form, setForm]             = useState(EMPTY_FORM)
  const [loading, setLoading]       = useState(false)
  const [fetching, setFetching]     = useState(isEdit)

  // Image state
  const [imageTab, setImageTab]     = useState('upload') // 'upload' | 'url'
  const [previewSrc, setPreviewSrc] = useState(null)     // shown in <img>
  const [uploadedData, setUploadedData] = useState(null) // { image_url, image_base64, image_mime }
  const [uploading, setUploading]   = useState(false)
  const [dragOver, setDragOver]     = useState(false)

  useEffect(() => {
    if (isEdit) fetchProduct()
  }, [id])

  async function fetchProduct() {
    setFetching(true)
    const { data, error } = await db.products.getById(id)
    if (error || !data) {
      toast.error('Product not found')
      navigate('/admin/products')
      return
    }
    setForm({
      name:        data.name        || '',
      description: data.description || '',
      price:       data.price       || '',
      category:    data.category    || '',
      image_url:   data.image_url   || '',
      stock:       data.stock ?? '',
    })
    // Restore preview — prefer base64 embed, then serve URL
    const src = getImageSrc(data)
    if (src) setPreviewSrc(src)
    // If there's already an uploaded image, keep its data for re-save
    if (data.image_base64) {
      setUploadedData({
        image_url:    data.image_url,
        image_base64: data.image_base64,
        image_mime:   data.image_mime,
      })
      setImageTab('upload')
    } else if (data.image_url) {
      setImageTab('url')
    }
    setFetching(false)
  }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  // ── Process a File object (from picker or drag-drop) ────────
  async function processFile(file) {
    if (!file) return

    // Validate on client before sending
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP or GIF images are allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB')
      return
    }

    // Show instant local preview while uploading
    const localUrl = URL.createObjectURL(file)
    setPreviewSrc(localUrl)
    setUploading(true)

    const { data, error } = await uploadImage(file)

    setUploading(false)
    URL.revokeObjectURL(localUrl) // free memory

    if (error) {
      toast.error('Upload failed: ' + error.message)
      setPreviewSrc(null)
      return
    }

    // Store the result — will be sent when admin saves the product
    setUploadedData({
      image_url:    data.image_url,
      image_base64: data.image_base64,
      image_mime:   data.image_mime,
    })
    // Show the compressed image as preview via data URI
    setPreviewSrc(data.data_uri)
    toast.success(`Image uploaded! (${(data.size_bytes / 1024).toFixed(0)} KB after compression)`)
  }

  // ── File input change ────────────────────────────────────────
  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input so same file can be re-selected if cleared
    e.target.value = ''
  }

  // ── Drag & Drop ─────────────────────────────────────────────
  const handleDrop = e => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // ── Clear uploaded image ─────────────────────────────────────
  const clearImage = () => {
    setPreviewSrc(null)
    setUploadedData(null)
    setForm(f => ({ ...f, image_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── URL tab preview ──────────────────────────────────────────
  const handleUrlBlur = () => {
    if (form.image_url) setPreviewSrc(form.image_url)
  }

  // ── Save product ─────────────────────────────────────────────
  const handleSubmit = async e => {
    e.preventDefault()

    if (!form.name || !form.price || form.stock === '') {
      toast.error('Name, Price and Stock are required')
      return
    }
    if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      toast.error('Please enter a valid price')
      return
    }
    if (isNaN(Number(form.stock)) || Number(form.stock) < 0) {
      toast.error('Please enter a valid stock quantity')
      return
    }

    setLoading(true)

    // Build payload — include image fields based on which tab/data we have
    const payload = {
      name:        form.name.trim(),
      description: form.description.trim(),
      price:       Number(form.price),
      category:    form.category,
      stock:       Number(form.stock),
    }

    if (imageTab === 'upload' && uploadedData) {
      // Local uploaded image
      payload.image_url    = uploadedData.image_url
      payload.image_base64 = uploadedData.image_base64
      payload.image_mime   = uploadedData.image_mime
    } else if (imageTab === 'url' && form.image_url.trim()) {
      // External URL — clear any previously stored base64
      payload.image_url    = form.image_url.trim()
      payload.image_base64 = null
      payload.image_mime   = null
    } else {
      // No image
      payload.image_url    = null
      payload.image_base64 = null
      payload.image_mime   = null
    }

    let error
    if (isEdit) {
      ;({ error } = await db.products.update(id, payload))
    } else {
      ;({ error } = await db.products.insert(payload))
    }

    if (error) {
      toast.error('Failed to save product: ' + error.message)
    } else {
      toast.success(isEdit ? 'Product updated!' : 'Product added!')
      navigate('/admin/products')
    }
    setLoading(false)
  }

  // ── Effective preview src ────────────────────────────────────
  const displaySrc = previewSrc
    || (imageTab === 'url' && form.image_url ? form.image_url : null)
    || PLACEHOLDER

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-wood-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/products" className="p-2 rounded-lg hover:bg-cream-200 transition-colors text-bark-600">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-bark-800">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-wood-500 text-sm">
            {isEdit ? 'Update product details' : 'Fill in the details below'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-200 shadow-sm p-6 space-y-6">

        {/* ── IMAGE SECTION ───────────────────────────────────── */}
        <div>
          <label className="block text-sm font-semibold text-bark-800 mb-3">
            Product Image
          </label>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setImageTab('upload'); setPreviewSrc(uploadedData ? displaySrc : null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                imageTab === 'upload'
                  ? 'bg-wood-600 text-white shadow-sm'
                  : 'bg-cream-100 text-bark-600 hover:bg-cream-200'
              }`}
            >
              <Upload size={14} /> Upload File
            </button>
            <button
              type="button"
              onClick={() => { setImageTab('url'); setPreviewSrc(form.image_url || null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                imageTab === 'url'
                  ? 'bg-wood-600 text-white shadow-sm'
                  : 'bg-cream-100 text-bark-600 hover:bg-cream-200'
              }`}
            >
              <LinkIcon size={14} /> Paste URL
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Left: upload zone / url input */}
            <div>
              {imageTab === 'upload' ? (
                <>
                  {/* Drag & drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none ${
                      dragOver
                        ? 'border-wood-500 bg-wood-50 scale-[1.01]'
                        : 'border-cream-300 hover:border-wood-400 hover:bg-cream-50'
                    } ${uploading ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader size={28} className="text-wood-500 animate-spin" />
                        <p className="text-sm text-wood-600 font-medium">Uploading & compressing…</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="w-12 h-12 bg-wood-100 rounded-xl flex items-center justify-center mx-auto">
                          <Upload size={22} className="text-wood-600" />
                        </div>
                        <p className="text-sm font-medium text-bark-700">
                          Drag & drop or <span className="text-wood-600 underline underline-offset-2">browse</span>
                        </p>
                        <p className="text-xs text-wood-400">JPEG · PNG · WebP · GIF · max 10 MB</p>
                      </div>
                    )}

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Uploaded state badge */}
                  {uploadedData && !uploading && (
                    <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700">
                      <ImageIcon size={13} />
                      <span className="flex-1 truncate">Image uploaded and compressed ✓</span>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="text-green-500 hover:text-red-500 transition-colors flex-shrink-0"
                        title="Remove image"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* URL input */
                <div className="space-y-2">
                  <input
                    name="image_url"
                    value={form.image_url}
                    onChange={handleChange}
                    onBlur={handleUrlBlur}
                    className="input-field"
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-wood-400">
                    Paste any direct image URL. Preview updates when you leave the field.
                  </p>
                </div>
              )}
            </div>

            {/* Right: live preview */}
            <div className="flex flex-col gap-2">
              <div className="aspect-square rounded-xl overflow-hidden bg-cream-100 border border-cream-200 relative">
                <img
                  src={displaySrc}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER }}
                />
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <Loader size={24} className="text-wood-500 animate-spin" />
                  </div>
                )}
                {previewSrc && previewSrc !== PLACEHOLDER && !uploading && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow"
                    title="Remove image"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <p className="text-xs text-wood-400 text-center">Live preview</p>
            </div>
          </div>
        </div>

        {/* ── PRODUCT DETAILS ─────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-bark-700 mb-1.5">
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="input-field"
            placeholder="e.g. Royal Teak Sofa Set"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-bark-700 mb-1.5">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="input-field resize-none"
            rows={3}
            placeholder="Describe the product features, material, dimensions…"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1.5">
              Price (₹) <span className="text-red-400">*</span>
            </label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              className="input-field"
              placeholder="12500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-bark-700 mb-1.5">
              Stock <span className="text-red-400">*</span>
            </label>
            <input
              name="stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={handleChange}
              className="input-field"
              placeholder="10"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-bark-700 mb-1.5">Category</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className="input-field"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* ── ACTIONS ─────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2 border-t border-cream-100">
          <button
            type="submit"
            disabled={loading || uploading}
            className="btn-primary flex items-center gap-2 flex-1 justify-center py-3.5 disabled:opacity-60"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <><Save size={16} /> {isEdit ? 'Update Product' : 'Save Product'}</>
            )}
          </button>
          <Link
            to="/admin/products"
            className="btn-secondary flex-1 text-center py-3.5"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
