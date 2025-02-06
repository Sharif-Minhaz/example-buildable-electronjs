const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const dbModule = require("./db.cjs");

// IPC handler to fetch users
ipcMain.handle("db-get-users", async () => {
	try {
		return dbModule.getUsers();
	} catch (error) {
		console.error("Error fetching users:", error);
		throw error;
	}
});

// IPC handler to create a user
ipcMain.handle("db-create-user", async (event, user) => {
	try {
		return dbModule.createUser(user);
	} catch (error) {
		console.error("Error creating user:", error);
		throw error;
	}
});

// IPC handler to delete a user
ipcMain.handle("db-delete-user", async (event, id) => {
	try {
		return dbModule.deleteUser(id);
	} catch (error) {
		console.error("Error deleting user:", error);
		throw error;
	}
});

// IPC handler to update a user
ipcMain.handle("db-update-user", async (event, oldId, updatedUser) => {
	try {
		return dbModule.updateUserId(oldId, updatedUser);
	} catch (error) {
		console.error("Error updating user:", error);
		throw error;
	}
});

ipcMain.handle("db-track-deleted", async (event, id) => {
	try {
		return dbModule.trackDeletedUser(id);
	} catch (error) {
		console.error("Error tracking deleted user:", error);
		throw error;
	}
});

ipcMain.handle("db-get-deleted", async () => {
	try {
		return dbModule.getDeletedUsers();
	} catch (error) {
		console.error("Error getting deleted users:", error);
		throw error;
	}
});

ipcMain.handle("db-clear-deleted", async () => {
	try {	
		return dbModule.clearDeletedUsers();
	} catch (error) {
		console.error("Error clearing deleted users:", error);
		throw error;
	}
});


let mainWindow;
let splash;

// run this as early in the main process as possible
if (require("electron-squirrel-startup")) app.quit();

app.whenReady().then(() => {
	// Create Splash Screen
	splash = new BrowserWindow({
		width: 810,
		height: 610,
		transparent: true,
		frame: false,
		alwaysOnTop: true,
		icon: path.join(__dirname, "images", "list"),
	});

	// Load splash screen HTML
	splash.loadFile(path.join(__dirname, "dist", "splash.html"));

	// Create Main Window (but keep it hidden initially)
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		show: false,
		icon: path.join(__dirname, "images", "list"),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, 'preload.cjs'),
			// Add these to help with debugging
			devTools: true,
			sandbox: false
		},
	});

	// Load Main App after splash screen
	mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));

	// Once the main window is ready, close the splash screen and show the main window
	mainWindow.once("ready-to-show", () => {
		splash.destroy();
		mainWindow.show();
	});
});

// Quit app when all windows are closed (except macOS)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
