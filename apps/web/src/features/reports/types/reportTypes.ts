/**
 * Structured location matching the backend StructuredLocation interface.
 */
export interface StructuredLocation {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postcode: string;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference?: string;
}

export interface ReportFormValues {
  title: string;
  description: string;
  cep?: string;
  address?: Address;
}

/**
 * Payload sent to POST /api/reports.
 * The `location` field is a structured address object.
 */
export interface CreateReportPayload {
  title: string;
  description: string;
  location: StructuredLocation;
}

/**
 * Response from POST /api/reports.
 */
export interface ReportResponse {
  id: string;
  title: string;
  description: string;
  location: StructuredLocation;
  classificationStatus: string;
  createdAt: string;
}
