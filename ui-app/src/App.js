import React, { useState, useEffect } from 'react';
import './styles/styles.scss';

const App = () => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [displayData, setDisplayData] = useState({ url: '' });
  const [apiGatewayUrl, setApiGatewayUrl] = useState('');

  // Fetch Eureka service URL dynamically based on Kubernetes DNS resolution
  const getApiGatewayUrlFromEureka = async () => {
    try {
      // Eureka service name can be resolved using the service name in the Kubernetes cluster
      const eurekaServiceUrl = 'http://zuul-service:30200/eureka/apps/zuul'; // Use your Eureka service name here
      
      const response = await fetch(eurekaServiceUrl);
      const data = await response.json();
      
      // Find the API Gateway instance (usually named 'zuul' or 'api-gateway')
      const instances = data.applications.application[0].instance;
      if (instances && instances.length > 0) {
        const apiGatewayInstance = instances[0];
        setApiGatewayUrl(apiGatewayInstance.homePageUrl || apiGatewayInstance.ipAddr); // Get the URL or IP address of the API Gateway
        setDisplayData({ url: apiGatewayUrl });
      } else {
        console.error("No instances found for Zuul in Eureka");
      }
    } catch (err) {
      console.error("Error fetching API Gateway URL from Eureka: ", err);
      setError(err);
    }
  };

  // Function to get the API Gateway URL dynamically depending on where the app is running
  const getDynamicApiGatewayUrl = () => {
    // If running locally, use the local port for Zuul (e.g., 30200)
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:9999'; // Zuul's local port
    } else {
      // If running in Kubernetes (AWS), use the Eureka-based dynamic IP or hostname
      return apiGatewayUrl || 'http://zuul-service:9999'; // Default fallback if Eureka fails
    }
  };

  // Fetch the API Gateway URL from Eureka on component mount, if necessary
  useEffect(() => {
    if (window.location.hostname !== 'localhost') {
      getApiGatewayUrlFromEureka();
    }
  }, []);

  const handleApiCall = async (e) => {
    const apiGatewayUrl = getDynamicApiGatewayUrl(); // Dynamically get the API Gateway URL

    let url = `${apiGatewayUrl}/${e.target.name}`; // Construct the URL with service name (e.g., "shoe/shoes")
    setDisplayData({ url });

    try {
      setLoading(true);
      const res = await fetch(url);
      const json = await res.json();
      setResponse(json);
      setError(null); // Clear any previous errors
    } catch (err) {
      setLoading(false);
      setError(err);
      setResponse(null); // Clear previous response
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
        <div className="button-container">
          {/* Buttons for different services */}
          <button name="shoe/shoes" onClick={handleApiCall}>Shoes</button>
          <button name="offer/offers" onClick={handleApiCall}>Offers</button>
          <button name="cart" onClick={handleApiCall}>Cart</button>
          <button name="wishlist" onClick={handleApiCall}>Wishlist</button>
        </div>
        <br />
        <div className="response-container">
          {/* Display response data if available */}
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
          {/* Display error if any */}
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
