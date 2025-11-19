"use client";

import { useEffect } from 'react';

interface CalendlyWidgetProps {
  url: string;
  prefill?: {
    name?: string;
    email?: string;
  };
  utm?: {
    utmCampaign?: string;
    utmSource?: string;
    utmMedium?: string;
    utmContent?: string;
    utmTerm?: string;
  };
  pageSettings?: {
    backgroundColor?: string;
    hideEventTypeDetails?: boolean;
    hideLandingPageDetails?: boolean;
    primaryColor?: string;
    textColor?: string;
  };
  style?: {
    minWidth?: string;
    height?: string;
  };
}

export default function CalendlyWidget({
  url,
  prefill,
  utm,
  pageSettings,
  style = { minWidth: '320px', height: '630px' }
}: CalendlyWidgetProps) {
  useEffect(() => {
    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script when component unmounts
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Build Calendly URL with parameters
  const buildCalendlyUrl = () => {
    const calendlyUrl = new URL(url);
    
    if (prefill) {
      // Only add prefill parameters if they have non-empty values
      // Calendly rejects empty strings and causes 400 errors
      if (prefill.name && prefill.name.trim() !== '') {
        calendlyUrl.searchParams.set('name', prefill.name.trim());
      }
      if (prefill.email && prefill.email.trim() !== '' && prefill.email.includes('@')) {
        calendlyUrl.searchParams.set('email', prefill.email.trim());
      }
    }
    
    if (utm) {
      Object.entries(utm).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          calendlyUrl.searchParams.set(key, value);
        }
      });
    }
    
    return calendlyUrl.toString();
  };

  return (
    <div className="calendly-inline-widget" 
         data-url={buildCalendlyUrl()}
         style={style}
    />
  );
}

