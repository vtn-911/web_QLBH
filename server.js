const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');

const app = express();
const port = 3001;

const config = {
    user: 'sa_admin',
    password: '123456',
    server: 'localhost',
    database: 'QLBH',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    port: 1433
};
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use(cors());
app.use(express.json());

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT * 
                FROM NGUOIDUNG 
                WHERE TenND = @username AND MatKhau = @password
            `); 

        if (result.recordset.length === 0) {
            return res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu!" });
        }
        const user = result.recordset[0];
        res.json({
            success: true,
            ten: user.TenND,
            role: user.Quyen
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/khachhang', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().execute('sp_DS_KH');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post('/api/khachhang', async (req, res) => {
    try {
        const { MAKH, HOLOT, TENKH, PHAI, DIACHI, DIENTHOAI } = req.body;
        let pool = await sql.connect(config);
        await pool.request()
            .input('MAKH', sql.NVarChar, MAKH)
            .input('HOLOT', sql.NVarChar, HOLOT)
            .input('TENKH', sql.NVarChar, TENKH)
            .input('PHAI', sql.Bit, PHAI)
            .input('DIACHI', sql.NVarChar, DIACHI)
            .input('DIENTHOAI', sql.VarChar, DIENTHOAI)
            .execute('sp_KH_Insert');
        res.json({ message: "Thêm thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/khachhang/:id', async (req, res) => {
    try {
        const { HOLOT, TENKH, PHAI, DIACHI, DIENTHOAI } = req.body;
        let pool = await sql.connect(config);
        await pool.request()
            .input('MAKH', sql.NVarChar, req.params.id)
            .input('HOLOT', sql.NVarChar, HOLOT)
            .input('TENKH', sql.NVarChar, TENKH)
            .input('PHAI', sql.Bit, PHAI)
            .input('DIACHI', sql.NVarChar, DIACHI)
            .input('DIENTHOAI', sql.NVarChar, DIENTHOAI)
            .execute('sp_KH_Update');
        res.json({ message: "Cập nhật thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/khachhang/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('MAKH', sql.NVarChar, req.params.id)
            .execute('sp_KH_Delete');
        res.json({ message: "Xóa thành công!" });
    } catch (err) {
        let customMessage = err.message;
        if (err.message.toLowerCase().includes('trigger')) {
            customMessage = "Khách hàng này đã có hóa đơn, không thể xóa!";
        } else if (err.message.includes('REFERENCE constraint')) {
            customMessage = "Lỗi ràng buộc dữ liệu liên quan (Khóa ngoại).";
        }
        res.status(500).json({ error: customMessage });
    }
});


app.get('/api/nhacungcap', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query('SELECT * FROM NHACUNGCAP');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/hanghoa/filter', async (req, res) => {
    try {
        const { mancc } = req.query;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('MANCC', sql.VarChar, mancc)
            .execute('sp_DS_MatHang')
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/hoadon/search', async (req, res) => {
    try {
        const { q } = req.query;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('tukhoa', sql.NVarChar, q)
            .execute('sp_Timkiem');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.post('/api/system/user', async (req, res) => {
    try {
        const { username, pass, role } = req.body;
        let pool = await sql.connect(config);

        await pool.request()
            .input('tennd', sql.NVarChar, username)
            .input('matkhau', sql.NVarChar, pass)
            .input('quyen', sql.NVarChar, role)
            .execute('sp_taoUser');


        res.status(200).json({ message: "Đã tạo tài khoản thành công!" });
    } catch (err) {

        res.status(500).json({ error: err.message || "Lỗi SQL không xác định" });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

app.get('/api/baocao/quy', async (req, res) => {
    try {
        const { nam } = req.query;
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('Nam', sql.Int, parseInt(nam))
            .execute('sp_ThongKeTheoQuy');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});