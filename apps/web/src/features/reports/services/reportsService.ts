import axios from 'axios';
import { CreateReportPayload, ReportResponse } from '../types/reportTypes';

const API_BASE = 'http://localhost:3000/api';

export const reportService = {
  async createReport(payload: CreateReportPayload): Promise<ReportResponse> {
    const response = await axios.post<ReportResponse>(
      `${API_BASE}/reports`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    return response.data;
  },
};
