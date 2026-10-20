export const getDiscount = (price, cuttedPrice) => {
    return (((cuttedPrice - price) / cuttedPrice) * 100).toFixed();
}

export const formatDate = (dt) => {
    return new Date(dt).toUTCString().substring(0,16);
}