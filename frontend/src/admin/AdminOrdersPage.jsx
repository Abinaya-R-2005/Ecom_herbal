import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Package, Clock, Eye, X, MapPin, CreditCard, ShoppingBag, Truck, CheckCircle, AlertCircle, CalendarDays } from "lucide-react";
import { useToast } from "../context/ToastContext";
import API_BASE_URL from '../apiConfig';
import "./AdminOrdersPage.css";

const STATUS_OPTIONS = [
  "Ordered",
  "Accepted",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Rejected"
];

const AdminOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { showToast } = useToast();

  // ✅ AUTH CHECK
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (!token || !user || !user.isAdmin) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const [statusFilter, setStatusFilter] = useState("");

  // ✅ FETCH ORDERS
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      let url = `${API_BASE_URL} /admin/orders`;
      const params = new URLSearchParams();
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      if (statusFilter) params.append("status", statusFilter);

      if (params.toString()) url += `? ${params.toString()} `;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token} `,
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch orders: ${res.status} ${res.statusText} `);
      }

      const data = await res.json();

      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        console.error("Invalid data format:", data);
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load orders", err);
      showToast(`Error loading orders: ${err.message} `, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ UPDATE STATUS
  const updateStatus = async (id, status) => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL} /admin/orders / ${id} `, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token} `,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchOrders();
        showToast("Order status updated successfully", "success");
      } else {
        showToast("Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating order", "error");
    }
  };

  return (
    <div className="admin-orders-page">
      <div className="ao-container">
        <div className="ao-header">
          <div className="ao-header-left">
            <button className="back-btn" onClick={() => navigate("/admin")}>
              <ArrowLeft size={20} /> Back
            </button>
            <img src="/mom_logo.jpg" alt="Company Logo" className="admin-orders-logo" />
            <h2><ShoppingBag size={24} /> Placed Orders</h2>
          </div>
        </div>

        {/* 🔄 LOADING */}
        {loading && (
          <div className="loading-state">
            <Clock size={40} className="spin" />
            <p>Loading orders...</p>
          </div>
        )}

        {/* 📭 EMPTY */}
        {!loading && orders.length === 0 && (
          <div className="empty-state">
            <Package size={48} />
            <p>No orders found</p>
          </div>
        )}

        {/* 📦 TABLE */}
        {!loading && orders.length > 0 && (
          <>
            <div className="filter-bar">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <button className="filter-btn" onClick={fetchOrders}>
                Filter
              </button>
            </div>

            <div className="table-wrapper">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>#{o._id?.slice(-6) || 'N/A'}</td>
                      <td>
                        <b>{o.userName || 'Unknown'}</b>
                        <br />
                        <small>{o.userEmail || 'No Email'}</small>
                      </td>
                      <td>{o.productName || 'Unknown Product'}</td>
                      <td>{o.quantity || 0}</td>
                      <td>₹{o.price || 0}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <CalendarDays size={14} style={{ color: '#666' }} />
                          {o.createdAt ? new Date(o.createdAt).toLocaleString() : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <select
                          value={o.status || "Ordered"}
                          className={`status - select ${(o.status || "ordered").toLowerCase()} `}
                          onChange={(e) => updateStatus(o._id, e.target.value)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(o.status === "Ordered" || o.status === "Pending") && (
                            <>
                              <button
                                onClick={() => updateStatus(o._id, "Accepted")}
                                title="Accept Order"
                                style={{ background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer' }}
                              >
                                <CheckCircle size={16} />
                              </button>
                              <button
                                onClick={() => updateStatus(o._id, "Rejected")}
                                title="Reject Order"
                                style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer' }}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}

                          {o.status === "Cancellation Requested" && (
                            <button
                              onClick={() => updateStatus(o._id, "Cancelled")}
                              title="Confirm Cancellation"
                              style={{ background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                            >
                              <X size={14} /> Confirm Cancel
                            </button>
                          )}

                          <button className="details-btn" onClick={() => setSelectedOrder(o)} title="View Order Details">
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div >

      {/* 🔍 ORDER DETAILS MODAL */}
      {
        selectedOrder && (
          <div className="order-modal-overlay">
            <div className="order-modal">
              <div className="modal-header">
                <h3>Order Details</h3>
                <button onClick={() => setSelectedOrder(null)}><X size={20} /></button>
              </div>

              <div className="modal-content">
                <div className="modal-section">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedOrder.status === 'Delivered' && <CheckCircle size={16} style={{ color: '#4CAF50' }} />}
                    {selectedOrder.status === 'Shipped' && <Truck size={16} style={{ color: '#2196F3' }} />}
                    {selectedOrder.status === 'Ordered' && <ShoppingBag size={16} style={{ color: '#FF9800' }} />}
                    {selectedOrder.status === 'Cancelled' && <AlertCircle size={16} style={{ color: '#f44336' }} />}
                    {selectedOrder.status === 'Accepted' && <CheckCircle size={16} style={{ color: '#4CAF50' }} />}
                    {selectedOrder.status === 'Rejected' && <X size={16} style={{ color: '#f44336' }} />}
                    Order Status
                  </h4>
                  <div className="address-box" style={{ padding: '12px', background: '#f5f5f5', borderRadius: '8px' }}>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>
                      Status: <span style={{ color: selectedOrder.status === 'Delivered' ? '#4CAF50' : selectedOrder.status === 'Shipped' ? '#2196F3' : selectedOrder.status === 'Cancelled' ? '#f44336' : '#FF9800' }}>
                        {selectedOrder.status || 'Ordered'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="modal-section">
                  <h4><MapPin size={16} /> Shipping Address</h4>
                  <div className="address-box">
                    <p><strong>Name:</strong> {selectedOrder.shippingAddress?.firstName} {selectedOrder.shippingAddress?.lastName}</p>
                    <p><strong>Email:</strong> {selectedOrder.shippingAddress?.email}</p>
                    <p><strong>Phone:</strong> {selectedOrder.phone || selectedOrder.shippingAddress?.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedOrder.shippingAddress?.address}</p>
                    <p><strong>Method:</strong> {selectedOrder.shippingMethod?.toUpperCase()}</p>
                  </div>
                </div>

                <div className="modal-section">
                  <h4><CreditCard size={16} /> Payment & Billing</h4>
                  <div className="payment-box">
                    <p><strong>Method:</strong> {selectedOrder.paymentMethod?.toUpperCase()}</p>
                    <div className="price-breakdown">
                      <div className="price-row"><span>Unit Price:</span> <span>₹{(selectedOrder.price / selectedOrder.quantity).toFixed(2)}</span></div>
                      <div className="price-row"><span>Quantity:</span> <span>x{selectedOrder.quantity}</span></div>
                      <div className="price-row"><span>Product Total:</span> <span>₹{selectedOrder.price?.toFixed(2) || '0.00'}</span></div>
                      <div className="price-row"><span>Shipping:</span> <span>₹{(selectedOrder.shippingCost || 0).toFixed(2)}</span></div>
                      <div className="price-row"><span>Tax:</span> <span>₹{(selectedOrder.tax || 0).toFixed(2)}</span></div>
                      <hr />
                      <div className="price-row total"><span>Order Total:</span> <span>₹{(selectedOrder.totalAmount || selectedOrder.price || 0).toFixed(2)}</span></div>
                    </div>
                  </div>
                </div>

                <div className="modal-section">
                  <h4><ShoppingBag size={16} /> Product Info</h4>
                  <div className="product-box">
                    <p><strong>Item:</strong> {selectedOrder.productName}</p>
                    <p><strong>ID:</strong> {selectedOrder.productId}</p>
                    <p><strong>Order ID:</strong> {selectedOrder._id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AdminOrdersPage;
