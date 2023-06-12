const _ = require("lodash");
const TEMPLATE = `
<!DOCTYPE html>
<html><head>
    <title>NeoAtlantis Password Generator</title>
    <meta charset="utf-8" />
</head><body>

    <form action="/" method="POST">
        <div>Request: <input type="text" name="request" /></div>
        <div>PIN: <input type="password" name="pin" /></div>
        <div>OTP: <input type="password" name="otp" /></div>
        <button type="submit">Submit</button>
    </form>

</body></html>
`;


const IS_DEV = (_.get(process.env, "DEV") != null);
if(IS_DEV) console.log("Running in development mode.");



const config = IS_DEV ? 
    JSON.parse(require("fs").readFileSync("./config.json")) :
    null
;

const getPassword = require("./get_password")(config);




exports.generatePassword = async (req, res)=>{
    const method = req.method || "GET";

    if(method == "GET"){
        res.status(200).send(TEMPLATE);
        return;
    }

    const body_request = _.get(req, "body.request"),
          body_pin     = _.get(req, "body.pin"),
          body_otp     = _.get(req, "body.otp");
    

    const result_buffer = await getPassword(Buffer.from(body_request, "ascii"));

    res.status(200).send(result_buffer.toString("hex"));
}