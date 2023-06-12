const crypto = require("crypto");




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












module.exports = async (otp)=>{

    const nonce = await new Promise((resolve, reject)=>{
        crypto.randomBytes(16, (err, buf)=>{
            if(err) return reject(err);
            resolve(buf);
        });
    });

    const nonce_hex = nonce.toString("hex");
    const endpoint = `https://api.yubico.com/wsapi/2.0/verify?id=1&otp=${otp}&nonce=${nonce_hex}`;
    
    const res = await fetch(endpoint);
    const result = await res.text();

    console.log(result);
    
    if(!(
        result.indexOf(`otp=${otp}`) >= 0 &&
        result.indexOf(`nonce=${nonce_hex}`) >= 0
    )){
        return false;
    }

    return {
        success: result.indexOf("status=OK") >= 0,
        serial: yubikey_otp_to_serial(otp),
    };
}

