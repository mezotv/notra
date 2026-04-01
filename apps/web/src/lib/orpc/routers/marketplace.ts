import { db } from "@notra/db/drizzle";
import { marketplaceBrands } from "@notra/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
// biome-ignore lint/performance/noNamespaceImport: Zod recommended way to import
import * as z from "zod";
import { baseProcedure } from "../base";

const listInputSchema = z.object({
  category: z.string().optional(),
  featured: z.boolean().optional(),
});

const getBySlugInputSchema = z.object({
  slug: z.string().min(1),
});

export const marketplaceRouter = {
  list: baseProcedure.input(listInputSchema).handler(async ({ input }) => {
    const conditions = [];

    if (input.category) {
      conditions.push(eq(marketplaceBrands.category, input.category));
    }

    if (input.featured !== undefined) {
      conditions.push(eq(marketplaceBrands.featured, input.featured));
    }

    const brands = await db.query.marketplaceBrands.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(marketplaceBrands.featured), asc(marketplaceBrands.companyName)],
    });

    return {
      brands: brands.map((brand) => ({
        ...brand,
        referenceCount: Array.isArray(brand.references)
          ? (brand.references as unknown[]).length
          : 0,
        createdAt: brand.createdAt.toISOString(),
        updatedAt: brand.updatedAt.toISOString(),
      })),
    };
  }),

  getBySlug: baseProcedure
    .input(getBySlugInputSchema)
    .handler(async ({ input }) => {
      const brand = await db.query.marketplaceBrands.findFirst({
        where: eq(marketplaceBrands.slug, input.slug),
      });

      if (!brand) {
        throw new Error("Brand not found");
      }

      return {
        brand: {
          ...brand,
          referenceCount: Array.isArray(brand.references)
            ? (brand.references as unknown[]).length
            : 0,
          createdAt: brand.createdAt.toISOString(),
          updatedAt: brand.updatedAt.toISOString(),
        },
      };
    }),
};
