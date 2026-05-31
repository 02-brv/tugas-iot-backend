require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Tambahkan ini
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Tambahkan ini untuk membaca JSON dari Postman
app.use(session({ secret: 'rahasia', resave: false, saveUninitialized: true }));

mongoose.connect(process.env.DB_URL)
    .then(() => console.log('Berhasil terhubung ke MongoDB Atlas'))
    .catch(err => console.error('Gagal terhubung ke database:', err));

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// --- ROUTES ---

// 1. API Route untuk Postman (Selalu kirim JSON)
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // Enkripsi password
    await User.create({ username, password: hashedPassword });
    res.json({ message: 'User berhasil didaftarkan via API!' });
});

// 2. Web Route untuk Browser (Redirect)
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    // Verifikasi password yang terenkripsi
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = username;
        res.redirect('/home');
    } else {
        res.send('Login Gagal! <a href="/login">Kembali</a>');
    }
});

app.get('/register', (req, res) => res.render('register'));
app.get('/login', (req, res) => res.render('login'));
app.get('/home', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('home', { user: req.session.user });
});
app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.listen(3000, () => console.log('Server jalan di http://localhost:3000'));