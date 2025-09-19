import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* SEO Meta Tags */}
        <title>Greezo – Healthy Snacks & Juices</title>
        <meta
          name="description"
          content="Greezo provides protein-rich sprouts, egg & non-egg meals, and juices at affordable prices. Try our ₹9 juice trial offer today!"
        />
        <meta
          name="keywords"
          content="greezo, healthy snacks, juices, protein food, sprouts, Bangalore food delivery"
        />
        <meta name="author" content="Greezo Foods" />

        {/* Open Graph (for social media previews) */}
        <meta property="og:title" content="Greezo – Healthy Snacks & Juices" />
        <meta
          property="og:description"
          content="Affordable, protein-packed healthy snacks & juices delivered fresh."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://greezo.vercel.app" />
        <meta property="og:image" content="/logo.png" />

        {/* Google Site Verification (replace with your actual code) */}
       <meta name="google-site-verification" content="aZ_riEywDI1TNSgyIhEQ93MGnsWWCa1dPYwhXCg7_yg" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
