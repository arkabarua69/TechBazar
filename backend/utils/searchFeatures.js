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
        // MongoDB operators (e.g. { price: { $gte: 0 } }). The legacy
        // JSON.stringify + regex approach produced invalid field names like
        // "price[$gte]" which matched no documents, causing all products
        // to be filtered out except those that happened to have such a field.
        const parsedQuery = {};

        const castValue = (v) => {
            if (v === 'true' || v === 'false') return v === 'true';
            if (!isNaN(Number(v)) && v !== '') return Number(v);
            return v;
        };

        for (const [key, value] of Object.entries(queryCopy)) {
            const match = key.match(/^(\w+)\[(\w+)\]$/);
            if (match) {
                const [, field, operator] = match;
                if (!parsedQuery[field]) parsedQuery[field] = {};
                parsedQuery[field][`$${operator}`] = castValue(value);
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