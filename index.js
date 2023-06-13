const _ = require("lodash");

const verify_yubico_otp = require("./verify_yubico_otp");
const TEMPLATE = `
<!DOCTYPE html>
<html><head>
    <title>NeoAtlantis Password Generator</title>
    <meta charset="utf-8" />
</head><body>

    <form method="POST">
        <div>Request: <input type="text" name="request" /></div>
        <!--<div>PIN: <input type="password" name="pin" /></div>-->
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

let getPassword = null; 




exports.generatePassword = async (req, res)=>{
    res.set('Access-Control-Allow-Origin', "*")
    res.set('Access-Control-Allow-Methods', 'GET, POST');

    const method = req.method || "GET";

    if(null == getPassword){
        getPassword = await require("./get_password")(config);
    }

    if(method == "GET"){
        res.status(200).send(TEMPLATE);
        return;
    }

    let body_request = _.get(req, "body.request"),
        body_pin     = _.get(req, "body.pin"),
        body_otp     = _.get(req, "body.otp");

    if(!_.isString(body_request)){
        return res.status(400).send("Bad request");
    }

    body_request = body_request.trim();
    if(!/^[\x20-\x7E]+$/.test(body_request)){
        return res.status(400).send("Bad request with non-ASCII chars.");
    }
    
    let otp_verification = null;
    try{
        otp_verification = await verify_yubico_otp(body_otp);
    } catch(e){
        return res.status(500).send("OTP verification failed.");
    }

    if(_.get(otp_verification, "success") !== true){
        return res.status(400).send("Bad OTP.");
    }

    const result_buffer = await getPassword(Buffer.from(body_request, "ascii"));

    res.status(200).send(result_buffer.toString("hex"));
}