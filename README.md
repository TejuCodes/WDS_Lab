# WDS_Lab

An interactive MERN-based cybersecurity learning platform for mastering **OWASP Top 10 web vulnerabilities** through hands-on labs, guided explanations, quizzes, and progress tracking.

The platform is designed to provide a safe and practical environment where learners can understand how common web vulnerabilities work, practice exploiting them in isolated labs, and learn how to mitigate them.

---

## 🚀 Features

* 🛡️ **OWASP Top 10 Learning**

  * Learn about common web application vulnerabilities.
  * Understand how vulnerabilities occur and why they matter.

* 🧪 **Hands-on Security Labs**

  * Practice vulnerabilities in controlled environments.
  * Experiment with attacks without interacting with real-world systems.

* 📚 **Guided Explanations**

  * Step-by-step explanations for each vulnerability.
  * Learn both exploitation and remediation techniques.

* 🧠 **Interactive Quizzes**

  * Test your understanding after completing learning modules.
  * Reinforce important cybersecurity concepts.

* 📊 **Progress Tracking**

  * Track completed labs and learning progress.
  * Monitor your development through the platform.

* 📰 **Cybersecurity News**

  * Live cybersecurity news through RSS feeds.
  * Stay updated with current vulnerabilities, threats, and security research.

* 🔐 **Authentication**

  * User registration and login.
  * Protected learning progress and user-specific data.

* 🎯 **Learning Dashboard**

  * Centralized view of labs, modules, and progress.

---

## 🛠️ Tech Stack

### Frontend

* React
* React Router
* CSS
* Vite
* React Icons

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcrypt
* RSS Parser

### Security

* OWASP Top 10
* Sandboxed vulnerability labs
* Input validation
* Authentication and authorization
* Secure password hashing

---

## 🏗️ Project Structure

```text
WDS_Lab/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── routes.js
│   ├── server.js
│   ├── models.js
│   ├── middleware.js
│   ├── package.json
│   └── .env
│
├── LICENSE
└── README.md
```

---

## ⚙️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/TejuCodes/WDS_Lab.git
cd WDS_Lab
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

Open another terminal:

```bash
cd backend
npm install
```

---

## 🔑 Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/webvuln_learn
JWT_SECRET=your_secure_jwt_secret
```

> Never commit your `.env` file or expose private credentials in the repository.

---

## ▶️ Running the Project

### Start the backend

From the `backend` directory:

```bash
npm run dev
```

The backend will normally run at:

```text
http://localhost:5000
```

### Start the frontend

From the `frontend` directory:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

## 🧪 Cybersecurity Labs

WDS_Lab focuses on practical learning through controlled vulnerability labs.

The platform is designed around concepts from the **OWASP Top 10**, allowing learners to study vulnerabilities such as:

* SQL Injection
* Cross-Site Scripting (XSS)
* Broken Access Control
* Cryptographic Failures
* Authentication Failures
* Security Misconfiguration
* Server-Side Request Forgery (SSRF)
* Software Supply Chain Failures
* Injection-related vulnerabilities
* Other common web security issues

Each lab is intended for **educational and authorized testing purposes only**.

---

## 📰 Cybersecurity News

WDS_Lab includes a live cybersecurity news section powered by RSS feeds.

The backend retrieves cybersecurity articles and converts them into JSON for the React frontend.

```text
RSS Feed
   ↓
Node.js Backend
   ↓
/api/news
   ↓
React News Page
```

This approach avoids requiring a third-party news API key in the frontend.

---

## 🔒 Security Notice

WDS_Lab is intended for **education, experimentation, and authorized security testing**.

Only use the techniques demonstrated by the platform against:

* Your own applications
* The provided labs
* Systems where you have explicit authorization to test

Do not use the platform or the techniques learned from it to attack systems without permission.

---

## 📈 Project Goals

The main goals of WDS_Lab are to:

1. Make web security easier to understand.
2. Provide practical cybersecurity experience.
3. Teach both exploitation and remediation.
4. Encourage secure web application development.
5. Provide a safe environment for security experimentation.
6. Help learners build practical OWASP knowledge.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### Basic workflow

```bash
git clone https://github.com/TejuCodes/WDS_Lab.git
cd WDS_Lab

git checkout -b feature/your-feature

# Make your changes

git add .
git commit -m "Add your feature"

git push origin feature/your-feature
```

Then open a Pull Request.

---

## 📜 License

This project is licensed under the **MIT License**.

See the [`LICENSE`](LICENSE) file for the complete license text.

---

## 👨‍💻 Author

**TEJASHWIN S**

GitHub: [@TejuCodes](https://github.com/TejuCodes)

---

## ⭐ Support

If you find WDS_Lab useful for learning web security, consider giving the repository a ⭐ on GitHub.

---

**WDS_Lab — Learn. Exploit. Understand. Secure.**
