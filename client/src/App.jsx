import { useEffect, useState } from "react";
import "./App.css";
import appLogo from "./assets/react.svg";

const BASE_URL = import.meta.env.VITE_BASE_URL;

function App() {
	const [formData, setFormData] = useState({ username: "", email: "", address: "", age: null });
	const [users, setUsers] = useState([]);
	const [isLoading, setIsLoading] = useState(false);

	const [isOnline, setIsOnline] = useState(navigator.onLine);

	useEffect(() => {
		const updateOnlineStatus = () => setIsOnline(navigator.onLine);

		window.addEventListener("online", updateOnlineStatus);
		window.addEventListener("offline", updateOnlineStatus);

		return () => {
			window.removeEventListener("online", updateOnlineStatus);
			window.removeEventListener("offline", updateOnlineStatus);
		};
	}, []);

	useEffect(() => {
		setIsLoading(true);
		if (isOnline) {
			// fetch from remote API
			fetch(`${BASE_URL}/users`)
				.then((res) => res.json())
				.then((data) => setUsers(data.data || []))
				.catch((err) => console.log(err))
				.finally(() => setIsLoading(false));
		} else {
			// offline: get users from local SQLite via IPC
			console.log("Checking if dbAPI exists:", !!window.dbAPI);
			if (!window.dbAPI) {
				console.error("dbAPI is not available!");
				setIsLoading(false);
				return;
			}

			window.dbAPI
				.getUsers()
				.then((localUsers) => {
					console.log("Got local users:", localUsers);
					setUsers(localUsers);
				})
				.catch((err) => {
					console.error("Error fetching local users:", err);
				})
				.finally(() => setIsLoading(false));
		}
	}, []);

	const handleDelete = async (id) => {
		if (isOnline) {
			fetch(`${BASE_URL}/users/${id}`, { method: "DELETE" })
				.then((res) => res.json())
				.then((data) => {
					setUsers(data.data || []);
					window.dbAPI.deleteUser(id);
				})
				.catch((err) => console.log(err));
		} else {
			// offline: delete locally and track deletion
			try {
				await window.dbAPI.deleteUser(id);
				if (!id.startsWith("temp_")) {
					await window.dbAPI.trackDeletedUser(id);
				}
				setUsers((prev) => prev.filter((user) => user._id !== id));
			} catch (err) {
				console.log(err);
			}
		}
	};

	const handleChange = (e) => {
		setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (isOnline) {
			// Online: Create in MongoDB first, then SQLite
			fetch(`${BASE_URL}/users`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			})
				.then((res) => res.json())
				.then((data) => {
					// Now we have the MongoDB _id in data.data
					setUsers((prev) => {
						setFormData({ username: "", email: "", address: "", age: "" });
						return [...prev, data.data];
					});
					// Pass the complete data including _id to local DB
					window.dbAPI.createUser(data.data);
				})
				.catch((err) => console.log(err));
		} else {
			// Offline: Create in SQLite with a temporary _id
			const offlineUser = {
				...formData,
				_id: `temp_${crypto.randomUUID()}`, // Generate temporary _id
			};

			window.dbAPI
				.createUser(offlineUser)
				.then((newUser) => {
					setUsers((prev) => {
						setFormData({ username: "", email: "", address: "", age: "" });
						return [...prev, newUser];
					});
				})
				.catch((err) => console.log(err));
		}
	};

	const handleSync = async () => {
		try {
			// Get local users and deleted users
			const [localUsers, deletedUsers] = await Promise.all([
				window.dbAPI.getUsers(),
				window.dbAPI.getDeletedUsers(),
			]);

			const res = await fetch(`${BASE_URL}/sync`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					users: localUsers,
					deletedUsers: deletedUsers.map((du) => du._id),
				}),
			});
			const data = await res.json();

			if (data.success) {
				// Update local records with new MongoDB IDs
				for (const result of data.syncResults) {
					if (result.oldId?.startsWith("temp_")) {
						await window.dbAPI.updateUserId(result.oldId, {
							newId: result._id,
							username: result.username,
							email: result.email,
							address: result.address,
							age: result.age,
						});
					}
				}

				// Clear the deleted users tracking after successful sync
				await window.dbAPI.clearDeletedUsers();

				setUsers(data.syncResults);
				alert("Data synced successfully!");
			} else {
				alert("Sync failed! Please try again later.");
			}
		} catch (error) {
			console.error("Error syncing data:", error);
			alert("Sync failed! Please try again later.");
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="flex items-center gap-2">
					<svg
						className="mr-3 -ml-1 size-5 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
					>
						<circle
							className="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							strokeWidth="4"
						></circle>
						<path
							className="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<span className="text-2xl font-bold">Loading...</span>
				</div>
			</div>
		);
	}

	return (
		<main className="relative prose grid md:grid-cols-2 grid-cols-1 !max-w-full w-full px-5 gap-8">
			<div className={`absolute -top-3 right-2 ${!isOnline && "grayscale"}`}>
				<img className="w-[70px] h-[70px]" src={appLogo} alt="logo" />
			</div>
			<div className="w-full">
				<h2>Create User</h2>
				<form className="flex flex-col gap-2" onSubmit={handleSubmit}>
					<input
						onChange={handleChange}
						value={formData.username}
						name="username"
						required
						type="text"
						placeholder="Username"
					/>
					<input
						onChange={handleChange}
						value={formData.email}
						name="email"
						required
						type="email"
						placeholder="Email"
					/>
					<input
						onChange={handleChange}
						value={formData.address}
						name="address"
						required
						type="text"
						placeholder="Address"
					/>
					<input
						onChange={handleChange}
						value={formData.age ?? ""}
						name="age"
						required
						type="number"
						placeholder="Age"
					/>
					<div className="flex items-center gap-2.5">
						<button
							className="border bg-blue-800 text-white max-w-[200px] px-4 h-[40px] rounded-xl"
							type="submit"
						>
							Submit
						</button>
						<button
							type="button"
							disabled={!isOnline}
							className="disabled:opacity-50 disabled:cursor-not-allowed border bg-green-800 text-white max-w-[200px] px-4 h-[40px] rounded-xl"
							onClick={handleSync}
						>
							Sync Data
						</button>
					</div>
				</form>
			</div>
			<div className="w-full">
				<h2>User Information</h2>
				<table>
					<thead>
						<tr>
							<th>Username</th>
							<th>Email</th>
							<th>Address</th>
							<th>Age</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{users.length > 0 &&
							users?.map((user) => (
								<tr key={user?._id}>
									<td>{user?.username}</td>
									<td>{user?.email}</td>
									<td>{user?.address}</td>
									<td>{user?.age}</td>
									<td>
										<button
											className="border bg-red-800 text-white w-[100px] py-2 rounded-xl"
											onClick={() => handleDelete(user?._id)}
										>
											Delete
										</button>
									</td>
								</tr>
							))}
					</tbody>
				</table>
			</div>
		</main>
	);
}

export default App;
