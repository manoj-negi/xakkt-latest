const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.stripe = async(req,res) =>{
    const token = await stripe.tokens.create({
        card: {
          number: req.body.cardno,
          exp_month: req.body.exp_month,
          exp_year: req.body.exp_year,
          cvc: req.body.cvc,
        },
      });
      const customer = await stripe.customers.create({
        source: token.id,
        // email: 'paying.user@example.com',
      });
    const charge = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: 'inr',
        customer: customer.id,
        description: 'My First Test Charge (created for API docs)',
      });
    //   console.log("--charge",charge)
      if(charge) return res.json({message:"Payment",data:charge})
      return res.json({message:"not"})
}

exports.updateCard = async (req,res) =>{
  try{

    const customer = await stripe.customers.update(
      'cus_LCK8cCUH5EkwCz',
      {metadata: {order_id: '6735'}}
    );
   return res.json({data:charge})
  }catch (err) {
   console.log("--err", err)
   return res.status(400).json({ data: "Something Went Wrong" });
   }
}

exports.saveCard = async (req,res) =>{
   try{

  /*  const token = await stripe.tokens.create({
      card: {
        name:"manoj singh negi",
        number: '4242424242424242',
        exp_month: 2,
        exp_year: 2023,
        cvc: '314',
      },
    });*/

   /* const card = await stripe.customers.createSource(
      'cus_LCJvZ5lSoLqs8o',
      {source: 'tok_visa'}
    );*/
    /*const customer = await stripe.customers.create({
      source: 'tok_mastercard',
      email: 'paying.user@example.com',
    });
    console.log('the -- custome-- ',customer);
*/
    const charge = await stripe.charges.create({
      amount: 1000,
      currency: 'usd',
      customer: 'cus_LCJvZ5lSoLqs8o',
    });
    return res.json({data:charge})
   }catch (err) {
		console.log("--err", err)
		return res.status(400).json({ data: "Something Went Wrong" });
    }
}