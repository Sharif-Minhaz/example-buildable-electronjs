const { contextBridge, ipcRenderer } = require("electron");

// Add more verbose logging
console.log("Preload script starting...");

try {
	contextBridge.exposeInMainWorld("dbAPI", {
		getUsers: () => {
			console.log("Calling getUsers...");
			return ipcRenderer.invoke("db-get-users");
		},
		createUser: (user) => {
			console.log("Calling createUser...", user);
			return ipcRenderer.invoke("db-create-user", user);
		},
		deleteUser: (id) => {
			console.log("Calling deleteUser...", id);
			return ipcRenderer.invoke("db-delete-user", id);
		},
		updateUserId: (oldId, updatedUser) => {
			console.log("Calling updateUser...", { oldId, updatedUser });
			return ipcRenderer.invoke("db-update-user", oldId, updatedUser);
		},
		trackDeletedUser: (id) => {
			console.log("Tracking deleted user:", id);
			return ipcRenderer.invoke("db-track-deleted", id);
		},
		getDeletedUsers: () => {
			console.log("Getting deleted users");
			return ipcRenderer.invoke("db-get-deleted");
		},
		clearDeletedUsers: () => {
			console.log("Clearing deleted users tracking");
			return ipcRenderer.invoke("db-clear-deleted");
		}
	});
	console.log("dbAPI exposed successfully");
} catch (error) {
	console.error("Error in preload script:", error);
}
