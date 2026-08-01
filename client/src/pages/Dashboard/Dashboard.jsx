import "./Dashboard.css";

import {
  FaUserCircle,
  FaUserEdit,
  FaKey,
  FaHistory,
  FaClock,
  FaChartLine,
  FaSignOutAlt,
  FaCheckCircle,
} from "react-icons/fa";

function Dashboard() {
  // Temporary User Data
  // Later this comes from MongoDB

  const user = {
    username: "Teju",
    email: "teju@example.com",
    joined: "01 August 2026",
  };

  // Temporary Activity
  // Later from backend

  const activities = [
    {
      id: 1,
      text: "Completed SQL Injection Exercise",
      date: "Today",
    },
    {
      id: 2,
      text: "Completed SQL Injection Quiz",
      date: "Yesterday",
    },
    {
      id: 3,
      text: "Logged into SecureLearn",
      date: "Yesterday",
    },
  ];

  return (
    <div className="dashboard">

      {/* Header */}

      <section className="dashboard-header">

        <h1>Dashboard</h1>

        <p>
          Manage your account and monitor your
          learning activity.
        </p>

      </section>

      {/* Profile */}

      <section className="dashboard-card">

        <div className="card-title">

          <FaUserCircle />

          <h2>My Profile</h2>

        </div>

        <div className="profile-grid">

          <div className="profile-item">
            <span>Username</span>
            <h3>{user.username}</h3>
          </div>

          <div className="profile-item">
            <span>Email</span>
            <h3>{user.email}</h3>
          </div>

          <div className="profile-item">
            <span>Member Since</span>
            <h3>{user.joined}</h3>
          </div>

        </div>

      </section>

      {/* Account */}

      <section className="dashboard-card">

        <div className="card-title">

          <FaUserEdit />

          <h2>Account Settings</h2>

        </div>

        <div className="account-buttons">

          <button className="dashboard-btn">

            <FaUserEdit />

            Edit Profile

          </button>

          <button className="dashboard-btn">

            <FaKey />

            Change Password

          </button>

        </div>

      </section>

      {/* Learning Summary */}

      <section className="dashboard-card">

        <div className="card-title">

          <FaChartLine />

          <h2>Learning Summary</h2>

        </div>

        <div className="summary-grid">

          <div className="summary-box">

            <FaCheckCircle />

            <h3>1</h3>

            <p>Exercise Completed</p>

          </div>

          <div className="summary-box">

            <FaClock />

            <h3>2h 15m</h3>

            <p>Total Learning Time</p>

          </div>

          <div className="summary-box">

            <FaHistory />

            <h3>3</h3>

            <p>Quiz Attempts</p>

          </div>

        </div>

      </section>

      {/* Graph Placeholder */}

      <section className="dashboard-card">

        <div className="card-title">

          <FaChartLine />

          <h2>Weekly Learning</h2>

        </div>

        <div className="graph-placeholder">

          <p>

            Weekly Learning Graph

          </p>

          <small>

            Chart.js / Recharts will be connected here.

          </small>

        </div>

      </section>

      {/* Activity */}

      <section className="dashboard-card">

        <div className="card-title">

          <FaHistory />

          <h2>Recent Activity</h2>

        </div>

        <div className="activity-list">

          {activities.map((item) => (

            <div
              key={item.id}
              className="activity-item"
            >

              <div>

                <h4>{item.text}</h4>

                <small>{item.date}</small>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* Logout */}

      <section className="dashboard-card">

        <button className="logout-btn">

          <FaSignOutAlt />

          Logout

        </button>

      </section>

    </div>
  );
}

export default Dashboard;