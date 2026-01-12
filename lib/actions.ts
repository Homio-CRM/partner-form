"use server"

const DIRECTUS_BASE_URL = process.env.DIRECTUS_BASE_URL
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN
const FETCH_TIMEOUT = 10000 // 10 segundos

// Validar variáveis de ambiente
if (!DIRECTUS_BASE_URL || !DIRECTUS_TOKEN) {
  throw new Error(
    "Variáveis de ambiente obrigatórias não configuradas: DIRECTUS_BASE_URL e DIRECTUS_TOKEN"
  )
}

// Função auxiliar para fetch com timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = FETCH_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Timeout: A requisição demorou muito para responder")
    }
    throw error
  }
}

// Função para gerar ID aleatório de 10 caracteres
function generateRandomId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Função para verificar se o urlId já existe
async function checkUrlIdExists(urlId: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${DIRECTUS_BASE_URL}/items/partner_logins?filter[urlId][_eq]=${urlId}`,
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error(`Erro ao verificar urlId: ${response.status} ${response.statusText}`)
      throw new Error("Erro ao verificar urlId")
    }

    const data = await response.json()
    return data.data && data.data.length > 0
  } catch (error) {
    console.error("Erro ao verificar urlId:", error)
    throw error
  }
}

// Função para verificar se o nome já existe
async function checkNameExists(name: string): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${DIRECTUS_BASE_URL}/items/partner_logins?filter[name][_eq]=${encodeURIComponent(name)}`,
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      console.error(`Erro ao verificar nome: ${response.status} ${response.statusText}`)
      throw new Error("Erro ao verificar nome")
    }

    const data = await response.json()
    return data.data && data.data.length > 0
  } catch (error) {
    console.error("Erro ao verificar nome:", error)
    throw error
  }
}

// Função para gerar um urlId único
async function generateUniqueUrlId(): Promise<string> {
  let urlId = generateRandomId()
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    try {
      const exists = await checkUrlIdExists(urlId)
      if (!exists) {
        return urlId
      }
    } catch (error) {
      console.error(`Erro ao verificar urlId na tentativa ${attempts + 1}:`, error)
      // Se houver erro de timeout ou conexão, tentar novamente com novo ID
      if (attempts < maxAttempts - 1) {
        urlId = generateRandomId()
        attempts++
        continue
      }
      throw error
    }
    urlId = generateRandomId()
    attempts++
  }

  throw new Error("Não foi possível gerar um ID único após várias tentativas")
}

export async function createPartner(formData: FormData) {
  try {
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cnpj = formData.get("cnpj") as string
    const pixKey = formData.get("pixKey") as string

    // Validar campos obrigatórios
    if (!name || !email || !password || !cnpj || !pixKey) {
      return { success: false, error: "Todos os campos são obrigatórios" }
    }

    // Verificar se o nome já existe
    const nameExists = await checkNameExists(name)
    if (nameExists) {
      return { success: false, error: "Este nome já está em uso. Escolha outro nome." }
    }

    // Gerar urlId único
    const urlId = await generateUniqueUrlId()

    // Preparar dados para envio
    const partnerData = {
      name,
      login: email,
      password,
      cnpj,
      pixKey,
      type: "partner",
      urlId,
    }

    // Enviar para o Directus
    console.log("Enviando dados para Directus...")
    const response = await fetchWithTimeout(
      `${DIRECTUS_BASE_URL}/items/partner_logins`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(partnerData),
      }
    )

    console.log(`Resposta do Directus: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      let errorData = {}
      try {
        errorData = await response.json()
      } catch (e) {
        const text = await response.text().catch(() => "")
        console.error("Erro ao parsear resposta do Directus:", text)
      }
      console.error("Erro do Directus:", errorData)

      if (response.status === 400) {
        return { success: false, error: "Dados inválidos. Verifique as informações e tente novamente." }
      }

      if (response.status === 401) {
        return { success: false, error: "Erro de autenticação. Contate o suporte." }
      }

      if (response.status === 403) {
        return { success: false, error: "Sem permissão para realizar esta ação." }
      }

      return { success: false, error: "Erro ao cadastrar parceiro. Tente novamente." }
    }

    const result = await response.json()
    console.log("Parceiro criado com sucesso:", result)

    return { success: true, data: result.data }
  } catch (error) {
    console.error("Erro ao criar parceiro:", error)
    
    if (error instanceof Error) {
      if (error.message.includes("Timeout")) {
        return { success: false, error: "A requisição demorou muito. Verifique sua conexão e tente novamente." }
      }
      if (error.message.includes("fetch")) {
        return { success: false, error: "Erro de conexão. Verifique sua internet e tente novamente." }
      }
    }
    
    return { success: false, error: "Erro interno. Tente novamente mais tarde." }
  }
}
