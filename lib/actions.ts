"use server"

const DIRECTUS_BASE_URL = "https://cms.homio.com.br"
const DIRECTUS_TOKEN = "AevKeW6sZk8OAPfMqsTG_oxXbrYBwjU-"

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
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/partner_logins?filter[urlId][_eq]=${urlId}`, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error("Erro ao verificar urlId")
    }

    const data = await response.json()
    return data.data && data.data.length > 0
  } catch (error) {
    console.error("Erro ao verificar urlId:", error)
    return false
  }
}

// Função para verificar se o nome já existe
async function checkNameExists(name: string): Promise<boolean> {
  try {
    const response = await fetch(
      `${DIRECTUS_BASE_URL}/items/partner_logins?filter[name][_eq]=${encodeURIComponent(name)}`,
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error("Erro ao verificar nome")
    }

    const data = await response.json()
    return data.data && data.data.length > 0
  } catch (error) {
    console.error("Erro ao verificar nome:", error)
    return false
  }
}

// Função para gerar um urlId único
async function generateUniqueUrlId(): Promise<string> {
  let urlId = generateRandomId()
  let attempts = 0
  const maxAttempts = 10

  while ((await checkUrlIdExists(urlId)) && attempts < maxAttempts) {
    urlId = generateRandomId()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error("Não foi possível gerar um ID único")
  }

  return urlId
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
    const response = await fetch(`${DIRECTUS_BASE_URL}/items/partner_logins`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIRECTUS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(partnerData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Erro do Directus:", errorData)

      if (response.status === 400) {
        return { success: false, error: "Dados inválidos. Verifique as informações e tente novamente." }
      }

      return { success: false, error: "Erro ao cadastrar parceiro. Tente novamente." }
    }

    const result = await response.json()
    console.log("Parceiro criado:", result)

    return { success: true, data: result.data }
  } catch (error) {
    console.error("Erro ao criar parceiro:", error)
    return { success: false, error: "Erro interno. Tente novamente mais tarde." }
  }
}
