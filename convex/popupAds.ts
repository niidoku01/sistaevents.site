import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const sortNewestFirst = <T extends { createdAt: number }>(items: T[]) =>
	items.sort((a, b) => b.createdAt - a.createdAt);

export const listPopupAds = query({
	handler: async (ctx) => {
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
		active: v.boolean(),
	},
	handler: async (ctx, args) => {
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

		return await ctx.db.insert("popupAds", {
			title: args.title,
			message: args.message,
			imageUrl: args.imageUrl,
			ctaText: args.ctaText,
			ctaUrl: args.ctaUrl,
			isActive: args.active,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const setPopupAdActive = mutation({
	args: {
		id: v.id("popupAds"),
		active: v.boolean(),
	},
	handler: async (ctx, args) => {
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
	},
	handler: async (ctx, args) => {
		await ctx.db.delete(args.id);
	},
});
