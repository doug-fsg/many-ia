interface ManytalksInbox {
  id: number;
  name: string;
  channel_type: string;
  avatar_url: string;
  manytalksAccountId: string;
}

export async function buscarInboxes(accountId: string | undefined) {
  if (!accountId) {
    console.error('❌ AccountId não fornecido');
    return {
      error: 'AccountId não fornecido',
      data: null,
    };
  }

  console.log('🚀 Iniciando buscarInboxes - Account ID:', accountId);

  try {
    const url = `/api/manytalks?accountId=${accountId}`;
    console.log('📡 Tentando conexão com proxy:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Resposta não-OK:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
      });
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Dados recebidos:', data);
    return {
      error: null,
      data,
    };
  } catch (error) {
    console.error('❌ Erro crítico em buscarInboxes:', {
      accountId,
      erro: error,
      url: `/api/manytalks?accountId=${accountId}`,
      timestamp: new Date().toISOString(),
    });

    return {
      error: 'Falha ao buscar inboxes',
      data: null,
    };
  }
}
