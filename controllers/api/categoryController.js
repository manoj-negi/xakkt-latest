const ProductCategory = require('../../models/product_category');
const _global = require('../../helper/common')
const Product = require('../../models/product')
var moment = require('moment');
const { validationResult } = require('express-validator');


exports.list = async (req, res)=>{
	
	  try{
			let categories = await ProductCategory.find({ parent_id: { $eq: null } }).select('name slug').lean();
			if(!categories.length) return res.json({status: "false", message: "No data found", data: category});
			
			var data = [...categories]
			
			//categories.childs = []
		    for (const [i,category] of categories.entries()) {    	
				chidCats = await ProductCategory.find({ parent_id: category._id }).select('name slug').exec();
				if(chidCats.length){
					categories[i].child = chidCats
					console.log(categories.childs)
				}
				
			  }
			return res.json({status: 1, message: "", data: categories});
			
	   }catch(err){
		   console.log(err)
			res.status(400).json({status: 1, message: "Something Went wrong", data: err});
	   }
},

exports.show =  async (req, res)=> { 
	try{
		const category = await ProductCategory.findById(req.params.id).exec();
		if(!category) return res.json({status: "success", message: "Category not found", data: []});
		return res.json({status: 1, message: "", data: category});
	 }catch(err){
		res.status(400).json({status:0, data: err});
   }
	
	
},
exports.create = async(req, res) => { 

				const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}

				try{
					const categoryInfo = new ProductCategory({
						name: req.body.name, 
						parent_id: req.body.parent_id,
						_store: req.body._store,
						logo:req.body.logo
					})
				
				const category = await ProductCategory.create(categoryInfo);
				res.json({status: 1, message: "Category added successfully", data: category});
			
				}catch(err){
					res.status(400).json({data: err.message});
				}				
					
			}; 


exports.productbyParentCategory = async function(req, res){
	 try{
		var pageNo = (req.query.page)?parseInt(req.query.page):1
			
		const pc = await ProductCategory.findById(req.params.id).select('_products').populate('_products');
		totalItem=pc._products.length;
		var option = {sort: { 'name.english': 1 }}
		option.limit = 4

		if(pageNo!=1){ option.skip = option.limit*(pageNo-1) }


		const category = await ProductCategory.find({$or: [{parent_id:req.params.id},{_id:req.params.id}]})
									.populate({
										path:'_products',
										select:'-crv -meta_description -_category -__v -cuisine -brand_id -createdAt -updatedAt -meta_title -meta_keywords',
										option:option,
										populate:{ path:'_unit', select:'-createdAt -updatedAt -__v'}
									}).lean()

		var bigArr= []		
					
		 category.map((data)=>{			
			bigArr = bigArr.concat(data._products)
		})	
							
		var storeProduct = []
		await Promise.all(bigArr.map(async (product) => {
			var data = {}
			var productId = product._id.toString();
			var productPrice = await _global.productprice(req.query._store, productId)
			
			if(productPrice)
			{ 
				data = {
					...data,
					_id: product._id,
					name: product.name,
					unit: product._unit?.name??'n/a',
					weight: product.weight,
					description: product.description,
					is_favourite: 0,
					in_shoppinglist: 0,
					in_cart: 0,
					image: product.image,
					deal_price: productPrice.deal_price,
					regular_price: productPrice.regular_price
				}

			}else{
					data = {
						...data,
						_id: product._id,
						name: product.name,
						unit: product._unit?.name??'n/a',
						weight: product.weight,
						description: product.description,
						is_favourite: 0,
						in_shoppinglist: 0,
						in_cart: 0,
						image: product.image
					}
			}

			
			storeProduct.push(data) 
			

		}))							

		var result = {}
		result.status=1;
		var totalPages = Math.ceil(totalItem/option.limit)
		if(totalPages-1!=pageNo)result.nextPage=pageNo+1	
		result.data=storeProduct;

		return res.json({data:result});							

	 }catch(err){
		 console.log(err)
		return res.status(400).json({error:err});
	 }
}, 

exports.productsByCategory = async function(req, res){
		try{
			
			var pageNo = (req.query.page)?parseInt(req.query.page):1
			const pc = await ProductCategory.findById(req.params.id).select('_products').populate('_products');
			if(!pc)return res.json({status:0, message:"no data found"});

			totalItem=pc._products.length;
			var option = {sort: { 'name.english': 1 }}
			option.limit = 25

			if(pageNo!=1){ option.skip = option.limit*(pageNo-1) }
			
			const category = await ProductCategory.findById(req.params.id)
									.populate({
										path:'_products',
										select:'-crv -meta_description -_category -__v -cuisine -brand_id -createdAt -updatedAt -meta_title -meta_keywords',
										populate:{ path:'_unit', select:'-createdAt -updatedAt -__v'}
									})
			var storeProduct= []
		
            if(!category)return res.json({status:0, message:'Category not available'})
			await Promise.all(category._products.map(async (product) => {
				var data = {}
				var productId = product._id.toString();
				
				var productPrice = await _global.productprice(req.query._store, productId)
				if(productPrice)
				{ 
					data = {
						...data,
						_id: product._id,
						name: product.name,
						unit: product._unit?.name??'n/a',
						weight: product.weight,
						description: product.description,
						is_favourite: 0,
						in_shoppinglist: 0,
						in_cart: 0,
						image: product.image,
						deal_price: productPrice.deal_price,
						regular_price: productPrice.regular_price
				   }

			   }else{
						data = {
							...data,
							_id: product._id,
							name: product.name,
							unit: product._unit?.name??'n/a',
							weight: product.weight,
							description: product.description,
							is_favourite: 0,
							in_shoppinglist: 0,
							in_cart: 0,
							image: product.image
						}
			   }
	
				
			   storeProduct.push(data) 

				/*if (productId in cartProductList) {
					data.in_cart = cartProductList[productId]
				}
	
				if (wishlistids.includes(productId) && shoppinglistProductIds.includes(productId)) {
					data.is_favourite = 1,
					data.in_shoppinglist = 1
				} else if (shoppinglistProductIds.includes(productId)) {
					data.in_shoppinglist = 1
				} else if (wishlistids.includes(productId)) {
					data.is_favourite = 1
				} */
				
	
			}))
			var result = {}
			result.status=1;
			var totalPages = Math.ceil(totalItem/option.limit)
			if(totalPages-1!=pageNo)result.nextPage=pageNo+1	
			result.data=storeProduct;
			
			return res.json(result);
		}catch(err){
			console.log(err)
			return res.status(400).send(err);
		}
};

exports.update = async function(req, res){

	try{

		const errors = await validationResult(req);
				if (!errors.isEmpty()) {
					return res.status(400).json({ errors: errors.array() });
				}

		const categoryInfo = {
			name: req.body.name, 
			//parent_id: req.body.parent_id,
			logo:req.body.logo
		}

		//if(req.file){ userinfo.profile_pic=req.file.path.replace('public/',''); }
		const category =  await ProductCategory.findByIdAndUpdate(req.params.id, categoryInfo,{ new: true,	upsert: false});
		console.log(category)
			if(category)return res.json({status:1, message: "Category updated", data:category});
			return res.status(400).json({status:0, message: "Category not found"});
			
		} catch(err){ console.log(err)
			res.status(400).json({status:0, message: "Not updated", data:err});
		}
	

}

exports.delete = async(req,res)=>{
	ProductCategory.deleteOne({ _id: req.params.id }, function (err) {
		if (err) return handleError(err);
		 res.json({status:true, message: "Category Deleted", data:[]});
	  });
}

