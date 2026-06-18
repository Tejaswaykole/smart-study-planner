const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'studyflow_secret_key';

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

    const userId = req.query.userId;

    db.query(
        'SELECT * FROM tasks WHERE user_id = ?',
        [userId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );

});
app.post('/tasks', (req, res) => {

    const {
        title,
        priority,
        due_date,
        subject_id,
        user_id
    } = req.body;

    db.query(
        'INSERT INTO tasks (title, priority, due_date, subject_id, user_id) VALUES (?, ?, ?, ?, ?)',
        [title, priority, due_date, subject_id, user_id],
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
    const userId = req.query.userId;
    db.query(
        'SELECT * FROM subjects WHERE user_id = ?',
        [userId],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );
});
app.post('/subjects', (req, res) => {

    const {
        name,
        priority,
        difficulty,
        color,
        user_id
    } = req.body;

    db.query(
        'INSERT INTO subjects (name, priority, difficulty, color, user_id) VALUES (?, ?, ?, ?, ?)',
        [name, priority, difficulty, color, user_id],
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

    const userId = req.query.userId;

    db.query(
        'SELECT * FROM exams WHERE user_id = ?',
        [userId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );

});

app.post('/exams', (req, res) => {

    const {
        title,
        subject_id,
        exam_date,
        exam_type,
        user_id
    } = req.body;

    db.query(
        `INSERT INTO exams
        (title, subject_id, exam_date, exam_type, user_id)
        VALUES (?, ?, ?, ?, ?)`,
        [title, subject_id, exam_date, exam_type, user_id],
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

app.put('/exams/:id', (req, res) => {

    const examId = req.params.id;

    const {
        title,
        subject_id,
        exam_date,
        exam_type
    } = req.body;

    db.query(
        `UPDATE exams
         SET title = ?,
             subject_id = ?,
             exam_date = ?,
             exam_type = ?
         WHERE id = ?`,
        [title, subject_id, exam_date, exam_type, examId],
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

app.get('/goals', (req, res) => {

    const userId = req.query.userId;

    db.query(
        'SELECT * FROM goals WHERE user_id = ?',
        [userId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );

});

app.post('/goals', (req, res) => {

    const {
        title,
        target_date,
        progress,
        user_id
    } = req.body;

    db.query(
        `INSERT INTO goals
        (title, target_date, progress, user_id)
        VALUES (?, ?, ?, ?)`,
        [title, target_date, progress, user_id],
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

app.put('/goals/:id', (req, res) => {

    const goalId = req.params.id;

    let {
        title,
        target_date,
        progress,
        completed
    } = req.body;

    if (target_date) {
        target_date = target_date.split('T')[0];
    }

    db.query(
        `UPDATE goals
         SET title = ?,
             target_date = ?,
             progress = ?,
             completed = ?
         WHERE id = ?`,
        [title, target_date, progress, completed, goalId],
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

app.delete('/goals/:id', (req, res) => {

    const goalId = req.params.id;

    db.query(
        'DELETE FROM goals WHERE id = ?',
        [goalId],
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

app.get('/focus-sessions', (req, res) => {

    const userId = req.query.userId;

    db.query(
        'SELECT * FROM focus_sessions WHERE user_id = ? ORDER BY session_date DESC',
        [userId],
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );

});

app.post('/focus-sessions', (req, res) => {

    const {
        subject_id,
        duration,
        user_id
    } = req.body;

    db.query(
        `INSERT INTO focus_sessions
        (subject_id, duration, user_id)
        VALUES (?, ?, ?)`,
        [subject_id, duration, user_id],
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

app.get('/achievements', (req, res) => {

    db.query(
        'SELECT * FROM achievements',
        (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            res.json(results);
        }
    );

});

app.put('/achievements/:id', (req, res) => {

    const achievementId = req.params.id;

    db.query(
        `UPDATE achievements
         SET unlocked = TRUE,
             unlocked_date = NOW()
         WHERE id = ?`,
        [achievementId],
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

app.post('/register', async (req, res) => {

    try {

        const {
            username,
            email,
            password
        } = req.body;

        const hashedPassword =
            await bcrypt.hash(password, 10);

        db.query(
            `INSERT INTO users
            (username,email,password)
            VALUES (?,?,?)`,
            [
                username,
                email,
                hashedPassword
            ],
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

    } catch (err) {

        console.error(err);
        res.status(500).json(err);

    }

});

app.post('/login', (req, res) => {

    const {
        email,
        password
    } = req.body;

    db.query(
        'SELECT * FROM users WHERE email=?',
        [email],
        async (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json(err);
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: 'User not found'
                });
            }

            const user = results[0];

            const validPassword =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!validPassword) {

                return res.status(401).json({
                    message: 'Invalid password'
                });

            }

            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email
                },
                JWT_SECRET,
                {
                    expiresIn: '7d'
                }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            });

        }
    );

});