import { PartnerForm } from "@/components/partner-form"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <PartnerForm />
      </div>
    </div>
  )
}
