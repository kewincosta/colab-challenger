import axios from 'axios';

export interface ViaCepSuccessResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

export interface ViaCepErrorResponse {
  erro: true;
}

export type ViaCepResponse = ViaCepSuccessResponse | ViaCepErrorResponse;

export function isViaCepError(response: ViaCepResponse): response is ViaCepErrorResponse {
  return 'erro' in response && response.erro === true;
}

export async function lookupCep(cep: string): Promise<ViaCepResponse> {
  const normalizedCep = cep.replace(/\D/g, '');
  
  if (normalizedCep.length !== 8) {
    throw new Error('CEP must contain exactly 8 digits');
  }

  const response = await axios.get<ViaCepResponse>(
    `https://viacep.com.br/ws/${normalizedCep}/json/`
  );

  return response.data;
}
