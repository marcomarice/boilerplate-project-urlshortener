require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const app        = express();
const port       = process.env.PORT;
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');
const dns        = require('dns');

// Setup db
mongoose.connect(process.env['MONGO_URI'], {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const {Schema}  = mongoose;
const urlSchema = new Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: Number
});
const URLs = mongoose.model('URLs', urlSchema);

// Basic Configuration
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.post("/api/shorturl", (req, res) => {
  const url = req.body.url;
  const urlInfo = new URL(url);
  dns.lookup(urlInfo.hostname, (error, address, family) => {
    if(!error && urlInfo.protocol !== "ftp:"){
      URLs.find({original_url: url}, (error, data) => {
        if (error) return console.log(error);
        if (data.length>0) {
          return res.json({
            original_url: data[0].original_url,
            short_url: data[0].short_url
          });
        }else{
          URLs.countDocuments({}, (error, count) => {
            if (error) return console.log(error);
            let Url = new URLs({
              original_url: url,
              short_url: count+1
            });
            Url.save((error, data) => {
              if (error) return console.log(error);
              return res.json({
                original_url: data.original_url,
                short_url: data.short_url
              });
            });
          });
        };
      });
    }else{
      return res.json({
        error: "Invalid url"
      });
    };
  });
});

app.get("/api/shorturl/:id", (req, res) => {
  let id;
  if(req.params.id.match(/^\d*$/)){
    id = req.params.id;
  }else{
    return res.redirect("/");
  };

  URLs.find({short_url: id}, (error, data) => {
    if (error) return console.log(error);
    if (data.length>0) {
      return res.redirect(data[0].original_url);
    }else{
      return res.redirect("/");
    };
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
