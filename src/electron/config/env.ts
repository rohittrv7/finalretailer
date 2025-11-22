// import { z } from 'zod';
// const envSchema = z.object({
//   VITE_BACKEND_BASE_URL: z.string().url(),
//   VITE_S3_BASE_URL: z.string().url(),
//   VITE_NODE_ENV: z.string(),
//   VITE_LOCAL_COMPANY_SUBDOMAIN: z.string().optional(),
//   VITE_LOCAL_DOMAIN: z.string().optional(),
//   VITE_SECRET_ENCRYPTION_KEY: z.string(),
// });
// // Safely parse the environment variables with the correct VITE_ prefix
// const parsedEnv = envSchema.safeParse({
//   VITE_BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_BASE_URL,
//   VITE_S3_BASE_URL: import.meta.env.VITE_S3_BASE_URL,
//   VITE_NODE_ENV: import.meta.env.MODE,
//   VITE_LOCAL_COMPANY_SUBDOMAIN: import.meta.env.VITE_LOCAL_COMPANY_SUBDOMAIN,
//   VITE_LOCAL_DOMAIN: import.meta.env.VITE_LOCAL_DOMAIN,
//   VITE_SECRET_ENCRYPTION_KEY: import.meta.env.VITE_SECRET_ENCRYPTION_KEY,
// });
// if (!parsedEnv.success) {
//   throw new Error(
//     'Invalid environment variables found :(\n' +
//       JSON.stringify(parsedEnv?.error)
//   );
// }
// export const env = parsedEnv.data;
