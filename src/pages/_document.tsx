import { Html, Head, Main, NextScript } from "next/document";

// Runs before first paint so the correct theme class is present immediately,
// preventing a flash of the wrong theme. Mirrors the logic in ThemeContext:
// an explicit stored choice wins, otherwise follow the OS preference.
const NO_FLASH_THEME = `(function(){try{var m=localStorage.getItem('theme');var d=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <title>E-Nergy</title>
        <meta name="description" content="Your project description here" />
        <link rel="icon" href="/eNnergy Logo.png" />
        <link rel="apple-touch-icon" href="/eNnergy Logo.png" />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME }} />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
