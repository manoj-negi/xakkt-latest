const Department = require("../../models/department");
const store = require("../../models/store");
const { validationResult } = require("express-validator");
const imageUpload = require("../../helper/imageUpload");
(exports.list = async (req, res) => {
  try {
    let departments = await Department.find().exec();
    if (!departments.length)
      return res.render("admin/department/listing", {
        menu: "departments",
        submenu: "list",
        departments: "",
        success: await req.consumeFlash("success"),
        failure: await req.consumeFlash("failure"),
      });
    return res.render("admin/department/listing", {
      menu: "departments",
      submenu: "list",
      departments: departments,
      success: await req.consumeFlash("success"),
      failure: await req.consumeFlash("failure"),
    });
  } catch (err) {
    res.status(400).json({
      status: "success",
      message: "Department added successfully",
      data: err,
    });
  }
}),
  (exports.create = async (req, res) => {
    try {
      res.render("admin/department/create", {
        menu: "departments",
        submenu: "create",
      });
    } catch (err) {
      res.status(400).json({ status: "false", data: err });
    }
  }),
  (exports.edit = async (req, res) => {
    try {
      const departments = await Department.findById(req.params.id).exec();
      res.render("admin/department/edit", {
        status: "success",
        message: "",
        departments: departments,
        menu: "departments",
        submenu: "create",
      });
    } catch (err) {
      res.status(400).json({ status: "false", data: err });
    }
  }),
  (exports.save = async (req, res) => {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const departmentinfo = {
        name: req.body.name,
        description: req.body.description,
        logo: req.file.filename,
      };
      let department = await Department.create(departmentinfo);
      const folder = "departments/";
      await imageUpload.uploadNew(req, folder);
      await req.flash("success", "Department added successfully!");
      res.redirect("/admin/departments");
    } catch (err) {
      await req.flash("failure", err.message);
      res.redirect("/admin/departments");
      //  res.status(400).json({data: err.message});
    }
  });

exports.update = async function (req, res) {
  try {
    const errors = await validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const departmentinfo = {
      name: req.body.name,
      description: req.body.description,
    };

    if (req.file) {
      departmentinfo.logo = req.file.filename;
      const folder = "departments/";
      await imageUpload.uploadNew(req, folder);
    }

    const department = await Department.findByIdAndUpdate(
      { _id: req.params.id },
      departmentinfo,
      { new: true, upsert: true }
    );
    if (department) {
      await req.flash("success", "Department updated successfully!");
      res.redirect("/admin/departments");
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Department not found" });
    }
  } catch (err) {
    console.log(err);
    await req.flash("failure", err.message);
    res.redirect("/admin/departments");
    // res.status(400).json({status:false, message: "Not updated", data:err});
  }
};

exports.delete = async (req, res) => {
  Department.deleteOne({ _id: req.params.id }, function (err) {
    if (err) return res.status(400).json({ data: err });
    req.flash("success", "Department deleted successfully!");
    res.redirect("/admin/departments");
    //  return res.json({status:true, message: "Department Deleted", data:[]});
  });
};
