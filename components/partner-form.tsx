"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { createPartner } from "@/lib/actions"
import { CardImage } from "@/components/card-image"

interface FormErrors {
  name?: string
  email?: string
  password?: string
  cnpj?: string
  pixKey?: string
  terms?: string
}

export function PartnerForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    cnpj: "",
    pixKey: "",
    termsAccepted: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    if (numbers.length <= 12)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`
  }

  // Validações
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    return hasMinLength && hasUpperCase && hasNumber && hasSpecialChar
  }

  const validateCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, "")
    return numbers.length === 14
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "cnpj" && typeof value === "string") {
      const formatted = formatCNPJ(value)
      setFormData((prev) => ({ ...prev, [field]: formatted }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório"
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email deve ter um formato válido"
    }

    if (!formData.password) {
      newErrors.password = "Senha é obrigatória"
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, número e caractere especial"
    }

    if (!formData.cnpj) {
      newErrors.cnpj = "CNPJ é obrigatório"
    } else if (!validateCNPJ(formData.cnpj)) {
      newErrors.cnpj = "CNPJ deve ter 14 dígitos"
    }

    if (!formData.pixKey.trim()) {
      newErrors.pixKey = "Chave PIX é obrigatória"
    }

    if (!formData.termsAccepted) {
      newErrors.terms = "Você deve aceitar os termos de parceria"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setMessage(null)

    try {
      // Remover formatação do CNPJ antes de enviar
      const cnpjNumbers = formData.cnpj.replace(/\D/g, "")

      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("password", formData.password)
      formDataToSend.append("cnpj", cnpjNumbers)
      formDataToSend.append("pixKey", formData.pixKey)

      const result = await createPartner(formDataToSend)

      if (result.success) {
        setMessage({ type: "success", text: "Parceiro cadastrado com sucesso!" })
        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          cnpj: "",
          pixKey: "",
          termsAccepted: false,
        })
      } else {
        setMessage({ type: "error", text: result.error || "Erro ao cadastrar parceiro" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro inesperado. Tente novamente." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-white">Cadastro de Parceiros HPN</CardTitle>
        <CardDescription className="text-blue-100">Faça parte do sistema HPN!</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700 font-medium">
              Nome *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Digite o nome do parceiro"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className={`border-2 focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-gray-200"}`}
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 font-medium">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Digite o email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className={`border-2 focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-500" : "border-gray-200"}`}
            />
            {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">
              Senha *
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite a senha"
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              className={`border-2 focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-500" : "border-gray-200"}`}
            />
            {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj" className="text-gray-700 font-medium">
              CNPJ *
            </Label>
            <Input
              id="cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={(e) => handleInputChange("cnpj", e.target.value)}
              maxLength={18}
              className={`border-2 focus:ring-2 focus:ring-blue-500 ${errors.cnpj ? "border-red-500" : "border-gray-200"}`}
            />
            {errors.cnpj && <p className="text-red-500 text-sm">{errors.cnpj}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pixKey" className="text-gray-700 font-medium">
              Chave PIX do CNPJ *
            </Label>
            <Input
              id="pixKey"
              type="text"
              placeholder="Digite a chave PIX"
              value={formData.pixKey}
              onChange={(e) => handleInputChange("pixKey", e.target.value)}
              className={`border-2 focus:ring-2 focus:ring-blue-500 ${errors.pixKey ? "border-red-500" : "border-gray-200"}`}
            />
            {errors.pixKey && <p className="text-red-500 text-sm">{errors.pixKey}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => handleInputChange("termsAccepted", checked as boolean)}
                className="border-2 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <Label htmlFor="terms" className="text-sm text-gray-700">
                Eu aceito os{" "}
                <a href="#" className="text-blue-600 hover:text-purple-600 underline font-medium">
                  termos de parceria
                </a>{" "}
                *
              </Label>
            </div>
            {errors.terms && <p className="text-red-500 text-sm">{errors.terms}</p>}
          </div>

          {message && (
            <Alert className={message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {message.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              "Cadastrar Parceiro"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
