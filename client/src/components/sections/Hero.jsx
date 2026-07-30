import "./Hero.css";
import {
FaArrowRight,
FaBookOpen,
FaCheckCircle
} from "react-icons/fa";

function Hero(){

return(

<section className="hero">

<div className="hero-content">

<span className="badge">

OWASP TOP 10 LEARNING PLATFORM

</span>

<h1>

Learn <span>Web Security</span>

<br/>

Through Interactive Labs

</h1>

<p>

Practice SQL Injection, XSS, CSRF, IDOR, SSRF and more through interactive labs built for beginners.

</p>

<div className="hero-buttons">

<button className="primary">

Get Started

<FaArrowRight/>

</button>

<button className="secondary">

<FaBookOpen/>

Explore Labs

</button>

</div>

<div className="features">

<div>

<FaCheckCircle/>

10 Labs

</div>

<div>

<FaCheckCircle/>

Progress Tracking

</div>

<div>

<FaCheckCircle/>

Certificates

</div>

</div>

</div>

</section>

);

}

export default Hero;