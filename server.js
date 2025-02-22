const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json()); // Essential for parsing POST request bodies
app.use(express.static('public'));

// Admin: Upload questions
app.post('/admin/upload-questions', async (req, res) => {
    try {
        const questions = req.body;
        await fs.writeFile(path.join(__dirname, 'data', 'questions.json'), JSON.stringify(questions, null, 2));
        res.send({ message: 'Questions uploaded successfully' });
    } catch (error) {
        console.error('Error uploading questions:', error);
        res.status(500).send({ error: 'Failed to upload questions' });
    }
});

// Admin: Upload answers
app.post('/admin/upload-answers', async (req, res) => {
    try {
        const answers = req.body;
        await fs.writeFile(path.join(__dirname, 'data', 'answers.json'), JSON.stringify(answers, null, 2));
        res.send({ message: 'Answers uploaded successfully' });
    } catch (error) {
        console.error('Error uploading answers:', error);
        res.status(500).send({ error: 'Failed to upload answers' });
    }
});

// User: Get questions
app.get('/questions', async (req, res) => {
    try {
        const questions = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'questions.json'), 'utf8'));
        res.json(questions);
    } catch (error) {
        console.error('Error loading questions:', error);
        res.status(500).send({ error: 'Failed to load questions' });
    }
});

// User: Submit answers and get score
app.post('/submit', async (req, res) => {
    try {
        const userAnswers = req.body;
        const correctAnswers = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'answers.json'), 'utf8'));
        const questions = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'questions.json'), 'utf8'));

        let score = 0;
        let totalMarks = 0;

        questions.forEach(q => {
            const userAns = userAnswers[q.id];
            const correct = Array.isArray(correctAnswers[q.id]) ? correctAnswers[q.id] : [correctAnswers[q.id]];

            if (q.type === 'integer') {
                totalMarks += 3;
                if (userAns === correctAnswers[q.id]) score += 3;
                else if (userAns !== undefined && userAns !== null) score -= 1;
            } else if (q.type === 'single') {
                totalMarks += 3;
                if (userAns === correct[0]) score += 3;
                else if (userAns) score -= 1;
            } else if (q.type === 'multiple') {
                totalMarks += 4;
                if (!userAns) return;
                const allCorrect = correct.every(ans => userAns.includes(ans));
                const noWrong = userAns.every(ans => correct.includes(ans));
                if (allCorrect && noWrong) score += 4;
                else if (noWrong) {
                    if (userAns.length === 3 && correct.length === 4) score += 3;
                    else if (userAns.length === 2 && correct.length >= 3) score += 2;
                    else if (userAns.length === 1 && correct.length >= 2) score += 1;
                } else score -= 2;
            }
        });

        res.json({ score, totalMarks });
    } catch (error) {
        console.error('Error processing submission:', error);
        res.status(500).send({ error: 'Failed to process submission' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});