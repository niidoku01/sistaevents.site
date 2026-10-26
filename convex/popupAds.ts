import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { adminSecretArg, validateAdminSecret } from "./admin";

const sortNewestFirst = <T extends { createdAt: number }>(items: T[]) =>
	items.sort((a, b) => b.createdAt - a.createdAt);

export const listPopupAds = query({
	args: {
		...adminSecretArg,
	},
	handler: async (ctx, args) => {
		validateAdminSecret(args.secret);
		const ads = await ctx.db.query("popupAds").collect();
		return sortNewestFirst(ads).map((ad) => ({
			...ad,
			active: ad.isActive,
		}));
	},
});

export const getActivePopupAd = query({
	handler: async (ctx) => {
		const now = Date.now();
		const activeAds = await ctx.db
			.query("popupAds")
			.withIndex("by_active", (q) => q.eq("isActive", true))
			.collect();

		const eligible = activeAds
			.filter((ad) => {
				const startsOk = ad.startsAt === undefined || ad.startsAt <= now;
				const endsOk = ad.endsAt === undefined || ad.endsAt >= now;
				return startsOk && endsOk;
			})
			.sort((a, b) => b.updatedAt - a.updatedAt);

		const ad = eligible[0];
		if (!ad) return null;

		return {
			...ad,
			active: ad.isActive,
		};
	},
});

export const createPopupAd = mutation({
	args: {
		title: v.string(),
		message: v.string(),
		imageUrl: v.optional(v.string()),
		ctaText: v.optional(v.string()),
		ctaUrl: v.optional(v.string()),
		celebratory: v.optional(v.boolean()),
		startsAt: v.optional(v.number()),
		endsAt: v.optional(v.number()),
		active: v.boolean(),
		...adminSecretArg,
	},
	handler: async (ctx, args) => {
		validateAdminSecret(args.secret);

		if (args.title.length > 200) {
			throw new Error("Title too long (max 200 characters)");
		}
		if (args.message.length > 500) {
			throw new Error("Message too long (max 500 characters)");
		}
		if (args.imageUrl && args.imageUrl.length > 2_000_000) {
			throw new Error("Image is too large. Please compress it further.");
		}
		if (args.ctaUrl && args.ctaUrl.length > 2000) {
			throw new Error("CTA URL too long");
		}
		if (args.imageUrl && !/^https?:\/\//i.test(args.imageUrl) && !args.imageUrl.startsWith("data:")) {
			throw new Error("Image URL must be an HTTP/HTTPS or data URL");
		}
		if (args.ctaUrl && !/^https?:\/\//i.test(args.ctaUrl)) {
			throw new Error("CTA URL must be an HTTP or HTTPS URL");
		}

		const now = Date.now();

		if (args.active) {
			const activeAds = await ctx.db
				.query("popupAds")
				.withIndex("by_active", (q) => q.eq("isActive", true))
				.collect();

			await Promise.all(
				activeAds.map((ad) =>
					ctx.db.patch(ad._id, {
						isActive: false,
						updatedAt: now,
					})
				)
			);
		}

		const popupAd = {
			title: args.title,
			message: args.message,
			isActive: args.active,
			createdAt: now,
			updatedAt: now,
			...(args.imageUrl !== undefined && { imageUrl: args.imageUrl }),
			...(args.ctaText !== undefined && { ctaText: args.ctaText }),
			...(args.ctaUrl !== undefined && { ctaUrl: args.ctaUrl }),
			...(args.celebratory !== undefined && { celebratory: args.celebratory }),
			...(args.startsAt !== undefined && { startsAt: args.startsAt }),
			...(args.endsAt !== undefined && { endsAt: args.endsAt }),
		};

		return await ctx.db.insert("popupAds", popupAd);
	},
});

export const setPopupAdActive = mutation({
	args: {
		id: v.id("popupAds"),
		active: v.boolean(),
		...adminSecretArg,
	},
	handler: async (ctx, args) => {
		validateAdminSecret(args.secret);
		const now = Date.now();

		if (args.active) {
			const activeAds = await ctx.db
				.query("popupAds")
				.withIndex("by_active", (q) => q.eq("isActive", true))
				.collect();

			await Promise.all(
				activeAds.map((ad) =>
					ctx.db.patch(ad._id, {
						isActive: false,
						updatedAt: now,
					})
				)
			);
		}

		await ctx.db.patch(args.id, {
			isActive: args.active,
			updatedAt: now,
		});
	},
});

export const deletePopupAd = mutation({
	args: {
		id: v.id("popupAds"),
		...adminSecretArg,
	},
	handler: async (ctx, args) => {
		validateAdminSecret(args.secret);
		await ctx.db.delete(args.id);
	},
});
