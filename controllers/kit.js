const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const path = require("path");
const mealKitModel = require("../models/kit");

router.get("/modify", (req, res) => {
    if (req.session && req.session.user) {
        mealKitModel.find().lean().exec()
            .then((kits) => {
                res.render("kit/modify", {
                    kits
                });
            })
    }
    else {
        res.redirect("/user/signIn");
    }

})

router.get("/add", (req, res) => {
    res.render("kit/add");
})

router.post("/add", (req, res) => {
    console.log(req.body[8]);
    let newkit = new mealKitModel({
        tital: req.body.Title,
        ingrediants: req.body.ing,
        descrition: req.body.des,
        category: req.body.cat,
        price: req.body.price,
        cooking_time: req.body.time,
        serving: req.body.ser,
        calories_per_serving: req.body.cal,
        top_meal: req.body.choose,
        image_url: "temp"
    });

    newkit.save()
        .then((saved) => {

            // Create a unique name for the image, so it can be stored in the file system.
            let uniqueName = `/image-pic-${saved._id}${path.parse(req.files.pic.name).ext}`;

            // Copy the image data to a file in the "public/pictures" folder.
            req.files.pic.mv(`public/pictures/${uniqueName}`)
                .then(() => {
                    uniqueName = "/pictures" + uniqueName;
                    // Update the kits document so that the name of the image is stored in the document.
                    mealKitModel.updateOne({
                        _id: saved._id
                    }, {
                        image_url: uniqueName
                    })
                        .then(() => {
                            console.log("User document was updated with the profile picture.");
                            res.redirect("/");
                        })
                        .catch(err => {
                            console.log(`Error updating the user's profile picture ... ${err}`);
                            res.redirect("/");
                        })
                });

        })
        .catch((err) => {
            console.log(err);
        })
});

router.get("/update/:id", (req, res) => {
    let kitid = req.params.id;
    mealKitModel.find({ _id: kitid }).lean().exec()
        .then((kit) => {
            let a = kit[0];
            res.render("kit/update", {
                a
            });
        })
})

router.post("/update", (req, res) => {
    let saved_id;
    mealKitModel.find({ tital: req.body.Title })
        .count({}, (err, count) => {
            if (count != 1) {
                res.render("partials/err", {
                    error: "Can not find mealkit"
                })
            }
        })

    mealKitModel.find({ tital: req.body.Title })
        .then(kit => {
            console.log(kit._id);
            saved_id = kit._id;


            if (path.parse(req.files.pic.name).ext == '.jpeg' || path.parse(req.files.pic.name).ext == '.jpg' || path.parse(req.files.pic.name).ext == ".HEIF" || path.parse(req.files.pic.name).ext == ".png") {
                let uniqueName = `/image-pic-${saved_id}${path.parse(req.files.pic.name).ext}`;

                req.files.pic.mv(`public/pictures/${uniqueName}`)
                    .then(() => {
                        uniqueName = "/pictures" + uniqueName;
                        mealKitModel.updateOne({
                            tital: req.body.Title
                        }, {
                            tital: req.body.Title,
                            ingrediants: req.body.ing,
                            descrition: req.body.des,
                            category: req.body.cat,
                            price: req.body.price,
                            cooking_time: req.body.time,
                            serving: req.body.ser,
                            calories_per_serving: req.body.cal,
                            top_meal: req.body.top,
                            image_url: uniqueName
                        })
                            .then(() => {
                                console.log("Mealkit updated");
                                res.redirect("/");
                            })
                            .catch(err => {
                                console.log("Error updating mealkit: " + err);
                                res.redirect("/");
                            })
                    });
            }
            else {
                res.send('Please enter .jpeg or .jpg formate picture');
            }
        })
})



module.exports = router;