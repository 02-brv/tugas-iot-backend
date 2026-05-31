require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = express();

// Tambahkan ini agar link utama otomatis diarahkan ke halaman login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// --- Konfigurasi ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ 
    secret: 'rahasia', 
    resave: false, 
    saveUninitialized: true 
}));

// --- Koneksi Database (Optimasi untuk Serverless) ---
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(process.env.DB_URL);
};

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// --- ROUTES ---

// API Route untuk Postman
app.post('/api/register', async (req, res) => {
    await connectDB();
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.json({ message: 'User berhasil didaftarkan via API!' });
});

// Web Route untuk Browser
app.post('/register', async (req, res) => {
    await connectDB();
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
});

app.post('/login', async (req, res) => {
    await connectDB();
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
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

// Ekspor untuk Vercel
module.exports = app;