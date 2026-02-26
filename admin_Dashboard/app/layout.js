import './globals.css';

export const metadata = {
  title: 'Enterprise SaaS Owner Dashboard',
  description: 'Enterprise SaaS Timesheet Management Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
