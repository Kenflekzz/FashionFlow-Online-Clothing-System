// ============================================
// DELETED ACCOUNTS SECTION
// ============================================

let deletedAccountsData     = [];
let deletedAccountsFiltered = [];
let deletedCurrentPage      = 1;
let deletedPerPage          = 10;

function loadDeletedAccounts() {
    const tbody = document.getElementById('deletedAccountsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="text-align: center; padding: 40px; color: #6b7280;">
                <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                <p>Loading...</p>
            </td>
        </tr>
    `;

    fetch(`${API_URL}?action=get_deleted_accounts`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                deletedAccountsData     = data.data.records || [];
                deletedAccountsFiltered = [...deletedAccountsData];
                renderDeletedAccountsTable();
                updateDeletedStats();
            } else {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center; color:#ef4444; padding:40px;">
                            ${data.message}
                        </td>
                    </tr>
                `;
            }
        })
        .catch(err => {
            console.error('Error loading deleted accounts:', err);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center; color:#ef4444; padding:40px;">
                        Failed to load deleted accounts.
                    </td>
                </tr>
            `;
        });
}

function updateDeletedStats() {
    const total   = deletedAccountsData.length;
    const now     = new Date();

    const thisMonth = deletedAccountsData.filter(r => {
        const d = new Date(r.deleted_at);
        return d.getMonth()    === now.getMonth() &&
               d.getFullYear() === now.getFullYear();
    }).length;

    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thisWeek   = deletedAccountsData.filter(r =>
        new Date(r.deleted_at) >= oneWeekAgo
    ).length;

    document.getElementById('totalDeletedCount').textContent = total;
    document.getElementById('deletedThisMonth').textContent  = thisMonth;
    document.getElementById('deletedThisWeek').textContent   = thisWeek;
}

function renderDeletedAccountsTable() {
    const tbody = document.getElementById('deletedAccountsTableBody');
    const start = (deletedCurrentPage - 1) * deletedPerPage;
    const end   = start + deletedPerPage;
    const paged = deletedAccountsFiltered.slice(start, end);

    if (paged.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:40px; color:#6b7280;">
                    <i class="fas fa-user-slash" style="font-size:48px; margin-bottom:10px; display:block;"></i>
                    No deleted accounts found.
                </td>
            </tr>
        `;
        updateDeletedPaginationInfo();
        renderDeletedPagination();
        return;
    }

    tbody.innerHTML = paged.map((record, index) => {
        const ext     = record.proof_file ? record.proof_file.split('.').pop().toLowerCase() : '';
        const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
        const isPdf   = ext === 'pdf';
        const isDoc   = ['doc', 'docx'].includes(ext);

        const fileIcon  = isPdf   ? 'fa-file-pdf'   :
                          isDoc   ? 'fa-file-word'   :
                          isImage ? 'fa-file-image'  : 'fa-file';
        const fileColor = isPdf   ? '#ef4444'        :
                          isDoc   ? '#3b82f6'         :
                          isImage ? '#10b981'         : '#6b7280';

        const recordJson = JSON.stringify(record).replace(/"/g, '&quot;');

        const proofBtn = record.proof_file
            ? `<button onclick='viewProof(${recordJson})'
                style="display:inline-flex; align-items:center; gap:6px; padding:6px 12px;
                       background:#f3f4f6; border:1px solid #e5e7eb; border-radius:6px;
                       cursor:pointer; font-size:12px; color:#374151; font-weight:500;">
                    <i class="fas ${fileIcon}" style="color:${fileColor};"></i>
                    View Proof
               </button>`
            : '<span style="color:#9ca3af; font-size:12px;">No file</span>';

        return `
            <tr>
                <td style="font-family:monospace; color:#6b7280;">${start + index + 1}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:36px; height:36px; border-radius:50%; background:#fee2e2;
                                    display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-user-slash" style="color:#ef4444; font-size:14px;"></i>
                        </div>
                        <div>
                            <p style="margin:0; font-weight:600; color:#374151; font-size:13px;">
                                ID: ${escapeHtml(record.deleted_user_id)}
                            </p>
                            <p style="margin:0; color:#6b7280; font-size:11px;">Deleted account</p>
                        </div>
                    </div>
                </td>
                <td style="max-width:200px;">
                    <p style="margin:0; font-size:12px; color:#374151;
                               overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"
                       title="${escapeHtml(record.reason)}">
                        ${escapeHtml(record.reason)}
                    </p>
                </td>
                <td style="font-size:13px; color:#374151;">${escapeHtml(record.requested_by)}</td>
                <td style="font-size:13px; color:#374151;">${escapeHtml(record.deleted_by)}</td>
                <td>${proofBtn}</td>
                <td style="font-size:12px; color:#6b7280; white-space:nowrap;">
                    ${formatDateTime(record.deleted_at)}
                </td>
            </tr>
        `;
    }).join('');

    updateDeletedPaginationInfo();
    renderDeletedPagination();
}

function updateDeletedPaginationInfo() {
    const info  = document.getElementById('deletedShowingInfo');
    const total = deletedAccountsFiltered.length;

    if (total === 0) {
        info.textContent = 'No records';
        return;
    }

    const start = (deletedCurrentPage - 1) * deletedPerPage + 1;
    const end   = Math.min(deletedCurrentPage * deletedPerPage, total);
    info.textContent = `Showing ${start}-${end} of ${total} records`;
}

function renderDeletedPagination() {
    const container  = document.getElementById('deletedPagination');
    const totalPages = Math.ceil(deletedAccountsFiltered.length / deletedPerPage);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `
        <button class="pagination-btn" onclick="changeDeletedPage(${deletedCurrentPage - 1})"
                ${deletedCurrentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <button class="pagination-btn ${i === deletedCurrentPage ? 'active' : ''}"
                    onclick="changeDeletedPage(${i})">${i}</button>
        `;
    }

    html += `
        <button class="pagination-btn" onclick="changeDeletedPage(${deletedCurrentPage + 1})"
                ${deletedCurrentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    container.innerHTML = html;
}

function changeDeletedPage(page) {
    const totalPages = Math.ceil(deletedAccountsFiltered.length / deletedPerPage);
    if (page < 1 || page > totalPages) return;
    deletedCurrentPage = page;
    renderDeletedAccountsTable();
}

function changeDeletedPerPage() {
    deletedPerPage     = parseInt(document.getElementById('deletedPerPage').value);
    deletedCurrentPage = 1;
    renderDeletedAccountsTable();
}

function filterDeletedAccounts() {
    const term = document.getElementById('deletedSearch').value.toLowerCase();
    deletedAccountsFiltered = deletedAccountsData.filter(r =>
        r.deleted_user_id.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term)          ||
        r.deleted_by.toLowerCase().includes(term)      ||
        r.requested_by.toLowerCase().includes(term)
    );
    deletedCurrentPage = 1;
    renderDeletedAccountsTable();
}

function viewProof(record) {
    document.getElementById('proofAccountId').textContent   = record.deleted_user_id;
    document.getElementById('proofDeletedBy').textContent   = record.deleted_by;
    document.getElementById('proofRequestedBy').textContent = record.requested_by;
    document.getElementById('proofDeletedAt').textContent   = formatDateTime(record.deleted_at);
    document.getElementById('proofReason').textContent      = record.reason;

    const fileUrl   = `../uploads/deletion_proofs/${record.proof_file}`;
    const ext       = record.proof_file.split('.').pop().toLowerCase();
    const isImage   = ['jpg', 'jpeg', 'png'].includes(ext);
    const isPdf     = ext === 'pdf';
    const container = document.getElementById('proofFileContainer');

    if (isImage) {
        container.innerHTML = `
            <img src="${fileUrl}" alt="Authorization Proof"
                 style="max-width:100%; max-height:500px; border-radius:8px; object-fit:contain;">
        `;
    } else if (isPdf) {
        container.innerHTML = `
            <iframe src="${fileUrl}" width="100%" height="500px"
                    style="border:none; border-radius:8px;"></iframe>
        `;
    } else {
        container.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <i class="fas fa-file-word" style="font-size:64px; color:#3b82f6; margin-bottom:15px; display:block;"></i>
                <p style="color:#374151; font-weight:600;">${record.proof_file}</p>
                <p style="color:#6b7280; font-size:13px;">
                    This file type cannot be previewed. Please download to view.
                </p>
            </div>
        `;
    }

    document.getElementById('proofDownloadLink').href = fileUrl;

    const modal = document.getElementById('proofImageModal');
    modal.style.display = '';
    modal.classList.add('show');
}

