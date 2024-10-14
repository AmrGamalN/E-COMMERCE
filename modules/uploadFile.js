const multer = require("multer");
const path = require("path");
const { handleError } = require("../handleCheck/checkError");

//upload user image
const template = path.join(__dirname, "../uploads/imageUser");
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, template);
  },
  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 10000000);
    const ext = path.extname(file.originalname).toLowerCase();
    const file_name = uniqueSuffix + "_" + ext;
    cb(null, file_name);
  },
});

const uploadUserImage = multer({
  storage: storage,
  limits: { fileSize: 2000000 },
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      cb(new Error("Error: Unacceptable file format [EXTINCATION]"), false);
    } else {
      cb(null, true);
    }
  },
}).any();

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2

//upload category image
const storageCateroy = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./uploads/imageCategory");
  },
  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 10000000);
    const ext = path.extname(file.originalname).toLowerCase();
    const file_name = uniqueSuffix + "_" + ext;
    cb(null, file_name);
  },
});

const uploadCategoryImage = multer({
  storage: storageCateroy,
  limits: { fileSize: 20000000 }, // In bytes: 2000000 bytes = 2 MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    // const ext = file.mimetype;
    // const extname = ext.split("/")[1];
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      cb(new Error("Error: Unacceptable file format [EXTINCATION]"), false);
    } else {
      cb(null, true);
    }
  },
});
const cpSingle = uploadCategoryImage.fields([
  { name: "categoryImage", maxCount: 1 },
]);

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

//upload product image
// const template = path.join(__dirname, "./uploads/imageProducts");
const storageProduct = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./uploads/imageProducts");
  },
  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 10000000);
    const ext = path.extname(file.originalname).toLowerCase();
    const file_name = uniqueSuffix + "_" + ext;
    cb(null, file_name);
  },
});

const uploadProductImage = multer({
  storage: storageProduct,
  limits: { fileSize: 2000000 }, // In bytes: 2000000 bytes = 2 MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    // const ext = file.mimetype;
    // const extname = ext.split("/")[1];
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      cb(new Error("Error: Unacceptable file format [EXTINCATION]"), false);
    } else {
      cb(null, true);
    }
  },
});
const cpUpload = uploadProductImage.fields([{ name: "gallery", maxCount: 4 }]);

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
//upload page banners and Products image
// const template = path.join(__dirname, "./uploads/imageProducts");
const storageBannersPage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, "./uploads/imageBannersAndProductsPage");
  },
  filename(req, file, cb) {
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 10000000);
    const ext = path.extname(file.originalname).toLowerCase();
    const file_name = uniqueSuffix + "_" + ext;
    cb(null, file_name);
  },
});

const uploadBannersPage = multer({
  storage: storageBannersPage,
  limits: { fileSize: 20000000 }, // In bytes: 2000000 bytes = 2 MB
  fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    // const ext = file.mimetype;
    // const extname = ext.split("/")[1];
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      cb(new Error("Error: Unacceptable file format [EXTINCATION]"), false);
    } else {
      cb(null, true);
    }
  },
});

const BannersPage = uploadBannersPage.fields([
  { name: "galleryBanners", maxCount: 2 },
  { name: "galleryProducts", maxCount: 50 },
]);

// const ProductsPage = uploadProductsPage.fields([
//   { name: "galleryProducts", maxCount: 50 },
// ]);

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

module.exports = {
  uploadUserImage,
  cpUpload,
  cpSingle,
  BannersPage,
};
