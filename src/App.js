import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import PendingObjectsPage from "./pages/pendingObjectsPage";
import NonDepositedObjectsPage from "./pages/nonDepositedObjectsPage";
import ArchiveObjectsPage from "./pages/archiveObjectsPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginAdmin />} />
          <Route path="/login" element={<LoginAdmin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pending-objects" element={<PendingObjectsPage />} />
          <Route path="/non-deposited" element={<NonDepositedObjectsPage />} />
          <Route path="/archive" element={<ArchiveObjectsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
