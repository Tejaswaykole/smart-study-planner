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

    const sql = `
        SELECT
            tasks.*,
            subjects.name AS subject_name
        FROM tasks
        LEFT JOIN subjects
        ON tasks.subject_id = subjects.id
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });
});
app.post('/tasks', (req, res) => {

    const {
        title,
        priority,
        due_date,
        subject_id
    } = req.body;

    db.query(
        'INSERT INTO tasks (title, priority, due_date, subject_id) VALUES (?, ?, ?, ?)',
        [title, priority, due_date, subject_id],
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

app.delete('/tasks/:id', (req, res) => {

    const taskId = req.params.id;

    db.query(
        'DELETE FROM tasks WHERE id = ?',
        [taskId],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });
        }
    );

});

app.put('/tasks/:id/complete', (req, res) => {

    const taskId = req.params.id;

    db.query(
        'UPDATE tasks SET completed = NOT completed WHERE id = ?',
        [taskId],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });
        }
    );

});

app.put('/tasks/:id', (req, res) => {

    const taskId = req.params.id;

    const {
        title,
        priority,
        due_date,
        subject_id
    } = req.body;

    db.query(
        `UPDATE tasks
         SET title = ?,
             priority = ?,
             due_date = ?,
             subject_id = ?
         WHERE id = ?`,
        [title, priority, due_date, subject_id, taskId],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
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

app.put('/subjects/:id', (req, res) => {

    const subjectId = req.params.id;

    const {
        name,
        priority,
        difficulty,
        color
    } = req.body;

    db.query(
        `UPDATE subjects
         SET name = ?,
             priority = ?,
             difficulty = ?,
             color = ?
         WHERE id = ?`,
        [name, priority, difficulty, color, subjectId],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });
        }
    );

});

app.delete('/subjects/:id', (req, res) => {

    const subjectId = req.params.id;

    db.query(
        'DELETE FROM subjects WHERE id = ?',
        [subjectId],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });
        }
    );

});

app.get('/exams', (req, res) => {

    const sql = `
        SELECT
            exams.*,
            subjects.name AS subject_name
        FROM exams
        LEFT JOIN subjects
        ON exams.subject_id = subjects.id
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }

        res.json(results);
    });

});

app.post('/exams', (req, res) => {

    const {
        title,
        subject_id,
        exam_date,
        exam_type
    } = req.body;

    db.query(
        `INSERT INTO exams
        (title, subject_id, exam_date, exam_type)
        VALUES (?, ?, ?, ?)`,
        [title, subject_id, exam_date, exam_type],
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

app.delete('/exams/:id', (req, res) => {

    const examId = req.params.id;

    db.query(
        'DELETE FROM exams WHERE id = ?',
        [examId],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json({
                success: true
            });
        }
    );

});