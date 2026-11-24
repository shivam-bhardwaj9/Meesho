import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  MapPin,
  Banknote,
  Smartphone,
  CreditCard,
  Landmark,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { CartItem, DeliveryAddress, Order, PaymentMethod } from '../types/meesho';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQty: (cartKey: string, delta: number) => void;
  onRemoveItem: (cartKey: string) => void;
  address: DeliveryAddress;
  onSaveAddress: (addr: DeliveryAddress) => void;
  onPlaceOrder: (orderPayload: {
    address: DeliveryAddress;
    paymentMethod: PaymentMethod;
    isReselling: boolean;
    resellerCustomerPrice?: number;
  }) => Promise<Order>;
  onViewOrders: () => void;
}

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirmed';

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQty,
  onRemoveItem,
  address,
  onSaveAddress,
  onPlaceOrder,
  onViewOrders,
}) => {
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [editingAddress, setEditingAddress] = useState(false);
  const [formAddr, setFormAddr] = useState<DeliveryAddress>(address);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isReselling, setIsReselling] = useState(false);
  const [resellerInput, setResellerInput] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  if (!isOpen) return null;

  const totalMrp = cart.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
  const totalPayable = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const totalSavings = Math.max(0, totalMrp - totalPayable);

  const parsedResellerPrice = Number(resellerInput);
  const validResellerPrice =
    isReselling && !Number.isNaN(parsedResellerPrice) && parsedResellerPrice >= totalPayable
      ? parsedResellerPrice
      : totalPayable;
  const resellerMargin = isReselling ? Math.max(0, validResellerPrice - totalPayable) : 0;

  const handleCloseDrawer = () => {
    if (step === 'confirmed') {
      setStep('cart');
      setConfirmedOrder(null);
    }
    onClose();
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formAddr.fullName.trim() ||
      !/^\d{10}$/.test(formAddr.phone.trim()) ||
      !formAddr.houseNo.trim() ||
      !formAddr.streetArea.trim() ||
      !/^\d{6}$/.test(formAddr.pincode.trim()) ||
      !formAddr.city.trim() ||
      !formAddr.state.trim()
    ) {
      setAddrError('Please enter valid name, 10-digit mobile, 6-digit pincode, and full address.');
      return;
    }
    setAddrError(null);
    onSaveAddress(formAddr);
    setEditingAddress(false);
    setStep('payment');
  };

  const handleConfirmOrder = async () => {
    if (placingOrder) return;
    setPlacingOrder(true);
    try {
      const order = await onPlaceOrder({
        address,
        paymentMethod,
        isReselling,
        resellerCustomerPrice: isReselling ? validResellerPrice : undefined,
      });
      setConfirmedOrder(order);
      setStep('confirmed');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleCloseDrawer}
        aria-hidden="true"
      />

      <aside className="relative w-full max-w-[480px] bg-white h-full flex flex-col z-10 shadow-2xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#EAEAEF] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {step !== 'cart' && step !== 'confirmed' && (
              <button
                type="button"
                onClick={() =>
                  setStep(step === 'payment' ? 'address' : 'cart')
                }
                className="p-1 text-[#616173] hover:text-[#353543] cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-base font-bold text-[#353543]">
              {step === 'cart' && `Cart (${cart.reduce((s, i) => s + i.quantity, 0)} Items)`}
              {step === 'address' && 'Delivery Address'}
              {step === 'payment' && 'Payment Method'}
              {step === 'confirmed' && 'Order Confirmed'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCloseDrawer}
            className="p-1.5 rounded-full text-[#616173] hover:bg-[#F8F8FA] cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meesho 3-Step Checkout Progress Bar */}
        {cart.length > 0 && step !== 'confirmed' && (
          <div className="px-5 py-3 bg-[#F8F8FA] border-b border-[#EAEAEF] grid grid-cols-3 text-center text-xs font-semibold">
            <span className={step === 'cart' ? 'text-[#9F2089]' : 'text-[#038D63]'}>
              1. Cart
            </span>
            <span
              className={
                step === 'address'
                  ? 'text-[#9F2089]'
                  : step === 'payment'
                  ? 'text-[#038D63]'
                  : 'text-[#8B8BA3]'
              }
            >
              2. Address
            </span>
            <span className={step === 'payment' ? 'text-[#9F2089]' : 'text-[#8B8BA3]'}>
              3. Payment
            </span>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto meesho-scroll p-5 space-y-4">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#038D63]/10 text-[#038D63] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#038D63]">
                  Order #{confirmedOrder.id} Confirmed
                </p>
                <h3 className="text-xl font-bold text-[#353543] mt-1">
                  Thank you for shopping on Meesho!
                </h3>
                <p className="text-sm text-[#616173] mt-1">
                  Estimated delivery by {confirmedOrder.estimatedDelivery}
                </p>
              </div>

              <div className="text-left bg-[#F8F8FA] border border-[#EAEAEF] rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#616173]">Deliver To</span>
                  <span className="font-semibold text-[#353543] text-right">
                    {confirmedOrder.address.fullName} ({confirmedOrder.address.pincode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#616173]">Payment Mode</span>
                  <span className="font-semibold text-[#353543] uppercase">
                    {confirmedOrder.paymentMethod === 'cod'
                      ? 'Cash on Delivery'
                      : confirmedOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#EAEAEF] tabular-nums">
                  <span className="font-bold text-[#353543]">Order Total</span>
                  <span className="font-bold text-[#353543]">
                    ₹{confirmedOrder.finalPayable}
                  </span>
                </div>
                {confirmedOrder.isReselling && confirmedOrder.resellerMargin ? (
                  <div className="flex justify-between text-[#038D63] font-semibold tabular-nums">
                    <span>Your Reseller Margin</span>
                    <span>+₹{confirmedOrder.resellerMargin}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('cart');
                    setConfirmedOrder(null);
                    onViewOrders();
                  }}
                  className="w-full py-3 bg-[#9F2089] hover:bg-[#831871] text-white font-bold text-sm rounded-md cursor-pointer"
                >
                  Track Order in My Orders
                </button>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="w-full py-2.5 border border-[#EAEAEF] text-[#353543] font-semibold text-sm rounded-md hover:bg-[#F8F8FA] cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-lg font-bold text-[#353543]">Your cart is empty</p>
              <p className="text-sm text-[#616173]">
                Explore lowest prices across ethnic wear, electronics, and home essentials.
              </p>
              <button
                type="button"
                onClick={handleCloseDrawer}
                className="mt-2 px-6 py-2.5 bg-[#9F2089] text-white font-semibold text-sm rounded-md cursor-pointer"
              >
                View Products
              </button>
            </div>
          ) : step === 'cart' ? (
            <>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.cartKey}
                    className="border border-[#EAEAEF] rounded-lg p-3.5 flex gap-3.5 bg-white"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-20 object-cover rounded border border-[#EAEAEF] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-[#353543] line-clamp-2">
                          {item.product.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.cartKey)}
                          className="text-[#8B8BA3] hover:text-red-600 p-1 shrink-0 cursor-pointer"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-1 flex items-baseline gap-2 tabular-nums">
                        <span className="text-sm font-bold text-[#353543]">
                          ₹{item.product.price * item.quantity}
                        </span>
                        <span className="text-xs text-[#8B8BA3] line-through">
                          ₹{item.product.mrp * item.quantity}
                        </span>
                      </div>

                      <p className="text-xs text-[#616173] mt-1">
                        Size: <span className="font-semibold">{item.size}</span> · Sold by{' '}
                        {item.product.supplier.name}
                      </p>

                      {/* Quantity Stepper */}
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="text-xs text-[#616173]">Qty:</span>
                        <div className="inline-flex items-center border border-[#EAEAEF] rounded">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartKey, -1)}
                            className="p-1.5 text-[#353543] hover:bg-[#F8F8FA] cursor-pointer"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-3 text-xs font-bold tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.cartKey, 1)}
                            className="p-1.5 text-[#353543] hover:bg-[#F8F8FA] cursor-pointer"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Details */}
              <div className="border border-[#EAEAEF] rounded-lg p-4 bg-[#F8F8FA] space-y-2.5 text-sm">
                <p className="font-bold text-[#353543]">
                  Price Details ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
                </p>
                <div className="flex justify-between text-[#616173] tabular-nums">
                  <span>Total Product Price</span>
                  <span>₹{totalMrp}</span>
                </div>
                <div className="flex justify-between text-[#038D63] tabular-nums">
                  <span>Total Discounts</span>
                  <span>- ₹{totalSavings}</span>
                </div>
                <div className="flex justify-between text-[#038D63]">
                  <span>Delivery Charges</span>
                  <span>FREE</span>
                </div>
                <div className="pt-2.5 border-t border-[#EAEAEF] flex justify-between font-bold text-[#353543] text-base tabular-nums">
                  <span>Order Total</span>
                  <span>₹{totalPayable}</span>
                </div>
              </div>
            </>
          ) : step === 'address' ? (
            <div className="space-y-4">
              {!editingAddress ? (
                <div className="border border-[#9F2089]/40 bg-[#9F2089]/[0.02] rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-[#353543]">
                      <MapPin className="w-4 h-4 text-[#9F2089]" />
                      <span>{address.fullName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormAddr(address);
                        setEditingAddress(true);
                      }}
                      className="text-xs font-bold text-[#9F2089] hover:underline cursor-pointer"
                    >
                      EDIT
                    </button>
                  </div>
                  <p className="text-sm text-[#616173] leading-relaxed">
                    {address.houseNo}, {address.streetArea}, {address.city},{' '}
                    {address.state} - {address.pincode}
                  </p>
                  <p className="text-xs font-semibold text-[#353543] tabular-nums">
                    Phone: +91 {address.phone}
                  </p>
                </div>
              ) : (
                <form id="address-form" onSubmit={handleAddressSubmit} className="space-y-3">
                  {addrError && (
                    <p className="text-xs font-medium text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                      {addrError}
                    </p>
                  )}
                  <input
                    type="text"
                    value={formAddr.fullName}
                    onChange={(e) => setFormAddr({ ...formAddr, fullName: e.target.value })}
                    placeholder="Full Name"
                    className="w-full border border-[#EAEAEF] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                  <input
                    type="text"
                    maxLength={10}
                    value={formAddr.phone}
                    onChange={(e) =>
                      setFormAddr({ ...formAddr, phone: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="10-digit Mobile Number"
                    className="w-full border border-[#EAEAEF] rounded-md px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:border-[#9F2089]"
                  />
                  <input
                    type="text"
                    value={formAddr.houseNo}
                    onChange={(e) => setFormAddr({ ...formAddr, houseNo: e.target.value })}
                    placeholder="House No. / Building Name"
                    className="w-full border border-[#EAEAEF] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                  <input
                    type="text"
                    value={formAddr.streetArea}
                    onChange={(e) => setFormAddr({ ...formAddr, streetArea: e.target.value })}
                    placeholder="Road Name / Area / Colony"
                    className="w-full border border-[#EAEAEF] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      maxLength={6}
                      value={formAddr.pincode}
                      onChange={(e) =>
                        setFormAddr({ ...formAddr, pincode: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="Pincode"
                      className="border border-[#EAEAEF] rounded-md px-3 py-2.5 text-sm tabular-nums focus:outline-none focus:border-[#9F2089]"
                    />
                    <input
                      type="text"
                      value={formAddr.city}
                      onChange={(e) => setFormAddr({ ...formAddr, city: e.target.value })}
                      placeholder="City"
                      className="border border-[#EAEAEF] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#9F2089]"
                    />
                  </div>
                  <input
                    type="text"
                    value={formAddr.state}
                    onChange={(e) => setFormAddr({ ...formAddr, state: e.target.value })}
                    placeholder="State"
                    className="w-full border border-[#EAEAEF] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-[#9F2089]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#9F2089] text-white font-semibold text-sm rounded-md cursor-pointer"
                    >
                      Save Address &amp; Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAddress(false)}
                      className="px-4 py-2.5 border border-[#EAEAEF] text-sm font-medium rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Step 3: Payment & Reselling Option */
            <div className="space-y-4">
              <div className="border border-[#EAEAEF] rounded-lg divide-y divide-[#EAEAEF]">
                {[
                  {
                    id: 'cod' as PaymentMethod,
                    label: 'Cash on Delivery (COD)',
                    desc: 'Pay in cash or UPI at your doorstep',
                    icon: Banknote,
                  },
                  {
                    id: 'upi' as PaymentMethod,
                    label: 'UPI (PhonePe / Google Pay / Paytm)',
                    desc: 'Instant verification · Zero extra fee',
                    icon: Smartphone,
                  },
                  {
                    id: 'card' as PaymentMethod,
                    label: 'Debit / Credit Card',
                    desc: 'Visa, Mastercard, RuPay supported',
                    icon: CreditCard,
                  },
                  {
                    id: 'netbanking' as PaymentMethod,
                    label: 'Net Banking',
                    desc: 'All major Indian banks supported',
                    icon: Landmark,
                  },
                ].map((method) => {
                  const Icon = method.icon;
                  const active = paymentMethod === method.id;
                  return (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                        active ? 'bg-[#9F2089]/[0.04]' : 'hover:bg-[#F8F8FA]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        checked={active}
                        onChange={() => setPaymentMethod(method.id)}
                        className="w-4 h-4 accent-[#9F2089]"
                      />
                      <Icon className="w-5 h-5 text-[#9F2089] shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#353543]">{method.label}</p>
                        <p className="text-xs text-[#616173]">{method.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Signature Meesho Feature: Reselling the Order? */}
              <div className="border border-[#EAEAEF] rounded-lg p-4 bg-[#F8F8FA] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#353543]">Reselling the Order?</p>
                    <p className="text-xs text-[#616173]">
                      Click &lsquo;Yes&rsquo; to add your profit margin for your customer
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsReselling(false)}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold border cursor-pointer ${
                        !isReselling
                          ? 'bg-[#9F2089] text-white border-[#9F2089]'
                          : 'bg-white text-[#353543] border-[#EAEAEF]'
                      }`}
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsReselling(true);
                        if (!resellerInput) setResellerInput(String(totalPayable + 100));
                      }}
                      className={`px-3 py-1.5 rounded-md text-xs font-bold border cursor-pointer ${
                        isReselling
                          ? 'bg-[#9F2089] text-white border-[#9F2089]'
                          : 'bg-white text-[#353543] border-[#EAEAEF]'
                      }`}
                    >
                      Yes
                    </button>
                  </div>
                </div>

                {isReselling && (
                  <div className="pt-2 border-t border-[#EAEAEF] space-y-2">
                    <label className="block text-xs font-semibold text-[#353543]">
                      Cash to be collected from Customer (Min ₹{totalPayable})
                    </label>
                    <input
                      type="number"
                      min={totalPayable}
                      value={resellerInput}
                      onChange={(e) => setResellerInput(e.target.value)}
                      className="w-full border border-[#EAEAEF] bg-white rounded-md px-3 py-2 text-sm font-semibold tabular-nums focus:outline-none focus:border-[#9F2089]"
                    />
                    <div className="flex justify-between text-xs font-bold text-[#038D63] tabular-nums">
                      <span>Your Margin Earned:</span>
                      <span>₹{resellerMargin}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[#616173]">
                <ShieldCheck className="w-4 h-4 text-[#038D63] shrink-0" />
                <span>100% Safe Payments · Easy 7-Day Returns</span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Drawer Footer */}
        {cart.length > 0 && step !== 'confirmed' && (
          <div className="p-4 border-t border-[#EAEAEF] bg-white">
            {step === 'cart' && (
              <div className="space-y-2">
                <p className="text-[11px] text-center text-[#616173]">
                  Clicking on &lsquo;Continue&rsquo; will not deduct any money
                </p>
                <div className="flex items-center justify-between gap-4">
                  <div className="tabular-nums">
                    <p className="text-base font-bold text-[#353543]">₹{totalPayable}</p>
                    <p className="text-xs font-semibold text-[#038D63]">
                      You save ₹{totalSavings}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep('address')}
                    className="flex-1 py-3 bg-[#9F2089] hover:bg-[#831871] text-white font-bold text-sm rounded-md transition-colors cursor-pointer"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 'address' && !editingAddress && (
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="w-full py-3 bg-[#9F2089] hover:bg-[#831871] text-white font-bold text-sm rounded-md transition-colors cursor-pointer"
              >
                Deliver to this Address
              </button>
            )}

            {step === 'payment' && (
              <div className="flex items-center justify-between gap-4">
                <div className="tabular-nums">
                  <p className="text-base font-bold text-[#353543]">₹{totalPayable}</p>
                  <p className="text-xs text-[#616173]">
                    {paymentMethod === 'cod' ? 'Pay on Delivery' : 'Pay Online'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3 bg-[#9F2089] hover:bg-[#831871] text-white font-bold text-sm rounded-md transition-colors cursor-pointer"
                >
                  Place Order
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
};
