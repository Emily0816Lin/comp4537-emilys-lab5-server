// Disclosure: I used ChatGPT to assist with the content of this assignment.

const http = require('http');
const mysql = require('mysql2');
const url = require('url');
const messages = require('./lang/en/en'); // Import the messages
const port = process.env.PORT || 3000; // Use the Heroku-assigned port if available, otherwise default to 3000

// Database class for managing MySQL connection and queries
class Database {
    constructor() {
        this.db = mysql.createConnection({
            host: 'zj2x67aktl2o6q2n.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
            user: 'e72hw5599nadybng',
            password: 'ek1g35pc8itb0xm8',
            database: 'eo3ysjp1m3pfhh64'
        });

        this.connectToDatabase();
    }

    connectToDatabase() {
        this.db.connect((err) => {
            if (err) {
                console.error('Error connecting to MySQL:', err);
                throw err;
            }
            console.log('MySQL connected...');
            this.createTable();
        });
    }

    createTable() {
        const createTable = `CREATE TABLE IF NOT EXISTS patient (
            patientid INT(11) AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            dateOfBirth DATETIME
        ) ENGINE=INNODB;`;

        this.db.query(createTable, (err, result) => {
            if (err) {
                console.error('Error creating table:', err);
                throw err;
            }
            console.log("Table created or exists.");
        });
    }

    executeQuery(query, callback) {
        this.db.query(query, (err, result) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, result);
        });
    }
}

// Server class for handling HTTP requests and responses
class Server {
    constructor(database) {
        this.database = database;
    }

    start() {
        http.createServer((req, res) => {
            console.log(`Incoming request: ${req.method} ${req.url}`);

            // Set CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');  // Allow all origins
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            // Handle OPTIONS (preflight) requests
            if (req.method === 'OPTIONS') {
                console.log('OPTIONS request, sending 204 No Content');
                res.writeHead(204);
                res.end();
                return;
            }

            this.handleRequest(req, res);

        }).listen(port, () => {
            console.log(`Server running at http://localhost:${port}/`);
        });
    }

    handleRequest(req, res) {
        let parsedUrl = url.parse(req.url, true);
        const pathname = decodeURIComponent(parsedUrl.pathname); // Decode the pathname
        console.log(`Parsed URL: ${pathname}`);

        // Regular expression to match the expected URL pattern
        const regex = /\/lab5\/api\/v1\/sql\/"(.*)"/;
        const match = pathname.match(regex);

        // If the server URL matches the expected pattern
        if (match) {
            let query = match[1]; // Extract the query from the match
            console.log(`Matched SQL query: ${query}`);

            if (this.isForbiddenQuery(query)) {
                this.blockForbiddenQuery(res);  
            } else {
                this.handleQuery(query, res);
            }
        // If the client sends a request to /lab5/api/v1/sql
        } else if (parsedUrl.pathname === '/lab5/api/v1/sql') { 
            this.handleApiRequest(req, res, parsedUrl);
        } else {
            console.log('404 Not Found - Invalid endpoint');
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: messages.errors.endpointNotFound }));
        }
    }

    handleApiRequest(req, res, parsedUrl) {
        let query;

        // Handle GET requests
        if (req.method === 'GET') {
            query = parsedUrl.query.query;
            console.log(`GET request with query: ${query}`);

            if (!query) {
                console.log('No query provided in GET request');
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: messages.errors.missingQuery }));
                return;
            }

            if (this.isForbiddenQuery(query)) {
                this.blockForbiddenQuery(res);
            } else {
                this.handleQuery(query, res);
            }
        }
        // Handle POST requests
        else if (req.method === 'POST') {
            console.log('POST request received');
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', () => {
                const bodyData = JSON.parse(body);
                query = bodyData.query;
                console.log(`POST request with query: ${query}`);

                if (!query) {
                    console.log('No query provided in POST request');
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: messages.errors.missingQuery }));
                    return;
                }

                if (this.isForbiddenQuery(query)) {
                    this.blockForbiddenQuery(res);
                } else {
                    this.handleQuery(query, res);
                }
            });
        } else {
            console.log('Unsupported HTTP method');
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: messages.errors.endpointNotFound }));
        }
    }

    handleQuery(query, res) {
        console.log(`Handling query: ${query}`);

        this.database.executeQuery(query, (err, result) => {
            if (err) {
                console.error('Error executing query:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: messages.errors.sqlError.replace('%1', err.message) }));
                return;
            }
            console.log('Query executed successfully:', result);

            let successMessage;
            if (query.toLowerCase().includes('insert')) {
                successMessage = messages.success.dataInserted;
            } else {
                successMessage = messages.success.dataRetrieved;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: successMessage,
                data: result
            }));
        });
    }

    isForbiddenQuery(query) {
        return /drop|delete|update/i.test(query);
    }

    blockForbiddenQuery(res) {
        console.log('Blocked dangerous SQL query');
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            error: messages.errors.sqlForbidden
        }));
    }
}

// Create instances and start the server
const database = new Database();
const server = new Server(database);
server.start();
