import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import App from './App';  // Make sure you import the App component correctly

test('renders App component', () => {
  render(<App />);
  const linkElement = screen.getByText(/Web App/i);  // Match the actual text in your App component
  expect(linkElement).toBeInTheDocument();
});
