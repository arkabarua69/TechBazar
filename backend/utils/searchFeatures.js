class SearchFeatures {
    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }

    search() {
        const keyword = this.queryString.keyword ? {
            name: {
                $regex: this.queryString.keyword,
                $options: "i",
            }
        } : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        const queryCopy = { ...this.queryString }

        // fields to remove before building the Mongoose filter
        const removeFields = ["keyword", "page", "limit"];

        removeFields.forEach(key => delete queryCopy[key]);

        // Parse bracket-notation query params (e.g. price[gte]=0) into nested
        // MongoDB operators (e.g. { price: { $gte: 0 } }). Express's `qs` parser
        // already converts "price[gte]=0" into { price: { gte: '0' } }, while
        // the raw querystring parser keeps it as { "price[gte]": "0" }. We
        // handle both forms so that MongoDB operators ($gte, $lte, …) are
        // always applied correctly.
        const parsedQuery = {};

        const castValue = (v) => {
            if (v === 'true' || v === 'false') return v === 'true';
            if (!isNaN(Number(v)) && v !== '') return Number(v);
            return v;
        };

        for (const [key, value] of Object.entries(queryCopy)) {
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // qs parser:  price[gte]=0  →  { price: { gte: '0' } }
                parsedQuery[key] = {};
                for (const [op, val] of Object.entries(value)) {
                    parsedQuery[key][`$${op}`] = castValue(val);
                }
            } else if (key.includes('[') && key.includes(']')) {
                // raw querystring:  price[gte]=0  →  { "price[gte]": "0" }
                const match = key.match(/^(\w+)\[(\w+)\]$/);
                if (match) {
                    const [, field, operator] = match;
                    if (!parsedQuery[field]) parsedQuery[field] = {};
                    parsedQuery[field][`$${operator}`] = castValue(value);
                } else {
                    parsedQuery[key] = castValue(value);
                }
            } else {
                parsedQuery[key] = castValue(value);
            }
        }

        // When a shop filter is applied, always include products that have no
        // shop assigned — they belong to no specific shop but should still
        // appear on all shop pages alongside shop-specific products.
        const shopOr = [];
        if (parsedQuery.shop) {
            const shopFilter = parsedQuery.shop;
            delete parsedQuery.shop;
            shopOr.push({ shop: shopFilter });
            shopOr.push({ shop: { $exists: false } });
            shopOr.push({ shop: null });
            shopOr.push({ shop: '' });
        }

        // For numeric range filters (e.g. ratings[gte]=4, price[lte]=200000),
        // MongoDB's $gte/$gt/$lt/$lte operators do NOT match documents where the
        // field is missing entirely — those are treated as null, and null is
        // less than every number.  When the schema default (0 for numeric fields
        // like `ratings` and `price`) satisfies the range condition, we wrap
        // the filter in a top-level `$or` that also matches documents where the
        // field is absent.  This ensures `ratings >= 0` returns all products,
        // while `ratings >= 4` correctly excludes products with no rating.
        const DEFAULT_NUMERIC = 0;
        const RANGE_OPS = ['$gte', '$gt', '$lt', '$lte'];

        const missingFieldSatisfies = (op, value) => {
            switch (op) {
                case '$gte': return DEFAULT_NUMERIC >= value;
                case '$gt':  return DEFAULT_NUMERIC > value;
                case '$lte': return DEFAULT_NUMERIC <= value;
                case '$lt':  return DEFAULT_NUMERIC < value;
                default:     return false;
            }
        };

        const andClauses = [];

        for (const key in parsedQuery) {
            const val = parsedQuery[key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                const rangeOps = RANGE_OPS.filter((op) => op in val);
                if (rangeOps.length > 0) {
                    const orClause = [{ [key]: val }];
                    // Include missing-field docs only when the schema default
                    // would satisfy at least one of the range operators.
                    if (rangeOps.some((op) => missingFieldSatisfies(op, val[op]))) {
                        orClause.push({ [key]: { $exists: false } });
                    }
                    andClauses.push({ $or: orClause });
                } else {
                    andClauses.push({ [key]: val });
                }
            } else {
                andClauses.push({ [key]: val });
            }
        }

        if (shopOr.length) {
            andClauses.push({ $or: shopOr });
        }

        let finalQuery;
        if (andClauses.length === 0) {
            finalQuery = {};
        } else if (andClauses.length === 1) {
            finalQuery = andClauses[0];
        } else {
            finalQuery = { $and: andClauses };
        }

        this.query = this.query.find(finalQuery);
        return this;
    }

    pagination(resultPerPage) {
        const currentPage = Number(this.queryString.page) || 1;

        const skipProducts = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skipProducts);
        return this;
    }
};

module.exports = SearchFeatures;