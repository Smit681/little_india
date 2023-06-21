const userModel = require("../models/user")

const express = require('express');
const path = require('path');
const bcrypt = require("bcryptjs");
const router = express.Router();
var bodyParser = require('body-parser')

// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
router.use(bodyParser.json())



// Set up the login page
router.get("/signIn", (req, res) => {
    res.render("user/signIn");
});

router.post("/signIn", (req, res) => {
    // TODO: Validate the form information.
    const { email, password, choose } = req.body;
    let valid = true;
    let validation = {};

    if (typeof email !== 'string' || email.trim().length === 0) {
        valid = false;
        validation.email = "Please Enter Email address Here!"
    }
    if (typeof password !== 'string' || password.trim().length === 0) {
        valid = false;
        validation.password = "Please Enter Password Here!"
    }

    if (valid) {
        let errors = [];

        // Search MongoDB for a document with the matching email address.
        userModel.findOne({
            email: email
        })
            .then(user => {
                // Completed the search.
                if (user) {
                    // Found the user document.
                    // Compare the password entered in the form with the one in the user document.
                    bcrypt.compare(password, user.password)
                        .then(isMatched => {
                            // Done comparing the passwords.

                            if (isMatched) {
                                // Passwords match.

                                // Create a new session and store the user document (object)
                                // to the session.
                                req.session.user = user;
                                req.session.cart = {};
                                req.session.cart.userid = user._id;
                                req.session.dashbord = choose;
                                if (req.session.dashbord == "Customer")
                                    res.redirect("/menu");
                                else {
                                    res.redirect("/kit/modify");
                                }
                            }
                            else {
                                // Passwords to not match.
                                console.log("Passwords do not match.");
                                validation.password = "Sorry, your password does not match our database.";
                                res.render("user/signIn", {
                                    values: req.body,
                                    validation
                                });
                            }
                        })
                        .catch(err => {
                            // Couldn't compare passwords.
                            console.log(`Unable to compare passwords ... ${err}`);
                            errors.push("Oops, something went wrong.");

                            res.render("user/signIn", {
                                errors
                            });
                        });

                }
                else {
                    // User was not found in the database.
                    console.log("User not found in the database.");
                    validation.email = "Email not found in the database.";
                    res.render("user/signIn", {
                        values: req.body,
                        validation
                    });
                }
            })
            .catch(err => {
                // Couldn't query the database.
                console.log(`Error finding the user in the database ... ${err}`);
                errors.push("Oops, something went wrong.");

                res.render("user/signIn", {
                    errors
                });
            });
    }
    else {
        res.render("user/signIn", {
            values: req.body,
            validation
        });
    }
});



router.get("/logout", (req, res) => {
    // Clear the session from memory.
    req.session.destroy();

    res.redirect("/user/signIn");
});


// Set up a registration page
router.get("/registration", (req, res) => {
    res.render("user/registration");
});

router.post("/registration", (req, res) => {
    // TODO: Validate the form information.
    const { firstname, lastname, email, password } = req.body;
    let valid = true;
    let validation = {};

    if (typeof firstname !== 'string' || firstname.trim().length === 0) {
        valid = false;
        validation.firstname = "Please Enter Firstname Here!"
    }
    if (typeof lastname !== 'string' || lastname.trim().length === 0) {
        valid = false;
        validation.lastname = "Please Enter Lastname Here!"
    }

    function validateEmail(email) {
        const re = /^\S+@\S+\.\S+$/;
        return re.test(String(email).toLowerCase());
    }
    if (typeof email !== 'string' || validateEmail(email) == false) {
        valid = false;
        validation.email = "Kindly Check Your Email Address And Try Again!"
    }

    function validatePassword(password) {
        const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@%$?&]).{6,12}$/;
        return re.test(String(password));
    }
    if (typeof password !== 'string' || validatePassword(password) == false) {
        valid = false;
        validation.password = "Password should be between 6 to 12 characters and contains at least one lowercase letter, uppercase letter, number and symbol(!@%$?&)"
    }

    if (valid) {
        const user = new userModel({
            firstName: firstname,
            lastName: lastname,
            email: email,
            password: password
        });

        user.save()
            .then((userSaved) => {
                // User was saved correctly.
                res.render("user/signIn");
                   
            })
            .catch((err) => {
                console.log(`Error adding user to the database ... ${err}`);
                res.render("user/registration", {
                    values: req.body,
                    validation
                });
            });
    }
    else {
        res.render("user/registration", {
            values: req.body,
            validation
        });
    }
});

module.exports = router;