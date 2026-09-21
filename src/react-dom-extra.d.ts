import "react";

declare module "react" {
	interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
		// React 18 does not expose the standardized `fetchpriority` attribute in its types
		// (it was only added to @types/react 19). Lowercase `fetchpriority` is the correct
		// runtime spelling for React 18 - it is passed through to the DOM as-is.
		fetchpriority?: "high" | "low" | "auto";
	}
}