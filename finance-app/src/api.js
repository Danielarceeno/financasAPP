// API 1: AwesomeAPI (Moedas)
export async function getCurrencyQuotes() {
  try {
    const response = await fetch(
      'https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL'
    );
    const data = await response.json();
    return {
      dolar: data.USDBRL,
      euro: data.EURBRL,
    };
  } catch (error) {
    console.error('Erro ao buscar moedas:', error);
    return null;
  }
}

// API 2: CoinGecko (Cripto - Bitcoin)
export async function getCryptoQuote() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl'
    );
    const data = await response.json();
    return data.bitcoin;
  } catch (error) {
    console.error('Erro ao buscar cripto:', error);
    return null;
  }
}
