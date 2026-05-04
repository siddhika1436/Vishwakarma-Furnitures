// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider }  from './contexts/AuthContext'
import { CartProvider }  from './contexts/CartContext'
import { useAuth }       from './contexts/AuthContext'

import Navbar            from './components/Navbar'
import Footer            from './components/Footer'
import HomePage          from './pages/HomePage'
import ProductsPage      from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage          from './pages/CartPage'
import CheckoutPage      from './pages/CheckoutPage'
import OrdersPage        from './pages/OrdersPage'
import LoginPage         from './pages/LoginPage'
import SignupPage        from './pages/SignupPage'
import VerifyEmailPage   from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ShopPoliciesPage  from './pages/ShopPoliciesPage'

import AdminLayout       from './pages/admin/AdminLayout'
import AdminDashboard    from './pages/admin/AdminDashboard'
import AdminProducts     from './pages/admin/AdminProducts'
import AdminProductForm  from './pages/admin/AdminProductForm'
import AdminOrders       from './pages/admin/AdminOrders'
import AdminPincodes     from './pages/admin/AdminPincodes'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-wood-500 border-t-transparent" />
  </div>
)

function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user)    return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/"     replace />
  return children
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"                element={<HomePage />} />
          <Route path="/products"        element={<ProductsPage />} />
          <Route path="/products/:id"    element={<ProductDetailPage />} />
          <Route path="/cart"            element={<CartPage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/signup"          element={<SignupPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/shop-policies"   element={<ShopPoliciesPage />} />
          <Route path="/checkout"        element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="/orders"          element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
          <Route path="/admin"           element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index                 element={<AdminDashboard />} />
            <Route path="products"       element={<AdminProducts />} />
            <Route path="products/new"   element={<AdminProductForm />} />
            <Route path="products/edit/:id" element={<AdminProductForm />} />
            <Route path="orders"         element={<AdminOrders />} />
            <Route path="pincodes"       element={<AdminPincodes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{
            style: { background: '#3a2a1e', color: '#fdf8f0', borderRadius: '10px', fontFamily: 'DM Sans, sans-serif' },
            success: { iconTheme: { primary: '#c8852a', secondary: '#fdf8f0' } },
          }} />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
