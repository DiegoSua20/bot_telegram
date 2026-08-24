export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportResult {
  title: string;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  totals?: Record<string, unknown>;
}

export interface ReportQuery {
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  clientId?: string;
  categoryId?: string;
  userId?: string;
  status?: string;
}
