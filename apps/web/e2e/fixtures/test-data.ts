export const VALID_CEP = '01001-000';
export const INVALID_CEP = '00000-000';

export const VALID_REPORT = {
  title: 'Buraco na calçada da Rua Principal',
  description:
    'Há um buraco grande na calçada que dificulta a passagem de pedestres e cadeirantes.',
  cep: VALID_CEP,
  street: 'Praça da Sé',
  number: '123',
  complement: 'Próximo ao metrô',
  neighborhood: 'Sé',
  city: 'São Paulo',
  state: 'SP',
};

export const VIACEP_SUCCESS_RESPONSE = {
  cep: '01001-000',
  logradouro: 'Praça da Sé',
  complemento: 'lado ímpar',
  bairro: 'Sé',
  localidade: 'São Paulo',
  uf: 'SP',
  ibge: '3550308',
  gia: '1004',
  ddd: '11',
  siafi: '7107',
};

export const VIACEP_NOT_FOUND_RESPONSE = { erro: true };

export const API_REPORT_SUCCESS_RESPONSE = {
  id: 'report-abc-123',
  title: VALID_REPORT.title,
  description: VALID_REPORT.description,
  location: {
    street: VALID_REPORT.street,
    number: VALID_REPORT.number,
    complement: VALID_REPORT.complement,
    neighborhood: VALID_REPORT.neighborhood,
    city: VALID_REPORT.city,
    state: VALID_REPORT.state,
    postcode: '01001000',
  },
  classificationStatus: 'PENDING',
  createdAt: '2026-03-09T12:00:00.000Z',
};
