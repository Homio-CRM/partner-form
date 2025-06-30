import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cadastro HPN | Homio',
  description: 'Formulário para se cadastrar como parceiro da homio',
  icons: {
    icon: "/favicon.svg",
  },
  generator: 'Homio CRM',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
