// Login is handled by CRM middleware - this URL should not be used for redirects
export const LOGIN_URL = process.env.NEXT_PUBLIC_LOGIN_URL || '/sign-in';