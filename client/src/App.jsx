import Sidebar from "./components/layout/Sidebar";
import Hero from "./components/sections/Hero";
import "./App.css";

function App() {
  return (
    <>
      <Sidebar />

      <main className="main-content">
        <Hero />
      </main>
    </>
  );
}

export default App;