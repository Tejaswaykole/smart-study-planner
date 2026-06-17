const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '@Tejas#9860@',
    database: 'studyflow'
});

db.connect((err) => {
    if (err) {
        console.error('DB Error:', err);
        return;
    }

    console.log('MySQL Connected');
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/tasks', (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});
app.post('/tasks', (req, res) => {
    const { title, priority, due_date } = req.body;

    db.query(
        'INSERT INTO tasks (title, priority, due_date) VALUES (?, ?, ?)',
        [title, priority, due_date],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true,
                id: result.insertId
            });
        }
    );
});
const server = app.listen(5000, () => {
    console.log('Server running on port 5000');
});

server.on('error', (err) => {
    console.error('Listen Error:', err);
});

console.log('File loaded completely');

app.get('/subjects', (req, res) => {
    db.query('SELECT * FROM subjects', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});
app.post('/subjects', (req, res) => {

    const {
        name,
        priority,
        difficulty,
        color
    } = req.body;

    db.query(
        'INSERT INTO subjects (name, priority, difficulty, color) VALUES (?, ?, ?, ?)',
        [name, priority, difficulty, color],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true,
                id: result.insertId
            });
        }
    );
});