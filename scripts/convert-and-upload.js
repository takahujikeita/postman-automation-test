const Converter = require('openapi-to-postmanv2');
const fs = require('fs');
const axios = require('axios');

// 設定
const CONFIG = {
    POSTMAN_API_KEY: process.env.POSTMAN_API_KEY || 'PMAK-your-api-key-here', // 実際のAPIキーに置換
    WORKSPACE_ID: process.env.POSTMAN_WORKSPACE_ID || 'your-workspace-id-here',     // 実際のワークスペースIDに置換
    COLLECTION_NAME: 'SaaSus API Test'
};

async function convertOpenAPIToPostman(yamlPath, serviceName) {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    return new Promise((resolve, reject) => {
        Converter.convert({
            type: 'string',
            data: yamlContent
        }, {}, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!result.result) {
                reject(new Error('Conversion failed'));
                return;
            }
            
            let collection = result.output[0].data;
            
            // baseURL統一とURL書き換え
            if (collection.variable) {
                collection.variable.forEach(variable => {
                    if (variable.key === 'baseUrl') {
                        variable.value = 'https://api.saasus.io';
                    }
                });
            }
            
            // URL書き換え関数
            function updateUrls(item) {
                if (item.request?.url) {
                    if (typeof item.request.url === 'string') {
                        item.request.url = item.request.url.replace(
                            '{{baseUrl}}',
                            `{{baseUrl}}/v1/${serviceName.toLowerCase()}`
                        );
                    } else if (item.request.url.raw) {
                        item.request.url.raw = item.request.url.raw.replace(
                            '{{baseUrl}}',
                            `{{baseUrl}}/v1/${serviceName.toLowerCase()}`
                        );
                    }
                }
                
                if (item.item) {
                    item.item.forEach(updateUrls);
                }
            }
            
            collection.item?.forEach(updateUrls);
            collection.name = serviceName;
            
            resolve(collection);
        });
    });
}

async function createCombinedCollection() {
    try {
        console.log('Converting OpenAPI specs...');
        
        const authCollection = await convertOpenAPIToPostman('./specs/auth-api.yml', 'Auth');
        
        const combinedCollection = {
            info: {
                name: CONFIG.COLLECTION_NAME,
                description: "Auto-generated combined SaaSus API collection",
                schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            variable: [
                {
                    key: "baseUrl",
                    value: "https://api.saasus.io",
                    type: "string"
                }
            ],
            item: [
                {
                    name: "Auth",
                    item: authCollection.item || []
                }
            ]
        };
        
        // ローカル保存
        fs.writeFileSync('./collections/combined-collection.json', JSON.stringify(combinedCollection, null, 2));
        console.log('Combined collection saved locally');
        
        return combinedCollection;
        
    } catch (error) {
        console.error('Error creating combined collection:', error);
        throw error;
    }
}

async function uploadToPostman(collection) {
    if (!CONFIG.POSTMAN_API_KEY || CONFIG.POSTMAN_API_KEY.includes('your-api-key')) {
        console.log('Postman API key not configured. Skipping upload.');
        console.log('Collection saved to: ./collections/combined-collection.json');
        console.log('You can manually import this file to Postman');
        return;
    }
    
    try {
        // Check if collection already exists
        const listResponse = await axios.get(
            'https://api.getpostman.com/collections',
            {
                headers: {
                    'X-API-Key': CONFIG.POSTMAN_API_KEY
                }
            }
        );
        
        const existingCollection = listResponse.data.collections.find(
            c => c.name === CONFIG.COLLECTION_NAME
        );
        
        if (existingCollection) {
            // Update existing collection
            console.log(`Updating existing collection: ${existingCollection.name} (ID: ${existingCollection.id})`);
            const updateResponse = await axios.put(
                `https://api.getpostman.com/collections/${existingCollection.id}`,
                { collection },
                {
                    headers: {
                        'X-API-Key': CONFIG.POSTMAN_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Successfully updated Postman collection');
            return updateResponse.data;
        } else {
            // Create new collection
            console.log('Creating new collection');
            const response = await axios.post(
                'https://api.getpostman.com/collections',
                { collection },
                {
                    headers: {
                        'X-API-Key': CONFIG.POSTMAN_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Successfully uploaded to Postman:', response.data.collection.name);
            console.log('Collection ID:', response.data.collection.id);
            return response.data;
        }
        
    } catch (error) {
        console.error('Error uploading to Postman:', error.response?.data || error.message);
        throw error;
    }
}

async function main() {
    try {
        const collection = await createCombinedCollection();
        await uploadToPostman(collection);
        console.log('Process completed successfully!');
    } catch (error) {
        console.error('Process failed:', error);
        process.exit(1);
    }
}

main();
