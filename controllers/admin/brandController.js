const Brand = require("../../models/brand");
const { validationResult } = require("express-validator");
const imageUpload = require("../../helper/imageUpload");

(exports.create = async (req, res) => {
  try {
    res.render("admin/brand/create", { menu: "brands", submenu: "create" });
  } catch (err) {
    res.status(400).json({ status: "false", data: err });
  }
}),
  (exports.save = async (req, res) => {
    try {
      const brandinfo = {
        name: req.body.name,
        logo: req.file?.filename ?? null,
        description: req.body?.description ?? null,
        status: req.body.status,
      };
      // categoryInfo.parent_id = (req.body.parent_id) ? req.body.parent_id : null;

      const brand = await Brand.create(brandinfo);
      const folder = "brands/";
      await imageUpload.uploadNew(req, folder);
      await req.flash("success", "Brand added successfully!");
      res.redirect("/admin/brand");
    } catch (err) {
      await req.flash("failure", err.message);
      res.redirect("/admin/brand");
      // res.status(400).json({ data: err.message });
    }
  });
exports.listing = async (req, res) => {
  try {
    let brand = await Brand.find().exec();
    if (!brand.length)
      return res.render("admin/brand/listing", {
        menu: "brands",
        submenu: "list",
        brand: "",
        success: await req.consumeFlash("success"),
        failure: await req.consumeFlash("failure"),
      });
    return res.render("admin/brand/listing", {
      menu: "brands",
      submenu: "list",
      brand: brand,
      success: await req.consumeFlash("success"),
      failure: await req.consumeFlash("failure"),
    });
  } catch (err) {
    res.status(400).json({ data: err.message });
  }
};
exports.delete = async (req, res) => {
  Brand.deleteOne({ _id: req.params.id }, function (err) {
    if (err) return res.status(400).json({ data: err });
    req.flash("success", "Brand deleted successfully!");
    res.redirect("/admin/brand");
    //  return res.json({status:true, message: "Department Deleted", data:[]});
  });
};
exports.edit = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id).exec();
    res.render("admin/brand/edit", {
      status: "success",
      message: "",
      brand: brand,
      menu: "Brand",
      submenu: "edit",
    });
    // res.json({status: "success", message: "", data: departments});
  } catch (err) {
    res.status(400).json({ status: "false", data: err });
  }
};
exports.update = async function (req, res) {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const brandinfo = {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
    };

    if (req.file) {
      brandinfo.logo = req.file.filename;
      const folder = "brands/";
      await imageUpload.uploadNew(req, folder);
    }

    const brand = await Brand.findByIdAndUpdate(
      { _id: req.params.id },
      brandinfo,
      { new: true, upsert: true }
    );
    if (brand) {
      await req.flash("success", "Brand updated successfully!");
      res.redirect("/admin/brand");
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Brand not found" });
    }
  } catch (err) {
    console.log(err);
    await req.flash("failure", err.message);
    res.redirect("/admin/brand");
    // res.status(400).json({status:false, message: "Not updated", data:err});
  }
};
