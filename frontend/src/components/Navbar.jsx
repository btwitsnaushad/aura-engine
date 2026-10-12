import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{ padding: '1rem', background: '#1e293b', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
      <h2 style={{ margin: 0 }}>Aura Engine</h2>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link>
        <Link to="/inventory" style={{ color: 'white', textDecoration: 'none' }}>Inventory</Link>
      </div>
    </nav>
  );
};

export default Navbar;