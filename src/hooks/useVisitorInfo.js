import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const VISITOR_IP_ENDPOINT = import.meta.env.VITE_VISITOR_IP_ENDPOINT;
const FALLBACK_IP_ENDPOINTS = [
  "https://api.ipify.org?format=json",
  "https://api64.ipify.org?format=json",
];

const readIpFromResponse = (data) => {
  return data?.ip || data?.IPv4 || data?.query || data?.address || "";
};

export const useVisitorInfo = () => {
  const [visitor, setVisitor] = useState({ ip: 'Đang xác định IP...', path: '' });
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    const updateVisitor = async () => {
      const endpoints = [
        VISITOR_IP_ENDPOINT,
        ...FALLBACK_IP_ENDPOINTS,
      ].filter(Boolean);

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            cache: "no-store",
          });

          if (!res.ok) continue;

          const data = await res.json();
          const ip = readIpFromResponse(data);

          if (ip) {
            if (isMounted) {
              setVisitor({ ip, path: location.pathname });
            }

            return;
          }
        } catch {
          // Try the next endpoint.
        }
      }

      if (isMounted) {
        setVisitor({ ip: 'Không xác định IP', path: location.pathname });
      }
    };

    updateVisitor();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  return visitor;
};
