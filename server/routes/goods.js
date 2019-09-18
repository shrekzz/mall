var express = require('express')
var router = express.Router()
var mongoose = require('mongoose')
var Goods = require('../models/goods')

var app = express();
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//连接数据库
mongoose.connect('mongodb://127.0.0.1:27017/dumall')

mongoose.connection.on("connected",() =>{
    console.log("mongoDB connected success")
})

mongoose.connection.on("error",() =>{
    console.log("mongoDB connected fail")
})

mongoose.connection.on("disconnected",() =>{
    console.log("mongoDB connected disconnected")
})

router.get("/list", function(req, res, next) {
    
    let params = {}
    let sort = req.query.sort
    let page = parseInt(req.query.page)
    let pageSize = parseInt(req.query.pageSize)
    let skip = (page-1)*pageSize
    let priceLevel = req.query.priceLevel
    let gt = ''
    let lte = ''
    if(priceLevel != 'all'){
        switch(priceLevel){
            case '0': 
                gt = 0
                lte = 500
                break
            case '1': 
                gt = 500
                lte = 1000
                break
            case '2': 
                gt = 1000
                lte = 2000
                break
            case '3': 
                gt = 2000
                lte = 3000
                break
            case '4': 
                gt = 3000
                lte = 4000
                break
        }
        params = {
            salePrice:{
                $gt: gt,
                $lte: lte
            }
        }
    }
    let goodsModel = Goods.find(params).sort({'salePrice':sort}).skip(skip).limit(pageSize)
    
    goodsModel.exec(function (err,doc) {
        if(err){
            res.json({
                status: '1',
                msg: err.message
            });
        }else{
            res.json({
                status: '0',
                msg: '',
                result: {
                    count:doc.length,
                    list: doc
                }
            })
        }
    })
    
})

router.post("/addCart", function(req, res, next) {
    var userId = req.cookies.userId
    var productId = req.body.productId
    var User = require('./../models/users')
    User.findOne({userId: userId}, (err, userDoc) => {
        if(err){
            res.json({
                status: "1",
                msg: err.message
            })
        }else{
            if(userDoc){
                let goodsItem = ""
                userDoc.cartList.forEach( item => {
                    if(item.productId == productId ){
                        goodsItem = item
                        item.productNum ++
                    }
                })
                if(goodsItem){
                    userDoc.save((err2, doc2) => {
                        if(err2){
                            res.json({
                                status: "1",
                                msg: err.message
                            }) 
                        }else{
                            res.json({
                                status: "0",
                                msg: '',
                                result: "suc"
                            }) 
                        }
                    })
                }else{
                    Goods.findOne({productId: productId}, (err1,doc1) => {
                        if(err1){
                            res.json({
                                status: "1",
                                msg: err.message
                            }) 
                        }else{
                            if(doc1){
                                doc1.productNum = 1
                                doc1.checked = '1'
                                userDoc.cartList.push(doc1)
                                userDoc.save((err2, doc2) => {
                                    if(err2){
                                        res.json({
                                            status: "1",
                                            msg: err.message
                                        }) 
                                    }else{
                                        res.json({
                                            status: "0",
                                            msg: '',
                                            result: "suc"
                                        }) 
                                    }
                                })
                            }
                        }
                    })
                }
               
            }
        }
    })
})

module.exports = router;