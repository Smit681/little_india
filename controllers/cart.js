const express = require("express");
const mealKitmodel = require('../models/kit');
const cartModel = require('../models/cart');
const e = require("express");

const router = express.Router();

router.get("/display/:id", (req, res) => {
    if (req.session && req.session.user) {
        let kitid = req.params.id;
        mealKitmodel.find({ _id: kitid }).lean().exec()
            .then(kit => {
                let a = kit[0]
                res.render("cart/display", {
                    a
                })
            })
    }
    else {
        res.redirect("/user/signIn");
    }

})


router.get("/add-kit/:id", (req, res) => {
    const kitId = req.params.id;
    if (req.session.user) {
        //user is logged in

        mealKitmodel.find({ "_id": kitId }).lean().exec()
            .then(kit => {
                //mealkit is found in the databse

                //add quantity element to kit array.
                kit[0].quantity = 1;

                cartModel.find({ "userId": req.session.user._id }).lean().exec()
                    .then(foundCart => {

                        if (foundCart.length != 0) {
                            //logged in user has items in cart so I need to update kit in the cart

                            //find if user has selected mealkit in the cart or not.
                            let found = false;
                            let newquantity;
                            foundCart[0].mealkits.forEach(foundKit => {

                                if (foundKit._id.toString() == kit[0]._id.toString()) {
                                    newquantity = foundKit.quantity + 1;
                                    found = true;
                                }
                            });
                            if (found) {
                                //user has same mealkit in cart so just increase quantity by 1
                                cartModel.updateOne({ "mealkits._id": kit[0]._id }, {
                                    "$set": { "mealkits.$.quantity": newquantity }
                                })
                                    .then(() => {

                                        res.redirect("/menu");
                                    })
                            }
                            else {
                                //user do not have selected mealkit in the cart. 
                                cartModel.updateOne({ "userId": req.session.user._id }, {
                                    "$push": { "mealkits": kit }
                                })
                                    .then(updated => {

                                        res.redirect("/menu");
                                        console.log("new mealkit is added to the cart");
                                    })
                                    .catch(err => {
                                        console.log("error updating cart: " + err);
                                        error = "please try again later"
                                        res.render("partials/err", {
                                            error
                                        });
                                    })
                            }
                        }
                        else {
                            //logged in user do not has anything in cart. So I need to make new cart

                            var cart = req.session.cart;

                            cartModel.find({ "mealkits._id": kitId }).lean().exec()
                                .then(cart => {


                                    //create new cart and add selected mealkit in the cart.

                                    const newCart = new cartModel({
                                        userId: req.session.user._id,
                                        mealkits: kit
                                    })

                                    //save cart
                                    newCart.save()
                                        .then((saved) => {

                                            res.redirect("/menu");
                                        })
                                })
                                .catch((err) => {
                                    console.log("error : " + err);
                                    error = "please try again later"
                                    res.render("/partials/err", {
                                        error
                                    });
                                })
                        }

                    })
                    .catch(err => {
                        //error finding userid in cart
                        console.log("error: " + err);
                        error = "please try again later"
                        res.render("partials/err", {
                            error
                        });
                    })
            })
            .catch(err => {
                //mealkit cannot be found.
                error = "please try again later"
                res.render("/partials/err", {
                    error
                });
                console.log("Can't find mealkit: " + err);
            })

    }
    else {
        error = "Please Log in first.";
        res.render("/partials/err", {
            error
        });
    }

})

router.get("/shopping-cart", (req, res) => {
    cartModel.find({ userId: req.session.user._id }).lean().exec()
        .then(cart => {
            let totalAmount = 0;
            let kits = [];
            let found = false;
            if (cart.length > 0) {
                cart[0].mealkits.forEach(kit => {
                    totalAmount += (kit.price * kit.quantity);
                })
                kits = cart[0].mealkits;
                found = true;
            }

            res.render("cart/shopping-cart", {
                kits,
                totalAmount,
                found
            })
        })
})

router.get("/checkout", (req, res) => {

    cartModel.find({ userId: req.session.user._id }).lean().exec()
        .then(cart => {
            let mealkits = cart[0].mealkits;
            cartModel.deleteOne({ userId: req.session.user._id })
                .then(() => {
                    console.log("Order placed successfully");
                    let e = "";
                    let counter = 1;
                    let totalAmount = 0;
                    mealkits.forEach(kit => {
                        e += counter
                        e += kit.tital;
                        e += "          ";
                        e += "quantity: ";
                        e += kit.quantity;
                        e += "          ";
                        e += "Price : $";
                        e += kit.price;
                        e += "<br>"
                        counter++;
                        totalAmount += (kit.price * kit.quantity);

                    })

                    const sgMail = require("@sendgrid/mail");
                    sgMail.setApiKey(process.env.SENDGRID_APIKEY);
                    const msg = {
                        to: `${req.session.user.email}`,
                        from: 'syshah3@myseneca.ca',
                        subject: 'Order Summery',
                        html: `<center><b>Your order has been places.<b><center><br> 
                        Order details: <br> ${e}<br> Total Price: ${totalAmount}`

                    };
                    sgMail.send(msg)
                        .then(() => {
                            console.log("email is sent");
                            res.render("partials/err", {
                                error: "Your order has been placed. Check your email for details. Thank you for purchasing from Foodhub."
                            })
                        })
                        .catch((err) => {
                            console.log("error sending email: " + err);
                        })
                })
        })


})

module.exports = router;