export interface AuthModalFields {
  email: string;
  error: string | null;
  fullName: string;
  password: string;
  submitting: boolean;
}

export function createEmptyAuthModalFields(): AuthModalFields {
  return {
    email: "",
    error: null,
    fullName: "",
    password: "",
    submitting: false,
  };
}
