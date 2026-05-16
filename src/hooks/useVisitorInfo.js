import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const useVisitorInfo = () => {
  const [visitor, setVisitor] = useState({ ip: 'Loading...', path: '' });
  const location = useLocation();

  const fetchIP = async () => {
    try {
        //Ni có backend r thì thành thế vô hàm của thành
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      setVisitor(prev => ({ ...prev, ip: data.ip, path: location.pathname }));
    } catch (err) {
      setVisitor(prev => ({ ...prev, ip: 'Unknown', path: location.pathname }));
    }
  };

  useEffect(() => {
    fetchIP();
  }, [location.pathname]);

  return visitor;
};