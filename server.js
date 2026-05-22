const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware Setup Elements
app.use(cors());
app.use(express.json()); 
app.use(express.static('public')); // Serves frontend assets directly from public/

// Database Connection Infrastructure
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'jesus252525', // Enter your MySQL Workbench root password if you have one
    database: 'jvsahub_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verify Database Connection State on Startup
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed: ' + err.message);
    } else {
        console.log('✅ Connected to the MySQL Database successfully!');
        connection.release();
    }
});

// Standard Root Greeting Fallback Check
app.get('/', (req, res) => {
    res.send('JvsaHub Core Management Server is running perfectly.');
});

// --- PLATFORM RESTful API ROUTING ---

// 1. User Registration Route
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, password], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Username already exists!' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'User registered successfully!' });
    });
});

// 2. User Authentication Entry Route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Please enter all fields' });
    }

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        const user = results[0];
        // Plaintext check layout matching frontend transmission variables
        if (password !== user.password) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        res.json({
            message: "Welcome back!",
            user: { id: user.id, username: user.username }
        });
    });
});

// 3. Create Article Route
app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;

    if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
    }

    const query = 'INSERT INTO posts (title, content) VALUES (?, ?)';
    db.query(query, [title, content], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Post created successfully', postId: result.insertId });
    });
});

// 4. Fetch All Feed Content Route
//  THE FIXED BLOCK:
app.get('/api/posts', (req, res) => {
    const query = 'SELECT * FROM posts ORDER BY id DESC';
    db.query(query, (err, results) => {  // <--- Parentheses added correctly around (err, results)
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 5. Update Existing Post Route (PUT)
app.put('/api/posts/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, content } = req.body;

    const query = 'UPDATE posts SET title = ?, content = ? WHERE id = ?';
    db.query(query, [title, content, taskId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ message: 'Post updated successfully' });
    });
});

// 6. Delete Post Route (DELETE)
app.delete('/api/posts/:id', (req, res) => {
    const taskId = req.params.id;

    const query = 'DELETE FROM posts WHERE id = ?';
    db.query(query, [taskId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json({ message: 'Post deleted successfully' });
    });
});

// 7. Post Comments Layer Route
app.post('/api/comments', (req, res) => {
    const { post_id, comment_text } = req.body;

    if (!comment_text) {
        return res.status(400).json({ error: 'Comment text cannot be empty' });
    }

    const query = 'INSERT INTO comments (post_id, comment_text) VALUES (?, ?)';
    db.query(query, [post_id, comment_text], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Comment attached successfully' });
    });
});

// 8. Load Comments Routing Stack
app.get('/api/comments/:post_id', (req, res) => {
    const postId = req.params.post_id;

    const query = 'SELECT * FROM comments WHERE post_id = ?';
    db.query(query, [postId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Server Initialization Activation
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});