const _ = require("lodash");
const crypto = require("crypto");
const kms = require('@google-cloud/kms');



function sha512(input){
    const hash = crypto.createHash('sha512');
    hash.update(input);
    return hash.digest();
}





module.exports = async (config)=>{

    const projectId  = _.get(
        config, "service_account.project_id", "neoatlantis-password-manager");
    const locationId = 'global';
    const keyringId  = _.get(config, "kms.keyring_id", "root");
    const keyId      = _.get(config, "kms.key_id", "password_seed");

    // Instantiates an authorized client
    const client = (()=>{
        if(config){
            return new kms.KeyManagementServiceClient({
                credentials: _.get(config, "service_account"),
            });
        } else {
            return new kms.KeyManagementServiceClient();
        }
    })();

    const keyVersions = await client.listCryptoKeyVersionsAsync({
        parent: `projects/${projectId}/locations/${locationId}/keyRings/${keyringId}/cryptoKeys/${keyId}`,
    });

    let newestCreateTime = -1;
    let newestVersionName = "";

    for await (let keyVersion of keyVersions){
        let ctime = parseInt(_.get(keyVersion, "createTime.seconds"));
        if(_.isFinite(ctime) && ctime >= 0){
            if(ctime > newestCreateTime){
                newestCreateTime = ctime;
                newestVersionName = keyVersion.name;
            }
        }
    }


    return async function sign(data){
        const [signResponse] = await client.macSign({
            name: newestVersionName,
            data: sha512(data),
        });
        return signResponse.mac;
    }

    
}