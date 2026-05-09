// middlewares/upload.js
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = {
  upload: upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
     { name: 'bannerImage', maxCount: 1 }
  ]),
  uploadSingle: upload.single('image')
};
