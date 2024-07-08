import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import config from './config'; 

function App() {
  const [inputText, setInputText] = useState('');
  const [inputFile, setInputFile] = useState(null);
  const [responseMessage, setResponseMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleText = (e) => {
    setInputText(e.target.value);
  };

  const handleFile = (e) => {
    setInputFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(inputFile);
    reader.onload = async () => {
      const base64File = reader.result;
      try {
        const response = await axios.post(config.apiUrl, {
          inputText,
          inputFile: base64File,
        });
        setResponseMessage(response.data.message);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(error.response.data.message || 'An error occurred');
        setResponseMessage(null);
      } finally {
        setLoading(false);
      }
    };
  };

  return (
    <div className="app-container">
      <h1>Upload Form</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label>Text input:</label>
          <input type="text" value={inputText} onChange={handleText} required />
        </div>
        <div className="form-group">
          <label>File input:</label>
          <input type="file" onChange={handleFile} required />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Uploading...' : 'Submit'}
        </button>
      </form>
      {loading && <div className="loading-message">Uploading...</div>}
      {responseMessage && <div className="success-message">{responseMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
    </div>
  );
}

export default App;
