export interface User {
  id: string;   // Snowflake ID
  username: string;
  role: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: string;   // Snowflake ID
  username: string;
  role: string;
  token: string;
}
