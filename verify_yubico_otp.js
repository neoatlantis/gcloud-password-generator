const crypto = require("crypto");
const _ = require("lodash");

const ALLOWED_USERS = _.compact(
    _.get(process, "env.ALLOWED_USERS", ",")
    .split(",")
);

console.log("Only allowing key holders of:", ALLOWED_USERS);



function yubikey_otp_to_serial(otp){
    const ALPHABET = 'cbdefghijklnrtuv';
    
    const token = 'cccc' + otp.slice(0, 12);
    let toggle = false;
    let keep = 0;
    const bytesarray = [];

    for (const char of token) {
        const n = ALPHABET.indexOf(char);
        toggle = !toggle;

        if (toggle) {
            keep = n;
        } else {
            bytesarray.push((keep << 4) | n);
        }
    }

    let value = 0;
    const mask_value = 0x1f;

    for (let i = 0; i < 8; i++) {
        const shift = (4 - 1 - i) * 8;
        value += (bytesarray[i] & 255) << (shift & mask_value);
    }

    return value;
}


function preverify_otp(otp){
    if(!/^[cbdefghijklnrtuv]{44}$/.test(otp)){
        return false;
    }
    const sn = yubikey_otp_to_serial(otp).toString();
    if(ALLOWED_USERS.indexOf(sn)>=0){
        return sn;
    }
    return false;
}









module.exports = async (otp)=>{

    const nonce = await new Promise((resolve, reject)=>{
        crypto.randomBytes(16, (err, buf)=>{
            if(err) return reject(err);
            resolve(buf);
        });
    });

    const sn = preverify_otp(otp);
    if(false === sn){
        return {
            success: false
        }
    }

    const nonce_hex = nonce.toString("hex");
    const endpoint_i = Math.floor(Math.random() * 5) + 1;
    const endpoint = `https://api${endpoint_i>=2?endpoint_i:''}.yubico.com/wsapi/2.0/verify?id=1&otp=${otp}&nonce=${nonce_hex}`;

    const res = await fetch(endpoint);
    const result = await res.text();
    
    if(!(
        result.indexOf(`otp=${otp}`) >= 0 &&
        result.indexOf(`nonce=${nonce_hex}`) >= 0
    )){
        return false;
    }

    return {
        success: result.indexOf("status=OK") >= 0,
        serial: yubikey_otp_to_serial(otp),
        allowed: ALLOWED_USERS.indexOf(sn)>=0,
    };
}

