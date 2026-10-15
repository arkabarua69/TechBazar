const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paytm = require('paytmchecksum');
const https = require('https');
const Payment = require('../models/paymentModel');
const ErrorHandler = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

// exports.processPayment = asyncErrorHandler(async (req, res, next) => {
//     const myPayment = await stripe.paymentIntents.create({
//         amount: req.body.amount,
//         currency: "inr",
//         metadata: {
//             company: "Flipkart",
//         },
//     });

//     res.status(200).json({
//         success: true,
//         client_secret: myPayment.client_secret, 
//     });
// });

// exports.sendStripeApiKey = asyncErrorHandler(async (req, res, next) => {
//     res.status(200).json({ stripeApiKey: process.env.STRIPE_API_KEY });
// });

// Process Payment
exports.processPayment = asyncErrorHandler(async (req, res, next) => {

    const { amount, email, phoneNo } = req.body;

    if (!amount || !email || !phoneNo) {
        return next(new ErrorHandler("Amount, Email, and Phone Number are required", 400));
    }

    var params = {};

    /* initialize an array */
    params["MID"] = process.env.PAYTM_MID;
    params["WEBSITE"] = process.env.PAYTM_WEBSITE;
    params["CHANNEL_ID"] = process.env.PAYTM_CHANNEL_ID;
    params["INDUSTRY_TYPE_ID"] = process.env.PAYTM_INDUSTRY_TYPE;
    params["ORDER_ID"] = "oid" + uuidv4();
    params["CUST_ID"] = process.env.PAYTM_CUST_ID;
    params["TXN_AMOUNT"] = JSON.stringify(amount);
    params["CALLBACK_URL"] = `https://${req.get("host")}/api/v1/callback`;
    params["EMAIL"] = email;
    params["MOBILE_NO"] = phoneNo;

    try {
        const checksum = await paytm.generateSignature(params, process.env.PAYTM_MERCHANT_KEY);
        let paytmParams = {
            ...params,
            "CHECKSUMHASH": checksum,
        };
        res.status(200).json({
            success: true,
            paytmParams
        });
    } catch (error) {
        console.error("Paytm signature generation failed:", error.message);
        return next(new ErrorHandler(`Payment processing failed: ${error.message}`, 500));
    }
});

// Paytm Callback
exports.paytmResponse = asyncErrorHandler(async (req, res, next) => {

    let paytmChecksum = req.body.CHECKSUMHASH;
    delete req.body.CHECKSUMHASH;

    let isVerifySignature = paytm.verifySignature(req.body, process.env.PAYTM_MERCHANT_KEY, paytmChecksum);
    
    if (!isVerifySignature) {
        console.error("Paytm checksum verification failed");
        return next(new ErrorHandler("Payment verification failed - Checksum mismatch", 400));
    }

    try {
        var paytmParams = {
            body: {
                "mid": req.body.MID,
                "orderId": req.body.ORDERID,
            }
        };

        const checksum = await paytm.generateSignature(JSON.stringify(paytmParams.body), process.env.PAYTM_MERCHANT_KEY);

        paytmParams.head = {
            "signature": checksum
        };

        var post_data = JSON.stringify(paytmParams);

        var options = {
            hostname: process.env.PAYTM_ENV === 'production' ? 'securegw.paytm.in' : 'securegw-stage.paytm.in',
            port: 443,
            path: '/v3/order/status',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': post_data.length
            }
        };

        let responseData = '';
        
        const post_req = https.request(options, async (post_res) => {
            post_res.on('data', (chunk) => {
                responseData += chunk;
            });

            post_res.on('end', async () => {
                try {
                    const parsedResponse = JSON.parse(responseData);
                    const { body } = parsedResponse;
                    
                    await addPayment(body);
                    res.redirect(`https://${req.get("host")}/order/${body.orderId}`);
                } catch (parseError) {
                    console.error("Paytm response parsing failed:", parseError.message);
                    return res.redirect(`https://${req.get("host")}/orders/failed`);
                }
            });
        });

        post_req.on('error', (error) => {
            console.error("Paytm verification request failed:", error.message);
            return res.redirect(`https://${req.get("host")}/orders/failed`);
        });

        post_req.write(post_data);
        post_req.end();

    } catch (error) {
        console.error("Paytm callback processing failed:", error.message);
        return next(new ErrorHandler(`Payment callback processing failed: ${error.message}`, 500));
    }
});

const addPayment = async (data) => {
    try {
        if (!data || !data.orderId) {
            console.error("Invalid payment data - missing orderId");
            return false;
        }
        const payment = await Payment.create(data);
        console.log(`Payment recorded: Order ${data.orderId}, Transaction ${data.txnId}`);
        return true;
    } catch (error) {
        console.error(`Payment recording failed for order ${data?.orderId}:`, error.message);
        return false;
    }
}

exports.getPaymentStatus = asyncErrorHandler(async (req, res, next) => {

    const payment = await Payment.findOne({ orderId: req.params.id });

    if (!payment) {
        return next(new ErrorHandler("Payment Details Not Found", 404));
    }

    const txn = {
        id: payment.txnId,
        status: payment.resultInfo.resultStatus,
    }

    res.status(200).json({
        success: true,
        txn,
    });
});
