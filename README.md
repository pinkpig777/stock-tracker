# Asset Dashboard

A modern, secure, and beautiful dashboard to track your stock portfolio and asset allocation in real-time. Built with **React** and **Supabase**, featuring live market data powered by **Finnhub**.

## ✨ Features

- **Strict Authentication**: Secure Magic Link login via Supabase.
- **Real-Time Data**: Live stock prices updated from Finnhub API.
- **Smart Validation ("The Guard")**: Automatically validates stock symbols before adding them to your portfolio to prevent bad data.
- **Asset Allocation V3**:
    - **Visual Breakdown**: Interactive pie chart showing individual holdings.
    - **Calculated Values**: Automatic calculation of stock values based on share count and live price.
    - **Smart Colors**: Professional color palette for clear distinction.
    - **Rich Legend**: Responsive legend (Side-by-side on Desktop, Stacked on Mobile) showing value and net worth %.
- **Financial Overview**: Tracks Total Net Worth, Buying Power (Cash), and Daily Portfolio Value.
- **Data Portability**: Full JSON Export and Import (Wipe & Replace) functionality for backup or migration.
- **Responsive Design**: Fully optimized for Desktop and Mobile.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Recharts, Lucide React, React Hot Toast.
- **Backend**: Supabase (PostgreSQL, Auth).
- **API**: Finnhub.io (Stock Market Data).
- **Tooling**: ESLint.

## 🚀 Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd asset-dashboard
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Variables**:
    Create a `.env` file in the root directory with the following keys:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    VITE_FINNHUB_API_KEY=your_finnhub_api_key
    ```

4.  **Run Locally**:
    ```bash
    npm run dev
    ```

## 📦 Deployment

This project is ready for deployment on **Vercel** or **Netlify**.
Ensure you add the environment variables in your deployment settings.

## 📄 License

MIT
