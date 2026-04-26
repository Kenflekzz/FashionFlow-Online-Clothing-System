/* ============================================================
   SUPER ADMIN — NEW MODULE HANDLERS
   Split across 4 files or merge into one. Each section
   mirrors the admin_dashboard.js pattern but prefixed
   with "super" to avoid ID conflicts.
   ============================================================ */


/* ── showSection helpers ─────────────────────────────────── */
function hideAllSuperSections() {
    const ids = [
        'dashboardContent', 'manageAdminsSection', 'usersSection',
        'securityLogsSection', 'registrationApprovalsSection',
        'deletedAccountsSection',
        'superProductsSection', 'superOrdersSection',
        'superCategoriesSection', 'superReportsSection'
    ];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
}

function showSuperProducts() {
    hideAllSuperSections();
    document.getElementById('superProductsSection').style.display = 'block';
    highlightNav('showSuperProducts');
    loadSuperProducts();
}

function showSuperOrders() {
    hideAllSuperSections();
    document.getElementById('superOrdersSection').style.display = 'block';
    highlightNav('showSuperOrders');
    loadSuperOrders();
}

function showSuperCategories() {
    hideAllSuperSections();
    document.getElementById('superCategoriesSection').style.display = 'block';
    highlightNav('showSuperCategories');
    loadSuperCategories();
}

function showSuperReports() {
    hideAllSuperSections();
    document.getElementById('superReportsSection').style.display = 'block';
    highlightNav('showSuperReports');
    initSuperReports();
}

function highlightNav(fnName) {
    document.querySelectorAll('.nav-item').forEach(el => {
        if ((el.getAttribute('onclick') || '').includes(fnName)) {
            el.classList.add('active');
        }
    });
}


/* ============================================================
   PRODUCTS
   PHP endpoints: get_products.php / save_product.php /
                  delete_product.php / export_products.php
   ============================================================ */

let superProductsData = [];
let superProductPage  = 1;
let superProductPages = 1;

