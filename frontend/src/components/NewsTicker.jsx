import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { economicIndicators as fallbackIndicators } from '../mock';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const NewsTicker = () => {
  const [indicators, setIndicators] = useState(fallbackIndicators);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        const response = await axios.get(`${API}/economic-indicators`, {
          timeout: 30000
        });
        if (response.data?.indicators && response.data.indicators.length > 0) {
          setIndicators(response.data.indicators);
        }
      } catch (error) {
        console.warn('Using fallback indicators:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
    // Refresh every 30 minutes (cache TTL is 12h server-side)
    const interval = setInterval(fetchIndicators, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Duplicate indicators for seamless loop animation
  const tickerItems = [...indicators, ...indicators];

  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-gradient-to-r from-[#003057] to-[#1E5A75] border-b border-[#CBA55A]/30 shadow-md" data-testid="news-ticker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-11 overflow-hidden">
          {/* Label */}
          <div className="flex items-center gap-2 flex-shrink-0 pr-4 border-r border-[#CBA55A]/40">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-[#CBA55A] animate-pulse'}`}></div>
            <span className="text-[#CBA55A] font-bold text-xs uppercase tracking-wider hidden sm:flex items-center gap-2">
              <Activity size={14} />
              Mercados
            </span>
            <span className="text-[#CBA55A] font-bold text-xs uppercase tracking-wider sm:hidden">
              <Activity size={14} />
            </span>
          </div>

          {/* Scrolling content */}
          <div className="flex-1 overflow-hidden pl-4">
            <div className="flex items-center gap-8 animate-ticker whitespace-nowrap">
              {tickerItems.map((item, index) => {
                const isUp = item.trend === 'up';
                const TrendIcon = isUp ? TrendingUp : TrendingDown;
                const trendColor = isUp ? 'text-green-400' : 'text-red-400';

                return (
                  <div
                    key={`${item.symbol}-${index}`}
                    className="flex items-center gap-2 flex-shrink-0"
                    data-testid={`indicator-${index}`}
                    title={item.name}
                  >
                    <span className="text-[#CBA55A] font-bold text-xs uppercase tracking-wide">
                      {item.symbol}
                    </span>
                    <span className="text-white text-sm font-medium">
                      {item.value}
                      {item.unit && <span className="text-white/60 text-xs ml-1">{item.unit}</span>}
                    </span>
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                      <TrendIcon size={12} />
                      <span className="text-xs font-semibold">{item.change}</span>
                    </div>
                    <span className="text-white/20 ml-4">|</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
