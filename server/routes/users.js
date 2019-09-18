var express = require('express');
var router = express.Router();
var User = require('./../models/users')
require('./../util/util')

/* GET users listing. */
router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});

router.post('/login', function (req, res, next) {
	var param = {
		userName: req.body.userName,
		userPwd: req.body.userPwd
	}
	User.findOne(param, (err, doc) => {
		if (err) {
			res.json({
				status: '1',
				msg: err.message,
			})
		} else {
			if (doc) {
				res.cookie('userId', doc.userId, {
					path: '/',
					maxAge: 1000*60*60
				})
				res.cookie('userName', doc.userName, {
					path: '/',
					maxAge: 1000*60*60
				})
				res.json({
					status: '0',
					msg: '',
					result: {
						userName: doc.userName
					}
				})
			}else{
				res.json({
					status: '2',
					msg: '',
				})
			}
		}
	})
})

router.post('/logout', function(req, res, next){
	res.cookie('userId', "", {
		path: '/',
		maxAge: -1
	})
	res.json({
		status: '0',
		msg: '',
		result: ''
	})
})

router.get('/checklogin', function(req, res, next){
	if(req.cookies.userId){
		res.json({
			status: '0',
			msg: '',
			result: req.cookies.userName || ''
		})
	}else{
		res.json({
			status: '1',
			msg: '未登录',
			result: ''
		})
	}
})

router.get('/cartList', function(req, res, next){
    let userId = req.cookies.userId
	User.findOne({userId:userId}, (err,doc) => {
		if(err){
			res.json({
				status: '1',
				msg: '',
				result: ''
			})	
		}else{
			if(doc){
				res.json({
					status: '0',
					msg:'',
					result: doc.cartList
				})
			}
		}
	})
	
})

router.post('/cartDel',function(req, res, next){
	let userId = req.cookies.userId
	let productId = req.body.productId
	User.update({'userId':userId}, {$pull:{ 'cartList':{'productId': productId}}},(err, doc) => {
		if(err){
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		}else{
			res.json({
				status: '0',
				msg: '',
				result:'suc'
			})
		}
	
	})
})

router.post('/cartEdit', function(req, res, next){
	let userId = req.cookies.userId
	let productId = req.body.productId
	let productNum = req.body.productNum
	let checked = req.body.checked
	User.update({'userId': userId, 'cartList.productId': productId}, {
		'cartList.$.productNum':productNum,
		'cartList.$.checked':checked
	}, (err, doc) => {
		if(err){
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		}else{
			res.json({
				status: '0',
				msg: '',
				result:'suc'
			})
		}
	})
})

router.post('/editCheckAll', function(req, res, next){
	let userId = req.cookies.userId
	let checkAll = req.body.checkAll
	User.findOne({userId: userId}, (err,user) => {
		if(err){
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		}else{
			if(user){
				user.cartList.forEach((item) => {
					item.checked = checkAll
				})
				user.save((err1,doc) => {
					if(err1){
						res.json({
							status: '1',
							msg: err1.message,
							result: ''
						})
					}else{
						res.json({
							status: '0',
							msg: '',
							result:'suc'
						})
					}
				})
			}
			
		}
	})
})

router.get('/addressList',function(req, res, next){
	let userId = req.cookies.userId
	User.findOne({userId: userId},(err, doc) => {
		if(err){
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		}else{
			res.json({
				status: '0',
				msg: '',
				result:doc.addressList
			})
		}
	})
})

router.post('/setDefault', function(req, res, next){
	var userId = req.cookies.userId
	var addressId = req.body.addressId
	if(!addressId){
		res.json({
			status: '1003',
			msg:'addressId is null',
			result:''
		})
	}else{
		User.findOne({userId: userId}, function(err, doc){
			if(err){
				res.json({
					status: '1',
					msg:'err.message',
					result:''
				})
			}else{
				var addressList = doc.addressList
				addressList.forEach((item) => {
					if(item.addressId == addressId){
						item.isDefault = true
					}else{
						item.isDefault = false
					}
				})

				if(doc){
					doc.save(function(err1, doc1){
						if(err){
							res.json({
								status: '1',
								msg:'err.message',
								result:''
							})
						}else{
							res.json({
								status: '0',
								msg: '',
								result: ''
							})
						}
					})
				}else{
					res.json({
						status: '',
						msg: '',
						result: ''
					})
				}
			}
		})
	}
	
})

