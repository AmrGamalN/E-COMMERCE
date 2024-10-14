//deletefile After time
const path = require("path");
const fs = require("fs");
const pathFile = path.join(__dirname, "../uploads/imageUser/");

const read = fs.readdirSync(pathFile, "utf-8");
const deleteFile = () => {
  for (let i = 0; i < read.length; i++) {
    fs.unlink(pathFile + read[i], (err) => {
      if (err) throw err;
    });
  }
};

const deleteImageAfterTime = () => {
  setTimeout(() => {
    deleteFile();
  }, 1000);
};
deleteImageAfterTime();
module.exports = deleteImageAfterTime;
