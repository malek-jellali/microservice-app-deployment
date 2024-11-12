import React, { useState } from 'react';
import './styles/styles.scss';  // Ensure you have the correct path to your SCSS file

const App = () => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayData, setDisplayData] = useState({ url: '' });

  const handleApiCall = async (e) => {
    const url = 'http://localhost:9999/' + e.target.name;
    setDisplayData({ url });
    let options = {};
    try {
      setLoading(true);
      const res = await fetch(url, options);
      const json = await res.json();
      setResponse(json);
      setError(null);
    } catch (err) {
      setLoading(false);
      setError(err);
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="header">
        <h1>Web App</h1>
        <div className="subheading">Simple Microservice Application</div>
      </header>
      <div className="pt4 pb1">
        {/* Button container for centering */}
        <div className="button-container">
          <button name="shoe/shoes" onClick={handleApiCall}>Shoes</button>
          <button name="offer/offers" onClick={handleApiCall}>Offers</button>
          <button name="cart" onClick={handleApiCall}>Cart</button>
          <button name="wishlist" onClick={handleApiCall}>Wishlist</button>
        </div>
        <br />
        <div className="response-container">
          {response && (
            <>
              <p>API hit through API Gateway to <span className="api-url">{displayData.url}</span></p>
              <br />
              <p>--Response--</p>
              <h3>{JSON.stringify(response)}</h3>
            </>
          )}
        </div>
        <br />
        <div className="response-container">
          {error && (
            <>
              <p>API hit through API Gateway to <span className="api-url">{displayData.url}</span></p>
              <br />
              <p>--Error--</p>
              <div className="error-message">{JSON.stringify(error)}</div>
              <p>Probably one of the microservices is down</p>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default App;