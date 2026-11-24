import React, { useEffect, useState } from 'react';
import {
  X,
  ShieldCheck,
  Package,
  ShoppingBag,
  Users,
  Plus,
  Trash2,
  Search,
  IndianRupee,
  Check,
  KeyRound,
} from 'lucide-react';
import { CATEGORY_NAV_GROUPS, PRODUCT_IMAGES } from '../data/catalog';
import {
  AdminDashboardData,
  AuthUser,
  CategoryId,
  Order,
  OrderStatus,
  Product,
} from '../types/meesho';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  authToken: string | null;
  authUser: AuthUser | null;
  products: Product[];
  orders: Order[];
  onRefreshCatalog: () => void;
  onRefreshOrders: () => void;
  onNotify: (msg: string) => void;
}

type AdminTab = 'overview' | 'products' | 'orders' | 'users';

const IMAGE_CHOICES: { label: string; url: string }[] = [
  { label: 'Silk Saree', url: PRODUCT_IMAGES.saree },
  { label: 'Georgette Saree', url: PRODUCT_IMAGES.georgetteSaree },
  { label: 'Anarkali Kurti', url: PRODUCT_IMAGES.kurti },
  { label: 'Western Dress', url: PRODUCT_IMAGES.western },
  { label: 'Men Shirt', url: PRODUCT_IMAGES.mensShirt },
  { label: 'Men Polo T-Shirt', url: PRODUCT_IMAGES.mensPolo },
  { label: 'Men Hoodie', url: PRODUCT_IMAGES.mensHoodie },
  { label: 'Kids Kurta Set', url: PRODUCT_IMAGES.kidsEthnic },
  { label: 'Gold Kundan Set', url: PRODUCT_IMAGES.jewellery },
  { label: 'Silver Jhumkas', url: PRODUCT_IMAGES.silverJewellery },
  { label: 'Cookware Set', url: PRODUCT_IMAGES.kitchen },
  { label: 'Cotton Bedsheet', url: PRODUCT_IMAGES.bedsheet },
  { label: 'Skincare Combo', url: PRODUCT_IMAGES.skincare },
  { label: 'Sneakers', url: PRODUCT_IMAGES.sneakers },
  { label: 'Tote Handbag', url: PRODUCT_IMAGES.handbag },
  { label: 'TWS Earbuds', url: PRODUCT_IMAGES.earbuds },
  { label: 'AMOLED Smartwatch', url: PRODUCT_IMAGES.smartwatch },
];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  authToken,
  authUser,
  products,
  orders,
  onRefreshCatalog,
  onRefreshOrders,
  onNotify,
}) => {
  const [tab, setTab] = useState<AdminTab>('overview');
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Add Product form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('Women Ethnic');
  const [subCategory, setSubCategory] = useState('Silk Sarees');
  const [price, setPrice] = useState('399');
  const [mrp, setMrp] = useState('999');
  const [stock, setStock] = useState('75');
  const [fabric, setFabric] = useState('Art Silk');
  const [supplierName, setSupplierName] = useState('Surat Textile House');
  const [selectedImage, setSelectedImage] = useState(PRODUCT_IMAGES.saree);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editStock, setEditStock] = useState('');

  // Change admin password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as AdminDashboardData;
        setDashboard(data);
      }
    } catch {
      // ignore transient error
    }
  };

  useEffect(() => {
    if (isOpen && authToken && authUser?.role === 'admin') {
      fetchDashboard();
      onRefreshOrders();
    }
  }, [isOpen, authToken, authUser]);

  if (!isOpen || !authUser || authUser.role !== 'admin') return null;

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        title,
        category,
        subCategory,
        price: Number(price),
        mrp: Number(mrp),
        stock: Number(stock),
        fabricOrMaterial: fabric,
        supplierName,
        image: selectedImage,
      }),
    });

    if (res.ok) {
      setTitle('');
      setShowAddForm(false);
      onRefreshCatalog();
      fetchDashboard();
      onNotify('New product added to Meesho catalog');
    }
  };

  const handleSaveEdit = async (productId: string) => {
    if (!authToken) return;
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        price: Number(editPrice),
        mrp: Number(editMrp),
        stock: Number(editStock),
      }),
    });
    if (res.ok) {
      setEditingId(null);
      onRefreshCatalog();
      fetchDashboard();
      onNotify('Product pricing & stock updated');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!authToken) return;
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (res.ok) {
      onRefreshCatalog();
      fetchDashboard();
      onNotify('Product deleted from catalog');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!authToken) return;
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      onRefreshOrders();
      fetchDashboard();
      onNotify(`Order #${orderId} updated to ${status}`);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authToken) return;
    setPasswordStatus(null);
    const res = await fetch('/api/admin/password', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setPasswordStatus(data.error || 'Could not update admin password.');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setPasswordStatus('Admin password updated and saved!');
    onNotify('Admin password updated');
  };

  const metrics = dashboard?.metrics || {
    totalRevenue: orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((s, o) => s + o.finalPayable, 0),
    totalOrders: orders.length,
    activeOrders: orders.filter((o) => o.status !== 'Cancelled').length,
    totalProducts: products.length,
    lowStockCount: products.filter((p) => p.stock < 40).length,
    totalUsers: 1,
    resellerMarginTotal: 0,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="bg-white w-full max-w-[1160px] h-full sm:h-[90vh] sm:rounded-xl overflow-hidden flex flex-col shadow-2xl border border-[#EAEAEF]">
        {/* Admin Header */}
        <div className="px-6 py-4 border-b border-[#EAEAEF] bg-[#F8F8FA] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#9F2089] text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#353543]">Meesho Admin Panel</h2>
              <p className="text-xs text-[#616173]">
                Signed in as {authUser.email || `+91 ${authUser.phone}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-white border border-[#EAEAEF] rounded-lg">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'products', label: `Products (${products.length})` },
                  { id: 'orders', label: `Orders (${orders.length})` },
                  { id: 'users', label: `Users (${dashboard?.users.length || 1})` },
                ] as { id: AdminTab; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    tab === t.id
                      ? 'bg-[#9F2089] text-white'
                      : 'text-[#616173] hover:text-[#353543]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full border border-[#EAEAEF] bg-white text-[#353543] hover:bg-[#F8F8FA] cursor-pointer"
              aria-label="Close Admin Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Body */}
        <div className="flex-1 overflow-y-auto meesho-scroll p-6 space-y-6">
          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-[#EAEAEF] rounded-lg p-4 bg-white">
                  <p className="text-xs font-semibold text-[#616173]">Total Sales Revenue</p>
                  <p className="text-2xl font-extrabold text-[#353543] mt-1 tabular-nums flex items-center">
                    <IndianRupee className="w-5 h-5 mr-0.5 text-[#9F2089]" />
                    {metrics.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-[#038D63] mt-1 tabular-nums">
                    {metrics.activeOrders} active orders
                  </p>
                </div>

                <div className="border border-[#EAEAEF] rounded-lg p-4 bg-white">
                  <p className="text-xs font-semibold text-[#616173]">Catalog Products</p>
                  <p className="text-2xl font-extrabold text-[#353543] mt-1 tabular-nums">
                    {metrics.totalProducts}
                  </p>
                  <p className="text-xs text-[#616173] mt-1 tabular-nums">
                    {metrics.lowStockCount} low stock (&lt;40 units)
                  </p>
                </div>

                <div className="border border-[#EAEAEF] rounded-lg p-4 bg-white">
                  <p className="text-xs font-semibold text-[#616173]">Logged-In Users</p>
                  <p className="text-2xl font-extrabold text-[#353543] mt-1 tabular-nums">
                    {metrics.totalUsers}
                  </p>
                  <p className="text-xs text-[#616173] mt-1">
                    Verified OTP &amp; Admin Sessions
                  </p>
                </div>

                <div className="border border-[#EAEAEF] rounded-lg p-4 bg-white">
                  <p className="text-xs font-semibold text-[#616173]">Reseller Margin Volume</p>
                  <p className="text-2xl font-extrabold text-[#038D63] mt-1 tabular-nums">
                    ₹{metrics.resellerMarginTotal.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-[#616173] mt-1">Earned by resellers</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-[#EAEAEF] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#353543]">Quick Actions</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setTab('products');
                        setShowAddForm(true);
                      }}
                      className="p-4 border border-[#EAEAEF] rounded-lg text-left hover:border-[#9F2089] transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-5 h-5 text-[#9F2089] mb-2" />
                      <p className="text-sm font-bold text-[#353543]">Add Product</p>
                      <p className="text-xs text-[#616173] mt-0.5">
                        Launch new item in catalog
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('orders')}
                      className="p-4 border border-[#EAEAEF] rounded-lg text-left hover:border-[#9F2089] transition-colors cursor-pointer"
                    >
                      <Package className="w-5 h-5 text-[#9F2089] mb-2" />
                      <p className="text-sm font-bold text-[#353543]">Manage Orders</p>
                      <p className="text-xs text-[#616173] mt-0.5">
                        Update dispatch &amp; status
                      </p>
                    </button>
                  </div>
                </div>

                <div className="border border-[#EAEAEF] rounded-lg p-5">
                  <h3 className="text-sm font-bold text-[#353543] mb-3">
                    Admin Authorization Rules
                  </h3>
                  <ul className="space-y-2 text-xs text-[#616173]">
                    <li>
                      Authorized Email:{' '}
                      <span className="font-mono font-semibold text-[#353543]">
                        shivambhardwaj9910@gmail.com
                      </span>
                    </li>
                    <li>
                      Authorized Mobile:{' '}
                      <span className="font-mono font-semibold text-[#353543]">
                        +91 9315819414
                      </span>
                    </li>
                    <li>
                      All product edits, deletions, and order status transitions are verified
                      server-side via signed Bearer token.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS MANAGEMENT TAB */}
          {tab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-[#8B8BA3] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Filter catalog by title, code, or category..."
                    className="w-full border border-[#EAEAEF] rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddForm ? 'Close Form' : 'Add Product'}</span>
                </button>
              </div>

              {showAddForm && (
                <form
                  onSubmit={handleAddProduct}
                  className="border border-[#9F2089]/30 bg-[#F8F8FA] rounded-lg p-5 space-y-4"
                >
                  <p className="text-sm font-bold text-[#353543]">
                    Add New Meesho Catalog Product
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Product Title"
                      className="sm:col-span-2 border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm"
                    />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CategoryId)}
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm"
                    >
                      {CATEGORY_NAV_GROUPS.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={subCategory}
                      onChange={(e) => setSubCategory(e.target.value)}
                      placeholder="Subcategory"
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      required
                      min={49}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Price (₹)"
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm tabular-nums"
                    />
                    <input
                      type="number"
                      required
                      min={99}
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      placeholder="MRP (₹)"
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm tabular-nums"
                    />
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="Stock Qty"
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm tabular-nums"
                    />
                    <input
                      type="text"
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="Fabric / Material"
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                      placeholder="Supplier Name"
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm"
                    />
                    <select
                      value={selectedImage}
                      onChange={(e) => setSelectedImage(e.target.value)}
                      className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm"
                    >
                      {IMAGE_CHOICES.map((img) => (
                        <option key={img.url} value={img.url}>
                          Image: {img.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md cursor-pointer"
                  >
                    Save &amp; Publish Product
                  </button>
                </form>
              )}

              <div className="border border-[#EAEAEF] rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#F8F8FA] border-b border-[#EAEAEF] text-xs text-[#616173]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Product</th>
                      <th className="py-3 px-3 font-semibold">Category</th>
                      <th className="py-3 px-3 font-semibold">Price / MRP</th>
                      <th className="py-3 px-3 font-semibold">Stock</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEF]">
                    {filteredProducts.map((p) => {
                      const isEditing = editingId === p.id;
                      return (
                        <tr key={p.id} className="hover:bg-[#F8F8FA]/60">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={p.image}
                                alt={p.title}
                                referrerPolicy="no-referrer"
                                className="w-10 h-12 object-cover rounded border border-[#EAEAEF] shrink-0"
                              />
                              <div className="min-w-0 max-w-[300px]">
                                <p className="font-medium text-[#353543] truncate">
                                  {p.title}
                                </p>
                                <p className="text-xs text-[#8B8BA3] font-mono">{p.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs text-[#616173] whitespace-nowrap">
                            {p.category}
                          </td>
                          <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={editPrice}
                                  onChange={(e) => setEditPrice(e.target.value)}
                                  className="w-16 border border-[#9F2089] rounded px-1.5 py-1 text-xs"
                                />
                                <input
                                  type="number"
                                  value={editMrp}
                                  onChange={(e) => setEditMrp(e.target.value)}
                                  className="w-16 border border-[#EAEAEF] rounded px-1.5 py-1 text-xs"
                                />
                              </div>
                            ) : (
                              <div>
                                <span className="font-bold text-[#353543]">₹{p.price}</span>{' '}
                                <span className="text-xs text-[#8B8BA3] line-through">
                                  ₹{p.mrp}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editStock}
                                onChange={(e) => setEditStock(e.target.value)}
                                className="w-16 border border-[#9F2089] rounded px-1.5 py-1 text-xs"
                              />
                            ) : (
                              <span
                                className={`text-xs font-semibold ${
                                  p.stock < 40 ? 'text-amber-700' : 'text-[#038D63]'
                                }`}
                              >
                                {p.stock} units
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(p.id)}
                                  className="px-2.5 py-1 bg-[#038D63] text-white text-xs font-semibold rounded inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="text-xs text-[#616173] hover:underline cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(p.id);
                                    setEditPrice(String(p.price));
                                    setEditMrp(String(p.mrp));
                                    setEditStock(String(p.stock));
                                  }}
                                  className="text-xs font-semibold text-[#9F2089] hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="text-[#8B8BA3] hover:text-red-600 cursor-pointer"
                                  aria-label="Delete product"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ORDERS MANAGEMENT TAB */}
          {tab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="border border-[#EAEAEF] rounded-lg p-12 text-center bg-[#F8F8FA]">
                  <Package className="w-9 h-9 text-[#8B8BA3] mx-auto mb-2" />
                  <p className="text-sm font-bold text-[#353543]">No orders placed yet</p>
                  <p className="text-xs text-[#616173] mt-1">
                    Orders placed by shoppers on the storefront will appear here for
                    fulfillment.
                  </p>
                </div>
              ) : (
                <div className="border border-[#EAEAEF] rounded-lg overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[#F8F8FA] border-b border-[#EAEAEF] text-xs text-[#616173]">
                      <tr>
                        <th className="py-3 px-4 font-semibold">Order ID</th>
                        <th className="py-3 px-3 font-semibold">Customer</th>
                        <th className="py-3 px-3 font-semibold">Items</th>
                        <th className="py-3 px-3 font-semibold">Total / Mode</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEF]">
                      {orders.map((o) => (
                        <tr key={o.id}>
                          <td className="py-3 px-4 font-mono text-xs font-bold text-[#353543]">
                            #{o.id}
                            <div className="font-sans font-normal text-[#8B8BA3]">
                              {o.placedAt}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs">
                            <p className="font-semibold text-[#353543]">
                              {o.address.fullName}
                            </p>
                            <p className="text-[#616173] tabular-nums">
                              +91 {o.address.phone} · {o.address.city}
                            </p>
                          </td>
                          <td className="py-3 px-3 text-xs text-[#616173] tabular-nums">
                            {o.items.reduce((s, i) => s + i.quantity, 0)} item(s)
                          </td>
                          <td className="py-3 px-3 text-xs tabular-nums">
                            <p className="font-bold text-[#353543]">₹{o.finalPayable}</p>
                            <p className="text-[#616173] uppercase">{o.paymentMethod}</p>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={o.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  o.id,
                                  e.target.value as OrderStatus
                                )
                              }
                              className="border border-[#EAEAEF] rounded px-2.5 py-1.5 text-xs font-semibold bg-white focus:outline-none focus:border-[#9F2089]"
                            >
                              <option value="Confirmed">Confirmed</option>
                              <option value="Packed">Packed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* USERS TAB */}
          {tab === 'users' && (
            <div className="space-y-6">
              <div className="border border-[#EAEAEF] rounded-lg overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#F8F8FA] border-b border-[#EAEAEF] text-xs text-[#616173]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">User</th>
                      <th className="py-3 px-3 font-semibold">Identifier</th>
                      <th className="py-3 px-3 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAEF]">
                    {(dashboard?.users || [authUser]).map((u) => (
                      <tr key={u.id}>
                        <td className="py-3 px-4 font-medium text-[#353543] flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#9F2089]" />
                          <span>{u.name}</span>
                        </td>
                        <td className="py-3 px-3 text-xs text-[#616173] tabular-nums">
                          {u.authType === 'phone' ? `+91 ${u.identifier}` : u.identifier}
                        </td>
                        <td className="py-3 px-3 text-xs font-bold">
                          <span
                            className={
                              u.role === 'admin' ? 'text-[#9F2089]' : 'text-[#038D63]'
                            }
                          >
                            {u.role === 'admin' ? 'Admin' : 'Customer'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-[#8B8BA3]">{u.loggedInAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Admin Panel Password Settings */}
              <form
                onSubmit={handleChangeAdminPassword}
                className="border border-[#EAEAEF] rounded-lg p-5 bg-[#F8F8FA] space-y-4 max-w-[540px]"
              >
                <div className="flex items-center gap-2 text-sm font-bold text-[#353543]">
                  <KeyRound className="w-4 h-4 text-[#9F2089]" />
                  <span>Change Admin Panel Password</span>
                </div>
                <p className="text-xs text-[#616173]">
                  Used whenever signing in with admin mobile number{' '}
                  <strong className="text-[#353543]">+91 9315819414</strong> or{' '}
                  <strong className="text-[#353543]">shivambhardwaj9910@gmail.com</strong>.
                </p>
                {passwordStatus && (
                  <p
                    className={`text-xs font-semibold ${
                      passwordStatus.includes('updated')
                        ? 'text-[#038D63]'
                        : 'text-red-600'
                    }`}
                  >
                    {passwordStatus}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    className="border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#9F2089] hover:bg-[#831871] text-white text-xs font-bold rounded-md cursor-pointer"
                >
                  Update Admin Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
