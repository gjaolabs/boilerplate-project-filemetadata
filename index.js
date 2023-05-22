const express = require('express');
const cors = require('cors');
require('dotenv').config()
const mongoose = require("mongoose");
const multer = require("multer")
const app = express();
const fs = require("fs"); 


mongoose.connect(process.env.DB_URI)
.then(console.log("DB CONNECTION SUCCESFUL"))
.catch((err)=>console.error(err));


app.get("/db-health", (req, res) => {
  res.json({status: mongoose.connection.readyState})
})

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// You can submit a form that includes a file upload.
// The form file input field has the name attribute set to upfile.
// When you submit a file, you receive the file name, type, and size in bytes within the JSON response.

const imageSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: Buffer
})

const Image = mongoose.model("Image", imageSchema)

const storage = multer.diskStorage({
  destination: function (req, file, cb){
    cb(null, "uploads/");
  },
  filename: function (req, file, cb){
    cb (null, file.originalname);
  }
})

const upload = multer({storage: storage});

app.post("/api/fileanalyse", upload.single("upfile"), async (req, res) => {
  const uploadedFile = req.file;
  console.log(uploadedFile);

  const newImage = new Image({
    filename: uploadedFile.originalname,
    contentType: uploadedFile.mimetype,
    size: uploadedFile.size,
    data: fs.readFileSync(uploadedFile.path)
  })

  try{
    await newImage.save()
  }
  catch(err){
    console.log("Error saving image to MongoDB:", err);
    return res.status(500).send("Internal Server Error")
  }

  fs.unlinkSync(uploadedFile.path)

  res.json({
    name: uploadedFile.originalname,
    type: uploadedFile.mimetype,
    size: uploadedFile.size
  })

})

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log('Your app is listening on port ' + port)
});
