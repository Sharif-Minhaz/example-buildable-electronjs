# example-buildable-electronjs

The repository [example-buildable-electronjs](https://github.com/Sharif-Minhaz/example-buildable-electronjs) provides a comprehensive template for building cross-platform desktop applications using Electron.js, React, and Vite. It is configured to utilize Electron Forge for packaging and distribution, supporting both Windows and Linux platforms. If it runs on offline mode, it will use the SQLite database for data persistence and when it runs on online mode, it will use the default api to fetch data. Also user can synchronize data between offline and online mode. It also includes a preload script to establish a secure communication channel between the main and renderer processes.

**Key Features:**

-   **Electron.js Integration:** Leverages Electron.js to create native desktop applications with web technologies.
-   **React with Vite:** Utilizes React for building user interfaces, bundled efficiently with Vite for rapid development.
-   **SQLite Database Support:** Implements local data storage using SQLite via the `better-sqlite3` package, facilitating offline data persistence.
-   **Electron Forge Configuration:** Employs Electron Forge for streamlined packaging and distribution, with configurations tailored for both Windows and Linux builds.
-   **Preload Script with Context Bridge:** Uses a preload script to securely expose Node.js functionalities to the renderer process, ensuring a secure and efficient communication channel.

**Project Structure (client):**

-   **`electron.cjs`:** Main process script initializing the application, managing windows, and handling lifecycle events.
-   **`preload.js`:** Preload script that sets up a secure context bridge between the main and renderer processes.
-   **`App.jsx`:** React component serving as the entry point for the renderer process, managing UI and user interactions.
-   **`db.js`:** Module handling SQLite database operations, providing functions for data manipulation and retrieval.

**Getting Started:**

1. **Installation:** Clone the repository and install dependencies using `npm install`.
2. **Development:** Start the development environment with `npm start`, which concurrently runs the React application and Electron.
3. **Building:** Package the application for distribution using `npm run make`, generating installers for the target platforms (**Windows** and **Linux**).

**Server directory:** The server component of the application is located in the `server` directory. It provides APIs for data online modes. But you have to deploy it in your own server to expose it so that the desktop app can connect to it. Alternatively you can use the provided server base url in `example.env`

This template serves as a solid foundation for developers looking to create robust, offline-capable desktop applications with modern web technologies, streamlined for efficient development and distribution.
