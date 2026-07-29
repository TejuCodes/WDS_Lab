import Navbar from "./components/layout/Navbar";
import Home from "./components/sections/Hero"
function App() {
  return (
    <>
      <Navbar />

      <main className="container" style={{ marginTop: "100px" }}>
        <h1>Welcome to SecureLearn</h1>
      </main>
      <Home/>
    </>
  );
}

export default App;