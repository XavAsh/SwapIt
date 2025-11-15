import { Request, Response } from "express";
import { esClient } from "../index";
import { Logger } from "../../shared/utils/logger";

const logger = new Logger("SearchController");

export const search = async (req: Request, res: Response) => {
  const { q, category, minPrice, maxPrice, size, condition, location, page = 1, limit = 20 } = req.query;

  const from = (Number(page) - 1) * Number(limit);
  const must: any[] = [];
  const should: any[] = [];

  // Full-text search
  if (q) {
    should.push({
      multi_match: {
        query: q as string,
        fields: ["title^3", "description"],
        fuzziness: "AUTO",
      },
    });
  }

  // Filters
  if (category) {
    must.push({ term: { category: category } });
  }
  if (size) {
    must.push({ term: { size: size } });
  }
  if (condition) {
    must.push({ term: { condition: condition } });
  }
  if (location) {
    must.push({ term: { location: location } });
  }
  if (minPrice || maxPrice) {
    const range: any = {};
    if (minPrice) range.gte = Number(minPrice);
    if (maxPrice) range.lte = Number(maxPrice);
    must.push({ range: { price: range } });
  }

  // Only show available items
  must.push({ term: { status: "available" } });

  const query: any = {};
  if (must.length > 0) query.must = must;
  if (should.length > 0) query.should = should;
  if (must.length === 0 && should.length === 0) query.match_all = {};

  try {
    const result = await esClient.search({
      index: "products",
      body: {
        query: {
          bool: query,
        },
        from,
        size: Number(limit),
        sort: [{ createdAt: { order: "desc" } }],
      },
    });

    const hits = result.hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score,
    }));

    res.json({
      success: true,
      data: hits,
      total: result.hits.total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    logger.error("Search error", error);
    res.status(500).json({
      success: false,
      error: "Search failed",
    });
  }
};

export const suggest = async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q) {
    return res.json({ success: true, data: [] });
  }

  try {
    // Use prefix matching instead of completion suggester
    const result = await esClient.search({
      index: "products",
      body: {
        query: {
          bool: {
            must: [
              { term: { status: "available" } },
              {
                prefix: {
                  title: {
                    value: q as string,
                    case_insensitive: true,
                  },
                },
              },
            ],
          },
        },
              size: 5,
        _source: ["title", "category"],
      },
    });

    const suggestions = result.hits.hits.map((hit: any) => ({
      text: hit._source.title,
      category: hit._source.category,
    }));

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error("Suggest error", error);
    res.status(500).json({
      success: false,
      error: "Suggest failed",
    });
  }
};
