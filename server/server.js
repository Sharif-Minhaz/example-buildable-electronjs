const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const morgan = require("morgan");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan("dev"));

mongoose.connect(process.env.MONGODB_URI);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
	console.log("Connected to MongoDB");
});

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
	},
	email: { type: String, required: true },
	address: { type: String, required: true },
	age: { type: Number, required: true },
});

const User = mongoose.model("User", userSchema);

app.post("/users", async (req, res) => {
	try {
		const { username, email, address, age } = req.body;
		const user = await User.create({ username, email, address, age });
		res.status(201).json({ success: true, data: user });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: error.message });
	}
});

app.get("/users", async (req, res) => {
	try {
		const users = await User.find().lean();
		res.status(200).json({ success: true, data: users });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: error.message });
	}
});

app.delete("/users/:id", async (req, res) => {
	try {
		const { id } = req.params;
		await User.findByIdAndDelete(id);
		const users = await User.find().lean();
		res.status(200).json({ success: true, data: users });
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: error.message });
	}
});

app.post("/sync", async (req, res) => {
	try {
		const { users, deletedUsers = [] } = req.body;
		
		console.log('deletedUsers from server', deletedUsers);
		// First, delete any users that were deleted offline
		if (deletedUsers.length > 0) {
			await User.deleteMany({ _id: { $in: deletedUsers } });
		}

		const syncResults = [];
		// Process remaining users...
		for (const user of users) {
			let filter = {};
			let updateData = { ...user };
			delete updateData._id;

			if (user._id?.startsWith('temp_')) {
				filter = { username: user.username };
			} else if (mongoose.Types.ObjectId.isValid(user._id)) {
				filter._id = user._id;
			} else {
				filter = { username: user.username };
			}

			console.log('filter from server', filter);
			console.log('updateData from server', updateData);
			const result = await User.findOneAndUpdate(
				filter,
				updateData,
				{ upsert: true, new: true }
			);

			syncResults.push({
				oldId: user._id,
				newId: result._id,
				...result.toObject()
			});

			console.log('syncResults from server', syncResults);
		}

		res.status(200).json({
			success: true,
			message: "Users synced successfully",
			syncResults
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ success: false, error: error.message });
	}
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({ success: false, error: err.message });
});

app.listen(8080, () => {
	console.log("Server started on port 8080");
});
