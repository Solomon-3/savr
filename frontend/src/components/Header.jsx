import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchNodeInfo } from "../api";

export default function Header() {
  const [node, setNode] = useState(null);

  useEffect(() => {
    fetchNodeInfo().then(setNode).catch(() => setNode(null));
  }, []);

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <span className="logo-icon">&#9889;</span>
          <span className="logo-text">Savr</span>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Goals</Link>
          <Link to="/create" className="nav-link btn-create">+ New Goal</Link>
        </nav>
      </div>
      {node && (
        <div className="node-status">
          Node: {node.alias} &middot; {node.channels} channels &middot; {Number(node.balance).toLocaleString()} sats
        </div>
      )}
    </header>
  );
}
