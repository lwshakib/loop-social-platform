class ApiResponse<T = any> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  sort?: {
    field?: string;
    order?: "asc" | "desc";
  };

  constructor(
    statusCode: number,
    data: T,
    message: string = "Success",
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    },
    sort?: {
      field?: string;
      order?: "asc" | "desc";
    }
  ) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (pagination !== undefined) {
      this.pagination = pagination;
    }
    if (sort !== undefined) {
      this.sort = sort;
    }
  }
}

export { ApiResponse };