function closeProofModal() {
    const modal = document.getElementById('proofImageModal');
    modal.classList.remove('show');
    modal.style.display = '';
}

function exportDeletedAccounts() {
    if (!deletedAccountsData.length) {
        showToast('No records to export', 'error');
        return;
    }

    const headers = ['#', 'Deleted Account ID', 'Reason', 'Requested By', 'Deleted By', 'Proof File', 'Deleted At'];
    const rows    = deletedAccountsData.map((r, i) => [
        i + 1, r.deleted_user_id, r.reason,
        r.requested_by, r.deleted_by,
        r.proof_file, r.deleted_at
    ]);

    const csv  = [headers, ...rows]
        .map(row => row.map(c => `"${c || ''}"`).join(','))
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `deleted_accounts_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Exported successfully!');
}

// ============================================
// RESTORE ACCOUNT
// ============================================

function showRestoreModal(userId) {
    document.getElementById('restoreUserId').value = userId;
    document.getElementById('restoreUserIdDisplay').textContent = userId;
    document.getElementById('restoreModal').style.display = 'flex';
}

function closeRestoreModal() {
    document.getElementById('restoreModal').style.display = 'none';
}

async function confirmRestore() {
    const userId = document.getElementById('restoreUserId').value;

    const btn = document.querySelector('#restoreModal .btn-success');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring...';
    btn.disabled = true;

    try {
        const response = await fetch('../php/restore_account.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ user_id: userId })
        });

        const data = await response.json();

        if (data.success) {
            showToast('Account restored successfully!', 'success');
            closeRestoreModal();
            loadDeletedAccounts();
            loadAllUsers();
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('Restore error:', error);
        showToast('Failed to restore account', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}