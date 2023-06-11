const kms = require('@google-cloud/kms');

module.exports = (config)=>{

    const projectId = config.service_account.project_id;
    const locationId = 'global';

    // Instantiates an authorized client
    const client = new kms.KeyManagementServiceClient({
        credentials: config.service_account,
    });

    const versionName = client.cryptoKeyVersionPath(
        projectId,
        locationId,
        config.kms.keyring_id,
        config.kms.key_id,
        config.kms.version_id
    );

    
    return async function sign(data){
        const [signResponse] = await client.macSign({
            name: versionName,
            data
        });
        return signResponse.mac;
    }

    
}