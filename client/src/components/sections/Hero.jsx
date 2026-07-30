import "./Hero.css";
import { FaArrowRight, FaBookOpen, FaCheckCircle } from "react-icons/fa";

function Hero() {
  return (
    <section className="hero">

      <div className="container hero-content">

        <span className="hero-badge">
          OWASP TOP 10 LEARNING PLATFORM
        </span>

        <h1>
          Learn <span>Web Security</span>
          <br />
          Through Interactive Labs
        </h1>

        <p>
          Master web vulnerabilities through practical exercises,
          interactive challenges, quizzes, and secure coding practices
          designed for beginners and aspiring cybersecurity professionals.
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

        <div className="hero-features">

          <div>
            <FaCheckCircle />
            <span>10 Interactive Labs</span>
          </div>

          <div>
            <FaCheckCircle />
            <span>Progress Tracking</span>
          </div>

          <div>
            <FaCheckCircle />
            <span>Beginner Friendly</span>
          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;