const express = require('express');
const app = express();
const stripe = require('stripe')('sk_test_51HffMDHoj35pmsJhXJ5USfQTjIGow7ZSTXokHvYC7X0z1BdH4hnFfYbVUThMDVG7VZh9KzWct2T2BcZzHEX9ruaO00p3W2Mq1t');

stripe.setMaxNetworkRetries(2);


const url = require('url');
const querystring = require('querystring');

app.use(express.urlencoded({ extended: true }))
app.use(express.json());

app.get('/test',(req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ testData: 12345 }));
});

app.get('/',(req, res) => {
    responseJson.ReceivedData = req.body;
    res.send('-------------Fashion City Server-----------------');
});


app.post('/test',(req, res) => {
    let responseJson = {};
    responseJson.ReceivedData = req.body;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify({responseJson}));
});

app.get('/payment_success',(req,res)=>{
	let rawUrl = req.url;

	let parsedUrl = url.parse(rawUrl);
	let parsedQs = querystring.parse(parsedUrl.query);
	let sessionID = parsedQs.session_id;
	const responseJson = {};
	console.log("New Payment : ",sessionID);

	stripe.checkout.sessions.retrieve(sessionID).then((session)=>{
		    responseJson.amount_total=session.amount_total/100;
		    responseJson.payment_mothod_types = session.payment_method_types;
		    responseJson.payment_status = session.payment_status;
		    responseJson.city = session.shipping.address.city;
		    responseJson.country = session.shipping.address.country;
		    responseJson.line1 = session.shipping.address.line1;
		    responseJson.line2 = session.shipping.address.line2;
		    responseJson.postalCode = session.shipping.address.postel_code;
		    responseJson.state = session.shipping.address.state;
		    responseJson.name = session.shipping.name;

		const customer = stripe.customers.retrieve(session.customer).then((customer)=>{
		    responseJson.email = customer.email;
		    console.log(JSON.stringify(responseJson));
	            res.setHeader('Content-Type', 'application/json');
        	    res.end(JSON.stringify(responseJson));
		    return customer;
		});

	}).catch(error=>{
	        console.log(error);
	        res.setHeader('Content-Type', 'application/json');
        	res.end(JSON.stringify(error.json()));
	});


});

/*
line_items:[
      {
        price_data: {
          currency: 'INR',
          product_data: {
            name: 'Clothings and footwears',
          },
          unit_amount: req.body.totalAmount,
        },
        quantity: 1,
      },
    ]
*/
app.post('/create-checkout-session', async (req, res) => {
  let lineItems = [];

  req.body.items.forEach((item,index)=>{
    let newLineItem = {};

    newLineItem.price_data = {};

    newLineItem.price_data.currency = 'INR';

    newLineItem.price_data.product_data = {};
    newLineItem.price_data.product_data.name = item.name;

    newLineItem.price_data.unit_amount = item.price*100;

    newLineItem.quantity = item.quantity;
  
    lineItems.push(newLineItem);
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection : 'auto',
    shipping_address_collection: {
       allowed_countries: ['IN'],
    },
    line_items: lineItems,
    mode: 'payment',
    success_url: 'https://fashion-city.netlify.app/payment_success?session_id={CHECKOUT_SESSION_ID}',
    cancel_url: 'https://fashion-city.netlify.app/checkout',
  });
  res.json({ id: session.id });
});
const port = process.env.PORT || 80 ;
app.listen(port, () => console.log(`Listening on port ${5000}...`));


/*
const allowedOrigins = ['https://fashion-city.netlify.app/'];
  	const origin = req.headers.origin;
  	if (allowedOrigins.includes(origin)) {
       		res.setHeader('Access-Control-Allow-Origin', origin);
  	}
  	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  	res.header('Access-Control-Allow-Credentials', true);
*/
