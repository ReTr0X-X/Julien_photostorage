import "./globals.css";

export const metadata = {
  title: "EMS Vault - Evidence Storage System",
  description: "Secure operational storage for law enforcement, emergency medical services, and fire rescue.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
