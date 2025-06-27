import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cadastro de Parceiros - Homio',
  description: 'Formulário para se cadastrar como aprceiro da homio',
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