function loadSuperProducts(page = 1) {
    const search   = document.getElementById('superProductSearch')?.value || '';
    const tbody    = document.getElementById('superProductsTableBody');

    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:10px;"></i>Loading products...</td></tr>`;

    fetch(`../php/get_products.php?page=${page}&search=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(data => {
            if (data.status === 200) {
                superProductsData = data.products || [];
                superProductPage  = data.page;
                superProductPages = data.pages;
                renderSuperProducts();
                renderSuperProductStats(data.stats || {});
                renderSuperLowStock(data.low_stock_alerts || []);
            } else {
                showToast('Error loading products: ' + (data.message || ''));
            }
        })
        .catch(() => showToast('Failed to load products'));
}

function renderSuperProducts() {
    const tbody = document.getElementById('superProductsTableBody');
    if (!tbody) return;

    if (!superProductsData.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">No products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = superProductsData.map(p => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:44px;height:44px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0;">
                        ${p.primary_image ? `<img src="../${p.primary_image}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-tshirt" style="color:#9ca3af;"></i>'}
                    </div>
                    <div><div style="font-weight:600;">${escapeHtml(p.name)}</div><small style="color:#6b7280;">${escapeHtml(p.brand || '—')}</small></div>
                </div>
            </td>
            <td>${escapeHtml(p.sku)}</td>
            <td><span class="role-badge" style="background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe;">${escapeHtml(p.category_name || 'Uncategorized')}</span></td>
            <td style="font-weight:600;">$${parseFloat(p.price).toFixed(2)}</td>
            <td>${p.stock}</td>
            <td><span class="status-badge status-${p.status}">${p.status}</span></td>
            <td>${formatDate(p.updated_at)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" title="Edit" onclick="editSuperProduct(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Delete" onclick="deleteSuperProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`).join('');

    renderSuperPagination('superProductPagination', superProductPage, superProductPages, 'loadSuperProducts');
}

function renderSuperProductStats(stats) {
    const container = document.getElementById('superProductStats');
    if (!container) return;
    container.innerHTML = `
        <div class="stat-card"><h3>${stats.total || 0}</h3><p style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Total Products</p></div>
        <div class="stat-card"><h3>${stats.active || 0}</h3><p style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Active</p></div>
        <div class="stat-card"><h3 style="color:#f59e0b;">${stats.low_stock || 0}</h3><p style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Low Stock</p></div>
        <div class="stat-card"><h3 style="color:#ef4444;">${stats.out_of_stock || 0}</h3><p style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:.5px;">Out of Stock</p></div>
    `;
}

function renderSuperLowStock(alerts) {
    const card = document.getElementById('superLowStockAlert');
    const body = document.getElementById('superLowStockBody');
    if (!card || !body) return;
    if (!alerts.length) { card.style.display = 'none'; return; }
    card.style.display = 'block';
    body.innerHTML = alerts.map(a => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #fde68a;">
            <div><strong>${escapeHtml(a.name)}</strong> (SKU: ${a.sku})</div>
            <span style="background:#ef4444;color:white;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">Only ${a.stock} left</span>
        </div>`).join('');
}

function filterSuperProducts() { loadSuperProducts(1); }
function openSuperProductModal() { showToast('Product modal — wire to your existing openProductModal() logic'); }
function editSuperProduct(id) { showToast('Edit product ' + id); }
function deleteSuperProduct(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    fetch(`../php/delete_product.php?id=${id}`, { method: 'POST' })
        .then(r => r.json())
        .then(d => { if (d.status === 200) { showToast('Product deleted'); loadSuperProducts(superProductPage); } else showToast(d.message); });
}
function exportSuperProducts() { window.open('../php/export_products.php', '_blank'); }


/* ============================================================
   ORDERS
   PHP endpoints: get_orders.php / update_order_status.php /
                  export_orders.php / print_labels.php
   ============================================================ */

let superOrdersData    = [];
let superOrderPage     = 1;
let superOrderPages    = 1;
let superSelectedOrders = new Set();

function loadSuperOrders(page = 1) {
    const search = document.getElementById('superOrderSearch')?.value || '';
    const status = document.getElementById('superOrderStatusFilter')?.value || 'all';
    const tbody  = document.getElementById('superOrdersTableBody');

    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:10px;"></i>Loading orders...</td></tr>`;

    fetch(`../php/get_orders.php?page=${page}&search=${encodeURIComponent(search)}&status=${status}`)
        .then(r => r.json())
        .then(data => {
            if (data.status === 200) {
                superOrdersData = data.orders || [];
                superOrderPage  = data.page;
                superOrderPages = data.pages;
                renderSuperOrders();
                renderSuperOrderPipeline(data.pipeline || {});
            } else {
                showToast('Error loading orders: ' + (data.message || ''));
            }
        })
        .catch(() => showToast('Failed to load orders'));
}

function renderSuperOrders() {
    const tbody = document.getElementById('superOrdersTableBody');
    if (!tbody) return;

    if (!superOrdersData.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:#6b7280;">No orders found.</td></tr>`;
        return;
    }

    tbody.innerHTML = superOrdersData.map(o => `
        <tr>
            <td><input type="checkbox" value="${o.id}" onchange="toggleSuperOrder(${o.id})"></td>
            <td><span style="font-weight:600;color:#4f46e5;">#${o.order_number}</span></td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(o.username)}&background=7c3e2e&color=fff&size=30" style="width:30px;height:30px;border-radius:50%;">
                    <div><div style="font-weight:600;">${escapeHtml(o.username)}</div><small style="color:#6b7280;">${escapeHtml(o.email)}</small></div>
                </div>
            </td>
            <td>${o.total_items} items</td>
            <td style="font-weight:600;color:#059669;">$${parseFloat(o.total_amount).toFixed(2)}</td>
            <td><span class="status-badge status-${o.status}">${o.status}</span></td>
            <td>${formatDate(o.created_at)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn view" title="View" onclick="viewSuperOrder(${o.id})"><i class="fas fa-eye"></i></button>
                </div>
            </td>
        </tr>`).join('');

    renderSuperPagination('superOrderPagination', superOrderPage, superOrderPages, 'loadSuperOrders');
}

function renderSuperOrderPipeline(pipeline) {
    const container = document.getElementById('superOrderPipeline');
    if (!container) return;
    const steps = [
        { label: 'Pending',    key: 'pending',         color: '#fef3c7', textColor: '#92400e', icon: 'fa-clock' },
        { label: 'Processing', key: 'processing',       color: '#dbeafe', textColor: '#1e40af', icon: 'fa-box' },
        { label: 'Shipped',    key: 'shipped',          color: '#e0e7ff', textColor: '#3730a3', icon: 'fa-shipping-fast' },
        { label: 'Delivered',  key: 'delivered_today',  color: '#d1fae5', textColor: '#065f46', icon: 'fa-check' }
    ];
    container.innerHTML = steps.map(s => `
        <div class="stat-card" style="text-align:center;">
            <div style="width:56px;height:56px;background:${s.color};border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;color:${s.textColor};font-size:22px;">
                <i class="fas ${s.icon}"></i>
            </div>
            <h3>${pipeline[s.key] || 0}</h3>
            <p style="color:#6b7280;font-size:13px;">${s.label}</p>
        </div>`).join('');
}

function toggleSuperOrder(id) {
    if (superSelectedOrders.has(id)) superSelectedOrders.delete(id);
    else superSelectedOrders.add(id);
}
function toggleSuperSelectAllOrders() {
    const cb = document.getElementById('superSelectAllOrders');
    document.querySelectorAll('#superOrdersTableBody input[type="checkbox"]').forEach(c => {
        c.checked = cb.checked;
        const id = parseInt(c.value);
        cb.checked ? superSelectedOrders.add(id) : superSelectedOrders.delete(id);
    });
}
function viewSuperOrder(id) { showToast('View order ' + id + ' — wire to your order detail modal'); }
function filterSuperOrders() { loadSuperOrders(1); }
function exportSuperOrders() { window.open('../php/export_orders.php', '_blank'); }
function bulkSuperPrintLabels() {
    if (!superSelectedOrders.size) { alert('Select at least one order'); return; }
    window.open(`../php/print_labels.php?ids=${[...superSelectedOrders].join(',')}`, '_blank');
}


/* ============================================================
   CATEGORIES
   PHP endpoints: get_categories.php / save_category.php /
                  delete_category.php
   ============================================================ */

let superCategoriesData = [];

function loadSuperCategories() {
    const tbody = document.getElementById('superCategoriesTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b7280;"><i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:10px;"></i>Loading categories...</td></tr>`;

    fetch('../php/get_categories.php')
        .then(r => r.json())
        .then(data => {
            if (data.status === 200) {
                superCategoriesData = data.categories || [];
                renderSuperCategories();
            } else {
                showToast('Error loading categories: ' + (data.message || ''));
            }
        })
        .catch(() => showToast('Failed to load categories'));
}

function renderSuperCategories(list) {
    const tbody = document.getElementById('superCategoriesTableBody');
    if (!tbody) return;
    const data = list || superCategoriesData;

    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b7280;">No categories found.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(c => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    ${c.image ? `<img src="../${c.image}" style="width:36px;height:36px;border-radius:6px;object-fit:cover;">` : `<div style="width:36px;height:36px;background:#e0e7ff;border-radius:6px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-tag" style="color:#4f46e5;"></i></div>`}
                    <div style="font-weight:600;">${escapeHtml(c.name)}</div>
                </div>
            </td>
            <td style="color:#6b7280;font-size:13px;">${escapeHtml(c.slug || '—')}</td>
            <td>${c.product_count || 0}</td>
            <td><span class="status-badge status-${c.status || 'active'}">${c.status || 'active'}</span></td>
            <td>${formatDate(c.created_at)}</td>
            <td>
                <div class="action-btns">
                    <button class="action-btn edit" title="Edit" onclick="editSuperCategory(${c.id})"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete" title="Delete" onclick="deleteSuperCategory(${c.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`).join('');
}

function filterSuperCategories() {
    const q = (document.getElementById('superCategorySearch')?.value || '').toLowerCase();
    renderSuperCategories(superCategoriesData.filter(c => c.name.toLowerCase().includes(q)));
}
function openSuperCategoryModal() { showToast('Add category — wire to your category form/modal'); }
function editSuperCategory(id) { showToast('Edit category ' + id); }
function deleteSuperCategory(id) {
    if (!confirm('Delete this category?')) return;
    fetch(`../php/delete_category.php?id=${id}`, { method: 'POST' })
        .then(r => r.json())
        .then(d => { if (d.status === 200) { showToast('Category deleted'); loadSuperCategories(); } else showToast(d.message); });
}


/* ============================================================
   REPORTS
   PHP endpoints: export_report.php
   ============================================================ */

function initSuperReports() {
    const today    = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const from = document.getElementById('superReportDateFrom');
    const to   = document.getElementById('superReportDateTo');
    if (from) from.value = firstDay;
    if (to)   to.value   = today;
}

function generateSuperReport() {
    const from  = document.getElementById('superReportDateFrom')?.value;
    const to    = document.getElementById('superReportDateTo')?.value;
    const type  = document.getElementById('superReportType')?.value;
    const out   = document.getElementById('superReportOutput');
    const title = document.getElementById('superReportTitle');
    const body  = document.getElementById('superReportContent');

    if (!from || !to) { alert('Please select a date range.'); return; }

    showToast('Generating report...');
    if (out)   out.style.display = 'block';
    if (title) title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Report — ${from} to ${to}`;
    if (body)  body.innerHTML    = `<p style="color:#6b7280;text-align:center;padding:30px 0;"><i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i>Generating...</p>`;

    fetch(`../php/generate_report.php?type=${type}&from=${from}&to=${to}`)
        .then(r => r.json())
        .then(data => {
            if (data.status === 200 && body) {
                body.innerHTML = data.html || '<p style="color:#6b7280;">No data available for this range.</p>';
            } else {
                if (body) body.innerHTML = `<p style="color:#dc2626;">${data.message || 'Failed to generate report.'}</p>`;
            }
        })
        .catch(() => {
            if (body) body.innerHTML = `<p style="color:#dc2626;">Could not reach server.</p>`;
        });
}

function exportSuperReportPDF() {
    const from = document.getElementById('superReportDateFrom')?.value || '';
    const to   = document.getElementById('superReportDateTo')?.value   || '';
    const type = document.getElementById('superReportType')?.value     || 'sales';
    window.open(`../php/export_report.php?format=pdf&type=${type}&from=${from}&to=${to}`, '_blank');
}

function exportSuperReportExcel() {
    const from = document.getElementById('superReportDateFrom')?.value || '';
    const to   = document.getElementById('superReportDateTo')?.value   || '';
    const type = document.getElementById('superReportType')?.value     || 'sales';
    window.open(`../php/export_report.php?format=excel&type=${type}&from=${from}&to=${to}`, '_blank');
}


/* ============================================================
   SHARED PAGINATION HELPER
   Renders into a .logs-pagination-container child div
   ============================================================ */
function renderSuperPagination(containerId, currentPage, totalPages, loadFn) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="logs-pagination-info">
            <span>Page ${currentPage} of ${totalPages}</span>
        </div>
        <div class="logs-pagination-controls" id="${containerId}_btns"></div>
    `;

    const btns = document.getElementById(`${containerId}_btns`);
    if (!btns) return;

    const prev = document.createElement('button');
    prev.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prev.disabled  = currentPage === 1;
    prev.onclick   = () => window[loadFn](currentPage - 1);
    btns.appendChild(prev);

    const maxV = 5;
    let start = Math.max(1, currentPage - Math.floor(maxV / 2));
    let end   = Math.min(totalPages, start + maxV - 1);
    if (end - start < maxV - 1) start = Math.max(1, end - maxV + 1);

    for (let i = start; i <= end; i++) {
        const b = document.createElement('button');
        b.className  = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        b.textContent = i;
        b.onclick    = () => window[loadFn](i);
        btns.appendChild(b);
    }

    const next = document.createElement('button');
    next.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
    next.disabled  = currentPage === totalPages;
    next.onclick   = () => window[loadFn](currentPage + 1);
    btns.appendChild(next);
}