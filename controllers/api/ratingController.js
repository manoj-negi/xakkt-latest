const Rating = require('../../models/rating');

exports.add = async(req, res) => { 
				try{
					let ratingInfo =  { 
						_user:  req.decoded.id,
						_product: req.body._product, 
						rating: req.body.rating
						}
                let rating = await Rating.create(ratingInfo);
                if(!rating) return res.json({message:"Something went wrong"})
			   return	res.json({status:1, message: "Value added successfully", data: rating});
				}catch(err){
                    console.log("--logs",err)
					res.status(400).json({data: err.message});
				}				
					
			}

