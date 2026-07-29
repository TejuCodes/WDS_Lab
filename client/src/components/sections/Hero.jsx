import "./Hero.css";
import heroImage from "../../assets/hero.png";

import {
  FaArrowRight,
  FaBookOpen,
  FaShieldAlt,
  FaUsers,
} from "react-icons/fa";

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-container">

        {/* Left Side */}

        <div className="hero-content">

          <span className="hero-badge">
            <FaShieldAlt />
            OWASP Top 10 Learning Platform
          </span>

          <h1>
            Master <span>Web Security</span>
            <br />
            Through Interactive Labs
          </h1>

          <p>
            SecureLearn is an interactive MERN-based cybersecurity platform
            where students can practice web vulnerabilities, understand attack
            techniques, and learn secure coding in a safe environment.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">
              Get Started
              <FaArrowRight />
            </button>

            <button className="secondary-btn">
              <FaBookOpen />
              Explore Labs
            </button>
          </div>

          <div className="hero-stats">

            <div>
              <h3>10+</h3>
              <span>OWASP Labs</span>
            </div>

            <div>
              <h3>20+</h3>
              <span>Learning Modules</span>
            </div>

            <div>
              <h3>
                <FaUsers />
              </h3>
              <span>Student Progress</span>
            </div>

          </div>

        </div>

        {/* Right Side */}

        <div className="hero-image">
          <img src={heroImage} alt="SecureLearn Hero" />
        </div>

      </div>
    </section>
  );
}

export default Hero;