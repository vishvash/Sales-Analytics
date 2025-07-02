import React, { useMemo } from 'react';
import './Loader.css';

const quotes = [
  "Data is the new oil. – Clive Humby",
  "Without data, you're just another person with an opinion. – W. Edwards Deming",
  "In God we trust. All others must bring data. – W. Edwards Deming",
  "The goal is to turn data into information, and information into insight. – Carly Fiorina",
  "Data science is the art of turning data into actions.",
  "Numbers have an important story to tell. They rely on you to give them a clear and convincing voice. – Stephen Few",
  "Data beats emotions. – Sean Rad",
  "Big data is at the foundation of all the megatrends that are happening. – Chris Lynch",
  "Data is a precious thing and will last longer than the systems themselves. – Tim Berners-Lee",
  "The world is now awash in data and we can see consumers in a lot clearer ways. – Max Levchin"
];

const Loader = () => {
  // Pick a random quote on each render
  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);
  return (
    <div className="loader">
      <div className="spinner"></div>
      <div className="quote">{quote}</div>
    </div>
  );
};

export default Loader;
