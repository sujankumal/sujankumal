import Script from 'next/script';
import { GA_TRACKING_ID } from '@/constants/constants';

/**
 * Google Analytics (gtag.js) scripts.
 * Drop this component into any layout that needs GA tracking.
 * If GA_TRACKING_ID is empty, nothing is rendered.
 */
export default function GoogleAnalytics() {
  if (!GA_TRACKING_ID) return null;

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
      />
      <Script id="gtag-script">
        {`window.dataLayer = window.dataLayer || [];
        function gtag(){window.dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_TRACKING_ID}');`}
      </Script>
    </>
  );
}
