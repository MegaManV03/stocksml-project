// pages/About.jsx
import React from 'react';
import './About.css';

export default function About() {
  return (
    <div className="about-container">
      <h1 className="about-main-title">From Idea to AI-Powered Predictions</h1>
      
      {/* Block 1 - Text left, Image right */}
      <div className="about-block">
        <div className="block-text">
          <h2>Building the Foundation</h2>
          <p>
            This project began as an academic exercise where I built a three-level database hierarchy of sectors,
            companies, and stock prices using FastAPI and SQLAlchemy.
            I implemented JWT authentication to secure the API endpoints and manage user sessions.
            The database was populated with real stock data pulled from yfinance,
            creating a foundation for financial data exploration.
          </p>
          <p>
            Later, I developed a React frontend to visualize the data and initially deployed everything on
             Railway to make it accessible online. What started as a straightforward data structuring
              project eventually grew as I became more interested in exploring what else I could build
               with the financial data I was collecting.
          </p>
        </div>
        <div className="block-image">
          <img src="/images/about1img.png" alt="AI Predictions Visualization" />
        </div>
      </div>

      {/* Block 2 - Image left, Text right */}
      <div className="about-block">
        <div className="block-text">
          <h2>Automated Data Collection</h2>
          <p>
            I had previous experience working with APIs, so I decided to build an automated
             scraping system for this project. The scraper checks the latest data in my database
              for each company and timeframe, then downloads only the missing rows from yfinance.
               New data is inserted directly into the database, keeping it continuously updated with
                fresh market information that can later be pulled for peak detection and model predictions.
          </p>
        </div>
        <div className="block-image">
          <img src="/images/about2img.png" alt="Chart Analysis" />
        </div>
      </div>

      {/* Block 3 - Text left, Image right */}
      <div className="about-block">
        <div className="block-text">
          <h2>Peak Detection & Data Labeling</h2>
          <p>
            The scraper has now pulled over one million rows of data, which I loaded into Jupyter notebooks for analysis.
             I developed a peak detection system that first calculates percentage changes over a rolling window,
              then identifies positive and negative peaks based on a threshold. To avoid duplicate peaks clumped together,
               I wrote custom logic that walks through the data and keeps only the strongest peak within a local region.
                This cleaned dataset with labeled peaks became the foundation for training my transformer models,
            as it allowed me to measure whether
            predictions successfully caught real price movements.
          </p>
        </div>
        <div className="block-image">
          <img src="/images/about3img.png" alt="Timeframe Options" />
        </div>
      </div>
      <div className="about-block">
        <div className="block-text">
          <h2>Training Transformer Models</h2>
          <p>
            I trained separate transformer models for each timeframe using PyTorch, with distinct models for positive and negative peaks that output probability scores for each prediction window. I implemented custom peak-level validation after discovering that standard accuracy metrics inflated results due to class imbalance, since most windows do not contain peaks. This peak-level approach measures peaks caught versus false signals, giving an honest picture of real-world performance. The validation results guided threshold optimization to maximize F1 scores for each model, ensuring the probability cutoffs used in production actually catch meaningful peaks.
          </p>
        </div>
        <div className="block-image">
          <img src="/images/about4img.png" alt="Timeframe Options" />
        </div>
      </div>
      <div className="about-block">
        <div className="block-text">
          <h2>Automated Prediction Pipeline</h2>
          <p>
            The scheduler runs every 5, 15, 30, and 60 minutes. It first scrapes any missing stock data from yfinance and adds it to the database. Then it checks which price rows don't have predictions yet, creates 50-candle sequences from those rows, runs them through the trained models, and stores the resulting buy/sell probability scores in the database.
          </p>
        </div>
        <div className="block-image">
          <img src="/images/about5img.png" alt="Timeframe Options" />
        </div>
      </div>
      <div className="about-block">
        <div className="block-text">
          <h2>Interactive Visualization & Deployment</h2>
          <p>
            For the frontend, I updated the existing React application with a dark and neutral color scheme and integrated interactive candlestick charts using Lightweight Charts. The charts display stock price data and overlay the prediction probabilities, with green lines showing buy confidence and red lines showing sell confidence.
          </p>
          <p>
            Finally, I deployed everything on a VPS by connecting via SSH, setting up the environment, and configuring the server to run the FastAPI backend and serve the React frontend with HTTPS using a custom domain.
          </p>
        </div>
        <div className="block-image">
          <img src="/images/about6img.png" alt="Timeframe Options" />
        </div>
      </div>
    </div>
  );
}