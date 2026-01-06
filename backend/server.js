const express = require('express');
const fs = require('fs');
const cors = require('cors');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const app = express();
app.use(cors());
app.use(express.json());

// 1. Save User to CSV
const userCsvWriter = createCsvWriter({
    path: 'users.csv',
    append: true,
    header: [
        {id: 'name', title: 'NAME'},
        {id: 'email', title: 'EMAIL'},
        {id: 'battalion', title: 'BATTALION'},
        {id: 'platoon', title: 'PLATOON'},
        {id: 'className', title: 'CLASS'}
    ]
});

app.post('/api/signup', async (req, res) => {
    try {
        await userCsvWriter.writeRecords([req.body]);
        res.status(200).send({ message: 'User saved to CSV' });
    } catch (err) {
        res.status(500).send(err);
    }
});

// 2. Save Poll to its own file
app.post('/api/create-poll', (req, res) => {
    const { title, questions, target } = req.body;
    const fileName = `./polls/poll_${Date.now()}.json`;
    
    // Create polls directory if not exists
    if (!fs.existsSync('./polls')) fs.mkdirSync('./polls');

    fs.writeFileSync(fileName, JSON.stringify(req.body, null, 2));
    res.status(200).send({ message: 'Poll file created' });
});

const unitsCsvWriter = createCsvWriter({
    path: 'units.csv',
    append: true,
    header: [
        {id: 'battalion', title: 'BATTALION'},
        {id: 'platoon', title: 'PLATOON'},
        {id: 'className', title: 'CLASS'}
    ]
});

// 2. Endpoint for Admin to save a new unit
app.post('/api/admin/add-unit', async (req, res) => {
    try {
        const { battalion, platoon, className } = req.body || {};
        // Require full hierarchy for a unit row
        if (!battalion || !platoon || !className) {
            return res.status(400).send({ error: 'battalion, platoon and className are required' });
        }
        // Normalize to strings
        const row = { battalion: String(battalion), platoon: String(platoon), className: String(className) };
        await unitsCsvWriter.writeRecords([row]);
        res.status(200).send({ message: 'Unit structure saved' });
    } catch (err) {
        res.status(500).send(err);
    }
});

// 3. Endpoint for Signup page to get all units
app.get('/api/units', (req, res) => {
    if (!fs.existsSync('units.csv')) {
        return res.json([]);
    }
    // Simple way to read CSV (for production, use a CSV parser library)
    const data = fs.readFileSync('units.csv', 'utf8');
    const lines = data.split('\n').slice(1); // skip header
    const units = lines.filter(line => line).map(line => {
        const [battalion, platoon, className] = line.split(',');
        return { battalion, platoon, className };
    });
    res.json(units);
});

app.listen(5000, () => console.log('Server running on port 5000'));