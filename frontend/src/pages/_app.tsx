import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      {...pageProps}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  );
} 