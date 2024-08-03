import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { firestore } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, Title, CategoryScale } from 'chart.js';

Chart.register(LineElement, PointElement, LinearScale, Title, CategoryScale);

const StockList = () => {
  const [user] = useAuthState(auth);
  const [stocks, setStocks] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [sortType, setSortType] = useState('alphabetical'); // Default sort type
  const [sortOrder, setSortOrder] = useState('asc'); // Default sort order
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const apiKey = 'cq4jqn1r01qr4urillf0cq4jqn1r01qr4urillfg';
        const response = await axios.get(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`);

        if (response.status === 200) {
          const symbols = response.data.map(stock => stock.symbol).slice(0, 15);
          const priceRequests = symbols.map(async symbol => {
            const priceResponse = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
            return priceResponse.data;
          });

          const prices = await Promise.all(priceRequests);
          const stocksData = response.data.slice(0, 15).map((stock, index) => ({
            symbol: stock.symbol,
            description: stock.description,
            priceUSD: prices[index].c,
            priceINR: prices[index].c * 83,
          }));

          // Sort stocks based on initial fetch
          sortStocks(stocksData, sortType, sortOrder);

          setStocks(stocksData);
        } else {
          console.error('Failed to fetch stocks:', response.status);
        }
      } catch (error) {
        console.error('Error fetching stocks:', error);
        alert('Failed to fetch stocks. Please try again later.');
      }
    };

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update current time every second

    fetchStocks();

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [sortType, sortOrder]); // Fetch stocks on sort change

  const sortStocks = (data, sortType, sortOrder) => {
    let sortedStocks = [...data];
    if (sortType === 'alphabetical') {
      sortedStocks.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.symbol.localeCompare(b.symbol);
        } else {
          return b.symbol.localeCompare(a.symbol);
        }
      });
    } else if (sortType === 'price') {
      sortedStocks.sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.priceUSD - b.priceUSD;
        } else {
          return b.priceUSD - a.priceUSD;
        }
      });
    }
    setStocks(sortedStocks);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const [type, order] = value.split('-');
    setSortType(type);
    setSortOrder(order);

    // Sort stocks based on new criteria
    sortStocks(stocks, type, order);
  };

  const handleAddToFavorite = async (stock) => {
    if (user) {
      try {
        const favoritesRef = collection(firestore, 'users', user.uid, 'favorites');
        const stockData = {
          symbol: stock.symbol,
          description: stock.description,
          priceUSD: stock.priceUSD,
          priceINR: stock.priceINR,
          addedAt: new Date(),
        };
        await addDoc(favoritesRef, stockData);
        alert('Stock added to favorites successfully!');
      } catch (error) {
        console.error('Error adding stock to favorites:', error);
        alert('Failed to add stock to favorites. Please try again later.');
      }
    } else {
      alert('Please log in to add favorites');
    }
  };

  const addToCompare = (stock) => {
    if (!selectedStocks.some(s => s.symbol === stock.symbol)) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const removeFromCompare = (symbol) => {
    setSelectedStocks(selectedStocks.filter(stock => stock.symbol !== symbol));
  };

  const fetchHistoricalData = async (symbol) => {
    try {
      const apiKey = 'cq3u4k1r01qobiistoh0cq3u4k1r01qobiistohg';
      const fromDate = Math.floor(new Date('2023-01-01').getTime() / 1000); // Example start date
      const toDate = Math.floor(Date.now() / 1000); // Current date
      const response = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
        params: {
          symbol,
          resolution: 'D',
          from: fromDate,
          to: toDate,
          token: apiKey
        }
      });

      if (response.data.s !== 'ok') {
        throw new Error('Failed to fetch historical data');
      }

      const { t: timestamps, c: prices } = response.data;
      setChartData({
        labels: timestamps.map(ts => new Date(ts * 1000).toLocaleDateString()),
        datasets: [
          {
            label: `${symbol} Stock Price`,
            data: prices,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 0.6)',
            tension: 0.1,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching historical data:', error);
      alert('Failed to fetch historical data. Please try again later.');
    }
  };

  const handleBuyStock = (stock) => {
    navigate('/buystocks', { state: { stock } });
  };

  return (
    <div className="stock-list-container">
      <style>
        {`
          .stock-list-container {
            margin-top: 6rem;
            padding-top: 4rem;
          }

          .split-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            gap: 2rem;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            background-color: #405d72;
            color: #f0f0f0;
            position: fixed;
            top: 80px;
            width: 100%;
            max-width: 100%;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
            z-index: 1000;
          }

          .header-link {
            margin-left: 1rem;
            text-decoration: none;
            color: inherit;
          }

          /* Dropdown styles */
          select {
            margin-left: 1rem;
            padding: 0.5rem;
            font-size: 1rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            cursor: pointer;
            background-color: #f0f0f0;
            color: #333;
          }

          .date-time {
            display: flex;
            align-items: center;
            margin-right: 1rem;
          }

          .date {
            margin-right: 0.5rem;
          }

          .clock {
            font-size: 1rem;
          }

          .card {
            width: calc(25% - 1rem);
            margin-bottom: 1rem;
            padding: 1rem;
            background-color: #f0f0f0;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            transition: transform 0.3s ease;
          }

          .card-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem;
          }

          .card-buttons {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 1rem;
            gap: 0.5rem;
          }

          .button-shadow {
            background-color: #405D72;
            color: #ffffff;
            border: none;
            padding: 0.5rem 1rem;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.3s ease;
          }

          .button-shadow:hover {
            background-color: #294050;
          }

          .comparison-table {
            width: 100%;
            margin-top: 2rem;
          }

          .comparison-table table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 8px;
            overflow: hidden;
          }

          .comparison-table th,
          .comparison-table td {
            padding: 0.5rem;
            text-align: center;
            border-bottom: 1px solid #ddd;
          }

          .comparison-table th {
            background-color: #405d72;
            color: #fff;
          }

          .chart-container {
            width: 80%;
            margin: 2rem auto;
          }
        `}
      </style>

      <div className="header">
        <h1>Top 15 Stock List</h1>
        <div className="dropdown">
          {/* Sorting dropdown */}
          <select value={`${sortType}-${sortOrder}`} onChange={handleSortChange}>
            <option value="alphabetical-asc">Sort by Alphabetical (A-Z)</option>
            <option value="alphabetical-desc">Sort by Alphabetical (Z-A)</option>
            <option value="price-asc">Sort by Price (Low to High)</option>
            <option value="price-desc">Sort by Price (High to Low)</option>
          </select>
        </div>
        <div className="date-time">
          <div className="date">{currentTime.toLocaleDateString()}</div>
          <div className="clock">{currentTime.toLocaleTimeString()}</div>
        </div>
        <div>
          <Link to="/favorites" className="header-link">Favorites</Link>
          <Link to="/mystocks" className="header-link">My Stocks</Link>
        </div>
      </div>

      <div className="split-container">
        {stocks.map(stock => (
          <div key={stock.symbol} className="card">
            <div className="card-content">
              <h3>{stock.symbol}</h3>
              <p>{stock.description}</p>
              <p>Price (USD): ${stock.priceUSD ? stock.priceUSD.toFixed(2) : 'N/A'}</p>
              <p>Price (INR): ₹{stock.priceINR ? stock.priceINR.toFixed(2) : 'N/A'}</p>

              <div className="card-buttons">
                <button className="button-shadow" onClick={() => handleAddToFavorite(stock)}>Add to Favorites</button>
                <button className="button-shadow" onClick={() => addToCompare(stock)}>Add to Compare</button>
                <button className="button-shadow" onClick={() => handleBuyStock(stock)}>Buy Stock</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="comparison-table">
        <h2>Comparison Table</h2>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Description</th>
              <th>Price (USD)</th>
              <th>Price (INR)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {selectedStocks.map(stock => (
              <tr key={stock.symbol}>
                <td>{stock.symbol}</td>
                <td>{stock.description}</td>
                <td>${stock.priceUSD.toFixed(2)}</td>
                <td>₹{stock.priceINR.toFixed(2)}</td>
                <td>
                  <button className="button-shadow" onClick={() => removeFromCompare(stock.symbol)}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chartData && (
        <div className="chart-container">
          <Line data={chartData} />
        </div>
      )}
    </div>
  );
};

export default StockList;
