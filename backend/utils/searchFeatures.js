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
        if (parsedQuery.shop) {
            const shopFilter = parsedQuery.shop;
            delete parsedQuery.shop;
            parsedQuery.$or = [
                { shop: shopFilter },
                { shop: { $exists: false } },
                { shop: null },
                { shop: '' },
            ];
        }

        // For numeric range filters (e.g. ratings[gte]=4, price[lte]=200000),
        // MongoDB's $gte/$gt/$lt/$lte operators do NOT match documents where the
        // field is missing entirely — those are treated as null, and null is less
        // than every number.  A product without a `ratings` field should still
        // match `ratings >= 0`, so we append `$or: [ <range>, { $eq: null } ]`
        // to also match documents where the field is absent or null.
        const RANGE_OPS = ['$gte', '$gt', '$lt', '$lte'];
        for (const key in parsedQuery) {
            const val = parsedQuery[key];
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                const hasRangeOp = RANGE_OPS.some((op) => op in val);
                if (hasRangeOp) {
                    const rangeCond = { ...val };
                    delete rangeCond.$eq; // just in case
                    if (!val.$eq) delete val; // placeholder, not used
                    parsedQuery[key] = {
                        $or: [rangeCond, { $eq: null }],
                    };
                }
            }
        }

        this.query = this.query.find(parsedQuery);
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