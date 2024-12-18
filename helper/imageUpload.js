const AWS = require("aws-sdk");
const fs = require("fs");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_BUCKET_REGION,
});

exports.uploadNew = async (req, folder) => {
  try {
    const file = req.file.filename;
    const absoluteFilePath = req.file.path;
    fs.readFile(absoluteFilePath, async (err, data) => {
      const params = {
        Bucket: `${process.env.AWS_BUCKET_NAME}`,
        Key: folder + file,
        Body: data,
        ContentType: "image/*",
      };
      s3.upload(params, function (s3Err, data) {
        if (s3Err) throw s3Err;
        console.log(`File uploaded successfully at ${data.Location}`);
      });
    });
  } catch (error) {
    console.log("catch error = ", error);
    return;
  }
};
