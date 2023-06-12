const _ = require("lodash");
const kms = require('@google-cloud/kms');

module.exports = (config)=>{

    const projectId = _.get(
        config, "service_account.project_id", "neoatlantis-password-manager");
    const locationId = 'global';

    // Instantiates an authorized client
    const client = new kms.KeyManagementServiceClient({
        credentials: _.get(config, "service_account"),
    });

    const versionName = client.cryptoKeyVersionPath(
        projectId,
        locationId,
        _.get(config, "kms.keyring_id", "root"),
        _.get(config, "kms.key_id", "password_seed"),
        _.get(config, "kms.version_id")
    );

    
    return async function sign(data){
        const [signResponse] = await client.macSign({
            name: versionName,
            data
        });
        return signResponse.mac;
    }

    
}