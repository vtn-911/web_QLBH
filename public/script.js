const API_URL = `${window.location.origin}/api`;

document.addEventListener('DOMContentLoaded', () => {
    const role = localStorage.getItem('userRole');
    if (role) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('user-header').style.display = 'block';

        displayCurrentDate();
        loadKhachHang();
        loadNCCForSelect();
        applyPermissions();
    } else {
        console.log("Chưa đăng nhập");
    }
});

async function handleLogin() {
    const user = document.getElementById('login_user').value;
    const pass = document.getElementById('login_pass').value;
    const msg = document.getElementById('login_msg');

    if (!user || !pass) {
        msg.innerText = "Vui lòng nhập đầy đủ!";
        return;
    }
    try {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userName', data.ten);
            location.reload(); 
        } else {
            msg.innerText = data.message || "Tài khoản hoặc mật khẩu sai!";
        }
    } catch (err) {
        msg.innerText = "Lỗi kết nối Server!";
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function applyPermissions() {
    const role = localStorage.getItem('userRole');
    if (role && role !== 'ADMIN') {
        const formKH = document.querySelector('#khachhang .form-group');
        if (formKH) formKH.style.display = 'none';
        const sidebarItems = document.querySelectorAll('.sidebar ul li');
        if (sidebarItems[3]) sidebarItems[3].style.display = 'none';
        const actionHeader = document.querySelector('#tableKhachHang thead th:last-child');
        if (actionHeader) actionHeader.style.display = 'none';
    }
}

function showSection(id) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
}

function displayCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = `Hôm nay, ${now.toLocaleDateString('vi-VN', options)}`;
}

async function loadKhachHang() {
    const res = await fetch(`${API_URL}/khachhang`);
    const data = await res.json();
    const tbody = document.querySelector('#tableKhachHang tbody');
    const role = localStorage.getItem('userRole'); // Lấy role
    
    tbody.innerHTML = '';
    data.forEach(kh => {
        let actionButtons = ``;
        if (role === 'ADMIN') {
            actionButtons = `
                <td>
                    <button onclick="editCustomer('${kh.MAKH}', '${kh.HOLOT}', '${kh.TENKH}', '${kh.GioiTinh}', '${kh.DIACHI}', '${kh.DIENTHOAI}')">Sửa</button>
                    <button onclick="deleteCustomer('${kh.MAKH}')">Xóa</button>
                </td>`;
        }
        tbody.innerHTML += `
            <tr>
                <td>${kh.MAKH}</td>
                <td>${kh.HovaTen}</td>
                <td>${kh.GioiTinh}</td>
                <td>${kh.DIACHI}</td>
                <td>${kh.DIENTHOAI}</td>
                <td>${kh.TongTien?.toLocaleString()} VNĐ</td>
                ${actionButtons}
            </tr>`;
    });
}

function editCustomer(makh, holot, tenkh, phai, diachi, dienthoai) {
    document.getElementById('makh').value = makh;
    document.getElementById('makh').readOnly = true;
    document.getElementById('holot').value = holot;
    document.getElementById('tenkh').value = tenkh;
    document.getElementById('phai').value = (phai === 'Nam' ? "1" : "0");
    document.getElementById('diachi_kh').value = diachi;
    document.getElementById('dienthoai_kh').value = dienthoai;

    const btn = document.querySelector('.btn-add');
    btn.innerText = "Cập Nhật Khách Hàng";
    btn.onclick = (e) => updateCustomer(e);
}


