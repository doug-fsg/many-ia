export async function buscarInboxes(accountId: string | undefined) {
  if (!accountId) {
    return {
      error: 'AccountId não fornecido',
      data: null,
    }
  }

  try {
    const url = `/api/manytalks?accountId=${accountId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      error: null,
      data,
    }
  } catch (error) {
    return {
      error: 'Falha ao buscar inboxes',
      data: null,
    }
  }
}
