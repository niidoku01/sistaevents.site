/// <reference types="vite/client" />

declare module "*?responsive" {
	const image: { src: string; srcset: string };
	export const src: string;
	export const srcset: string;
	export default image;
}

declare module "virtual:responsive-collection-manifest" {
	const manifest: Record<string, { srcset: string }>;
	export default manifest;
}

interface ImportMetaEnv {
	readonly VITE_API_URL?: string;
	readonly VITE_API_URLS?: string;
	readonly VITE_CONVEX_SITE_URL?: string;
	readonly VITE_CONVEX_URL?: string;
	readonly VITE_FIREBASE_API_KEY?: string;
	readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
	readonly VITE_FIREBASE_PROJECT_ID?: string;
	readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
	readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
	readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}