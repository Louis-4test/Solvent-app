import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./Transfer.css";

const Transfer = () => {
  const { type } = useParams(); // Get transfer type from URL params
  const [amount, setAmount] = useState("");

  const handleTransfer = (e) => {
    e.preventDefault();
    alert(`Transferred ${amount} XAF via ${type}`);
  };

  return (
    <div className="transfer-container">
      <div className="transfer-card">
        <h2 className="text-2xl font-semibold mb-4">Fund Transfer</h2>
        
        <select value={type} disabled>
          <option value="bank-to-momo">Bank to Momo</option>
          <option value="momo-to-bank">Momo to Bank</option>
        </select>

        <input 
          type="number" 
          placeholder="Enter Amount" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
        />

        <button className="transfer-button" onClick={handleTransfer}>Transfer</button>
        
        <Link to="/" className="text-blue-500 block text-center mt-4">⬅️ Back to Dashboard</Link>
      </div>
    </div>
  );
};

export default Transfer;
