const path = require("path");
const { app } = require("electron");
const Database = require("better-sqlite3");

// Create/open the database in the user's data directory
const dbPath = path.join(app.getPath("userData"), "electro.db");
console.log(`Local database path: ${dbPath}`);
const db = new Database(dbPath);

// Create a table if it doesn't exist
db.prepare(
	`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
	_id TEXT UNIQUE,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT,
    age INTEGER
  )
`
).run();

// Create deleted_users table
db.prepare(`
    CREATE TABLE IF NOT EXISTS deleted_users (
        _id TEXT PRIMARY KEY,
        deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`).run();

module.exports = {
	getUsers: () => {
		const stmt = db.prepare("SELECT * FROM users");
		return stmt.all();
	},
	createUser: (user) => {
		const stmt = db.prepare(`
      INSERT INTO users (_id, username, email, address, age) VALUES (@_id, @username, @email, @address, @age)
    `);
		const info = stmt.run(user);
		return db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
	},
	deleteUser: (_id) => {
		const stmt = db.prepare("DELETE FROM users WHERE _id = ?");
		stmt.run(_id);
		return db.prepare("SELECT * FROM users").all();
	},
	updateUserId: (oldId, updatedUser) => {
		const stmt = db.prepare(`
            UPDATE users 
            SET _id = @newId,
                username = @username,
                email = @email,
                address = @address,
                age = @age
            WHERE _id = @oldId
        `);
		
		return stmt.run({
			oldId,
			newId: updatedUser.newId,
			username: updatedUser.username,
			email: updatedUser.email,
			address: updatedUser.address,
			age: updatedUser.age
		});
	},
	// Add deleted user to tracking table
	trackDeletedUser: (_id) => {
		const stmt = db.prepare('INSERT INTO deleted_users (_id) VALUES (?)');
		return stmt.run(_id);
	},
	// Get all deleted user IDs
	getDeletedUsers: () => {
		const stmt = db.prepare('SELECT _id FROM deleted_users');
		return stmt.all();
	},
	// Clear deleted user tracking after successful sync
	clearDeletedUsers: () => {
		const stmt = db.prepare('DELETE FROM deleted_users');
		return stmt.run();
	}
};
