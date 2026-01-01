import axios, { AxiosInstance } from "axios";
import { createContext, useContext, useMemo } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";

interface ApiContextValue {
  client: AxiosInstance;
}

const ApiContext = createContext<ApiContextValue | undefined>(undefined);

// ApiProvider cria um "atendente" Axios que sempre fala com a mesma baseURL e injeta o token.
// Explicação para leigos: em vez de configurar HTTP toda hora, criamos um único cliente
// que já sabe para onde ir e qual crachá (Bearer token) mostrar em cada pedido.
export function ApiProvider({
  children,
  token
}: {
  children: React.ReactNode;
  token: string | null;
}) {
  const client = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL,
      headers: { "Content-Type": "application/json" }
    });

    // Se temos token, anexamos antes de cada requisição.
    instance.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, [token]);

  const value = useMemo(() => ({ client }), [client]);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

// useApi devolve o cliente configurado para ser usado nas páginas.
// Explicação para leigos: é o "telefone" pronto para ligar para a API.
export function useApi() {
  const ctx = useContext(ApiContext);
  if (!ctx) throw new Error("useApi must be used within ApiProvider");
  return ctx.client;
}
