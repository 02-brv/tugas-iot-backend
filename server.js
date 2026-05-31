require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const app = express();

// --- Konfigurasi ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({ 
    secret: 'rahasia', 
    resave: false, 
    saveUninitialized: true 
}));

// --- Koneksi Database (Optimasi Serverless) ---
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    return mongoose.connect(process.env.DB_URL);
};

// --- Model ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
});
// Pencegahan error jika model sudah ada saat re-deploy di Vercel
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- ROUTES ---

app.get('/', (req, res) => res.redirect('/login'));

app.post('/api/register', async (req, res) => {
    await connectDB();
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.json({ message: 'User berhasil didaftarkan via API!' });
});

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

module.exports = app;