//删除地址
router.post('/delAddress', function(req, res, next){
	var userId = req.cookies.userId
	var addressId = req.body.addressId
	User.update({'userId':userId}, {$pull:{ 'addressList':{'addressId': addressId}}},(err, doc) => {
		if(err){
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		}else{
			res.json({
				status: '0',
				msg: '',
				result:'suc'
			})
		}
	
	})
})

//支付
router.post('/payMent', function(req, res, next){
	var userId =req.cookies.userId
	var orderTotal = req.body.orderTotal
	var addressId = req.body.addressId
	User.findOne({userId: userId}, (err, doc) => {
		if(err){
			res.json({
				status: '1',
				msg: err.message,
				result: ''
			})
		}else{
			//获取当前用户的地址信息
			var address = ''
			var goodsList = []
			

			doc.addressList.forEach( (item) => {
				if(addressId == item.addressId){
					address = item
				}
			})
			//获取用户购物车的购买商品
			doc.cartList.filter( (item) => {
				if(item.checked == '1'){
					goodsList.push(item)
				}
			})
			
			var platform = '622'
			var r1 = Math.floor(Math.random()*10)
			var r2 = Math.floor(Math.random()*10)

			var sysDate = new Date().Format('yyyyMMddhhmmss')
			var createDate = new Date().Format('yyyy-MM-dd hh：mm:ss')
			var orderId = platform + r1 + sysDate + r2

			var order = {
				orderId: orderId,
				orderTotal: orderTotal,
				addressInfo:  address,
				goodsList: goodsList,
				orderStatus: '1',
				createDate: createDate
			}

			doc.orderList.push(order)

			doc.save((err1,doc1) => {
				if(err1){
						res.json({
						status: '1',
						msg: err.message,
						result: ''
					})
				}else{
					res.json({
						status: '0',
						msg: '',
						result: {
							orderId: order.orderId,
							orderTotal: order.orderTotal
						}
					})
				}
			})


			
		}
	})
})
//获取订单id
router.get('/orderDetail', function(req, res, next){
	var userId = req.cookies.userId
	var orderId = req.query.orderId
	User.findOne({ userId: userId}, function(err, userInfo){
		if(err){
			res.json({
				status:'1',
				message: err.message,
				result:''
			})
		}else{
			var orderList = userInfo.orderList
			if(orderList.length > 0){
				var orderTotal = 0
				orderList.forEach( (item)  => {
					if(item.orderId == orderId){
						orderTotal = item.orderTotal
					}
				})

				if(orderTotal>0){
					res.json({
						status: '0',
						message: '',
						result: {
							orderId: orderId,
							orderTotal: orderTotal
						}
					})
				}else{
					res.json({
						status:'12002',
						message: '无此订单'+orderId,
						result:''
					})
				}
			}else{
				res.json({
					status:'12001',
					message: '当前用户未创建订单',
					result:''
				})
			}
		}
	})

	
})

router.get('/getCartCount', function(req, res, next){
	if(req.cookies && req.cookies.userId){
		var userId = req.cookies.userId
		User.findOne({userId: userId}, (err, doc) => {
			if(err){
				res.json({
					status: '1',
					msg:err.message,
					result:''
				})
			}else{
				var cartList = doc.cartList
				let cartCount = 0
				cartList.map((item) => {
					cartCount += parseInt(item.productNum) 
				})
				res.json({
					status: '0',
					msg: '',
					result: cartCount
				})
			}
		})
	}
})
module.exports = router;