async function updateCustomer(event) {
    if (event) event.preventDefault();

    const makh = document.getElementById('makh').value;
    const customer = {
        HOLOT: document.getElementById('holot').value,
        TENKH: document.getElementById('tenkh').value,
        PHAI: document.getElementById('phai').value === "1",
        DIACHI: document.getElementById('diachi_kh').value,
        DIENTHOAI: document.getElementById('dienthoai_kh').value
    };

    try {
        const res = await fetch(`${API_URL}/khachhang/${makh}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customer)
        });

        if (res.ok) {
            alert("Cập nhật thành công!");
            resetForm();
            loadKhachHang();
        } else {
            const errorData = await res.json();
            alert("Lỗi: " + errorData.error);
        }
    } catch (err) {
        alert("Không thể kết nối Server!");
    }
}

function resetForm() {
    document.getElementById('makh').value = '';
    document.getElementById('makh').readOnly = false;
    document.getElementById('holot').value = '';
    document.getElementById('tenkh').value = '';
    document.getElementById('diachi_kh').value = '';
    document.getElementById('dienthoai_kh').value = '';

    const btn = document.querySelector('.btn-add');
    btn.innerText = "Lưu Khách Hàng";
    btn.onclick = saveCustomer;
}
async function saveCustomer() {
    const customer = {
        MAKH: document.getElementById('makh').value,
        HOLOT: document.getElementById('holot').value,
        TENKH: document.getElementById('tenkh').value,
        PHAI: document.getElementById('phai').value === "1",
        DIACHI: document.getElementById('diachi_kh').value,
        DIENTHOAI: document.getElementById('dienthoai_kh').value
    };
    const res = await fetch(`${API_URL}/khachhang`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customer)
    });
    if (res.ok) { alert('Thành công!'); loadKhachHang(); }
    else { const err = await res.json(); alert('Lỗi: ' + err.error); }
}

async function deleteCustomer(id) {
    if (!confirm('Xóa khách hàng này?')) return;
    const res = await fetch(`${API_URL}/khachhang/${id}`, { method: 'DELETE' });
    if (res.ok) { alert('Đã xóa!'); loadKhachHang(); }
    else { const err = await res.json(); alert('Lỗi (C8): ' + err.error); }
}

async function loadNCCForSelect() {
    const res = await fetch(`${API_URL}/nhacungcap`);
    const data = await res.json();
    const select = document.getElementById('filter_mancc_select');
    select.innerHTML = '<option value="">-- Chọn Nhà Cung Cấp --</option>';
    data.forEach(ncc => {
        select.innerHTML += `<option value="${ncc.MANCC}">${ncc.TENNCC}</option>`;
    });
}

async function filterByNCC() {
    const mancc = document.getElementById('filter_mancc_select').value;
    const res = await fetch(`${API_URL}/hanghoa/filter?mancc=${mancc}`);
    const data = await res.json();
    const tbody = document.querySelector('#tableHangHoa tbody');
    tbody.innerHTML = '';
    data.forEach(h => {
        tbody.innerHTML += `<tr><td>${h.MAHANG}</td><td>${h.TENHANG}</td><td>${h.DVT}</td></tr>`;
    });
}


async function searchInvoice() {
    document.getElementById('soluong').style.display = 'none';
    const q = document.getElementById('search_invoice').value;
    const res = await fetch(`${API_URL}/hoadon/search?q=${q}`);
    const data = await res.json();
    const tbody = document.querySelector('#tableHoaDon tbody');
    tbody.innerHTML = '';
    data.forEach(hd => {
        tbody.innerHTML += `
        <tr>
            <td>${hd.MAHD}</td>
            <td>${hd.NGAYHD}</td>
            <td style="display:none"></td>
            <td>${hd.TongTien.toLocaleString()}</td>
        </tr>`;
    });
}


async function createUser() {
    const user = {
        username: document.getElementById('new_user').value,
        pass: document.getElementById('new_pass').value,
        role: document.getElementById('new_role').value
    };

    const res = await fetch(`${API_URL}/system/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });

    const data = await res.json();

    if (res.ok) {
        alert(data.message);
    } else {
        alert("Lỗi: " + data.error);
    }
}

async function reportByQuarter() {
    document.getElementById('soluong').style.display = 'table-cell';
    const nam = document.getElementById('stat_year').value;
    if (!nam) {
        alert("Vui lòng nhập năm!");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/baocao/quy?nam=${nam}`);
        const data = await res.json();

        const tbody = document.querySelector('#tableHoaDon tbody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Không có dữ liệu cho năm này</td></tr>';
            return;
        }

        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <tr>
                    <td>Quý ${item.Quy}</td>
                    <td>Năm ${nam}</td>
                    <td>Số lượng: ${item.SoLuongHD}</td>
                    <td class="money">${item.TongTien ? item.TongTien.toLocaleString() : 0} VNĐ</td>
                 </tr>
                `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        alert("Lỗi khi lấy báo cáo thống kê!");
    }
}