const axios = require('axios');
const crypto = require('crypto');

// 生成签名的 Nonce
function generateSignedNonce(secret, nonce) {
    const sha = crypto.createHash('sha256');
    sha.update(Buffer.from(secret, 'base64'));
    sha.update(Buffer.from(nonce, 'base64'));
    return sha.digest('base64');
}

// 生成签名
function generateSignature(uri, signedNonce, nonce, data) {
    const sign = `${uri}&${signedNonce}&${nonce}&data=${data}`;
    const key = Buffer.from(signedNonce, 'base64');
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(sign, 'utf-8');
    return hmac.digest('base64');
}

// 发送数据的函数
async function postData(uri, data, authorize) {
    data = JSON.stringify(data);

    let serviceToken, securityToken;
    try {
        serviceToken = authorize.serviceToken;
        securityToken = authorize.securityToken;
    } catch (error) {
        console.log('serviceToken not found, Unauthorized');
        return;
    }

    const tempStr = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nonce = '';
    for (let i = 0; i < 16; i++) {
        nonce += tempStr[Math.floor(Math.random() * tempStr.length)];
    }

    const signedNonce = generateSignedNonce(securityToken, nonce);
    const signature = generateSignature(uri, signedNonce, nonce, data);

    const body = {
        _nonce: nonce,
        data: data,
        signature: signature
    };

    const userAgent = 'APP/com.xiaomi.mihome APPV/6.0.103 iosPassportSDK/3.9.0 iOS/14.4 miHSTS';
    const headers = {
        'User-Agent': userAgent,
        'x-xiaomi-protocal-flag-cli': 'PROTOCAL-HTTP2',
        'Cookie': `PassportDeviceId=${authorize.deviceId};userId=${authorize.userId};serviceToken=${serviceToken};`
    };

    try {
        const response = await axios.post(`https://api.io.mi.com/app${uri}`, body, { headers: headers });
        return response.data;
    } catch (error) {
        console.error('Error posting data:', error);
        return null;
    }
}

// 示例使用
const uri = '/example/uri';
const data = { example: 'data' };
const authorize = {
    serviceToken: 'exampleServiceToken',
    securityToken: 'exampleSecurityToken',
    deviceId: 'exampleDeviceId',
    userId: 'exampleUserId'
};

postData(uri, data, authorize).then(response => {
    console.log('Response:', response);
});
