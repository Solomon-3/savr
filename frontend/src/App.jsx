import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import CreateGoal from "./pages/CreateGoal";
import GoalDetail from "./pages/GoalDetail";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateGoal />} />
            <Route path="/goal/:id" element={<GoalDetail />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>Savr &mdash; Transparent Bitcoin savings on the Lightning Network</p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
