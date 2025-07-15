const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.')));

const db = new sqlite3.Database('allergen_tracker.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS meals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS meal_allergens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meal_id INTEGER NOT NULL,
        allergen TEXT NOT NULL,
        FOREIGN KEY (meal_id) REFERENCES meals (id)
    )`);
});

app.get('/api/meals', (req, res) => {
    const query = `
        SELECT m.id, m.date, m.created_at,
               GROUP_CONCAT(ma.allergen) as allergens
        FROM meals m
        LEFT JOIN meal_allergens ma ON m.id = ma.meal_id
        GROUP BY m.id, m.date, m.created_at
        ORDER BY m.date DESC
    `;
    
    db.all(query, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const meals = rows.map(row => ({
            id: row.id,
            date: row.date,
            created_at: row.created_at,
            allergens: row.allergens ? row.allergens.split(',') : []
        }));
        
        res.json(meals);
    });
});

app.post('/api/meals', (req, res) => {
    const { allergens, date: customDate } = req.body;
    const date = customDate ? new Date(customDate).toISOString() : new Date().toISOString();
    
    if (!allergens || allergens.length === 0) {
        res.status(400).json({ error: 'At least one allergen must be selected' });
        return;
    }
    
    db.run('INSERT INTO meals (date) VALUES (?)', [date], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const mealId = this.lastID;
        const allergenInserts = allergens.map(allergen => 
            new Promise((resolve, reject) => {
                db.run('INSERT INTO meal_allergens (meal_id, allergen) VALUES (?, ?)', 
                    [mealId, allergen], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            })
        );
        
        Promise.all(allergenInserts)
            .then(() => {
                res.json({ 
                    id: mealId, 
                    date: date,
                    allergens: allergens,
                    message: 'Meal saved successfully' 
                });
            })
            .catch(err => {
                res.status(500).json({ error: err.message });
            });
    });
});

app.put('/api/meals/:id', (req, res) => {
    const mealId = req.params.id;
    const { date } = req.body;
    
    if (!date) {
        res.status(400).json({ error: 'Date is required' });
        return;
    }
    
    db.run('UPDATE meals SET date = ? WHERE id = ?', [date, mealId], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Meal not found' });
            return;
        }
        
        res.json({ message: 'Meal updated successfully', id: mealId, date: date });
    });
});

app.delete('/api/meals/:id', (req, res) => {
    const mealId = req.params.id;
    
    db.serialize(() => {
        db.run('DELETE FROM meal_allergens WHERE meal_id = ?', [mealId], (err) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            db.run('DELETE FROM meals WHERE id = ?', [mealId], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                if (this.changes === 0) {
                    res.status(404).json({ error: 'Meal not found' });
                    return;
                }
                
                res.json({ message: 'Meal deleted successfully' });
            });
        });
    });
});

app.get('/api/allergen-status', (req, res) => {
    const allergens = ['peanuts', 'tree-nuts', 'milk', 'egg-whites', 'egg-yolks', 'soy', 'wheat', 'fish', 'shellfish', 'sesame'];
    
    const query = `
        SELECT ma.allergen, MAX(m.date) as last_date
        FROM meal_allergens ma
        JOIN meals m ON ma.meal_id = m.id
        WHERE ma.allergen IN (${allergens.map(() => '?').join(',')})
        GROUP BY ma.allergen
    `;
    
    db.all(query, allergens, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const now = new Date();
        const status = allergens.map(allergen => {
            const allergenData = rows.find(row => row.allergen === allergen);
            
            if (!allergenData) {
                return {
                    name: allergen,
                    timeSince: 'Never given',
                    status: 'never',
                    daysSince: Infinity
                };
            }
            
            const lastDate = new Date(allergenData.last_date);
            const timeDiff = now - lastDate;
            const daysSince = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hoursSince = Math.floor(timeDiff / (1000 * 60 * 60));
            
            let timeSince;
            if (hoursSince < 24) {
                if (hoursSince === 0) {
                    timeSince = 'Less than 1 hour ago';
                } else if (hoursSince === 1) {
                    timeSince = '1 hour ago';
                } else {
                    timeSince = `${hoursSince} hours ago`;
                }
            } else if (daysSince === 1) {
                timeSince = '1 day ago';
            } else if (daysSince < 7) {
                timeSince = `${daysSince} days ago`;
            } else if (daysSince < 14) {
                timeSince = '1 week ago';
            } else if (daysSince < 21) {
                timeSince = `${Math.floor(daysSince / 7)} weeks ago`;
            } else {
                timeSince = `${Math.floor(daysSince / 7)} weeks ago`;
            }
            
            let statusClass;
            if (daysSince <= 3) {
                statusClass = 'safe';
            } else if (daysSince <= 6) {
                statusClass = 'warning';
            } else {
                statusClass = 'danger';
            }
            
            return {
                name: allergen,
                timeSince: timeSince,
                status: statusClass,
                daysSince: daysSince
            };
        });
        
        const sortedStatus = status.sort((a, b) => {
            // Never-given items (Infinity daysSince) go to the bottom
            if (a.daysSince === Infinity && b.daysSince === Infinity) return 0;
            if (a.daysSince === Infinity) return 1;
            if (b.daysSince === Infinity) return -1;
            
            // For items that have been given, sort by oldest first (highest daysSince)
            return b.daysSince - a.daysSince;
        });
        res.json(sortedStatus);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Food Allergen Tracker running on:`);
    console.log(`  - Local:    http://localhost:${port}`);
    console.log(`  - Network:  http://[YOUR_IP_ADDRESS]:${port}`);
    console.log(`\nTo find your IP address, run:`);
    console.log(`  - macOS/Linux: ifconfig | grep "inet " | grep -v 127.0.0.1`);
    console.log(`  - Windows: ipconfig | findstr "IPv4"`);
});

// Keep-alive settings for better network resilience
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Heartbeat to prevent idle disconnections
setInterval(() => {
    console.log(`[${new Date().toISOString()}] Server heartbeat - keeping alive`);
}, 300000); // Every 5 minutes

process.on('SIGINT', () => {
    db.close();
    process.exit();
});