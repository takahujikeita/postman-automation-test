#!/usr/bin/env node

const Converter = require('openapi-to-postmanv2');
const fs = require('fs');
const path = require('path');

// 設定
const OPENAPI_FILE = process.env.OPENAPI_FILE || 'specs/auth-api.yml';
const OUTPUT_FILE = process.env.COLLECTION_FILE || 'postman/collections/saasus-auth-api.json';

async function convertOpenAPIToPostman(yamlPath) {
    console.log(`Converting OpenAPI from: ${yamlPath}`);
    
    if (!fs.existsSync(yamlPath)) {
        throw new Error(`OpenAPI file not found: ${yamlPath}`);
    }
    
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    
    return new Promise((resolve, reject) => {
        Converter.convert({
            type: 'string',
            data: yamlContent
        }, {
            folderStrategy: 'Tags',
            requestParametersResolution: 'Example',
            exampleParametersResolution: 'Example',
            includeAuthInfoInExample: false
        }, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!result.result) {
                reject(new Error('Conversion failed: ' + JSON.stringify(result)));
                return;
            }
            
            let collection = result.output[0].data;
            
            // コレクション名を設定
            collection.info.name = 'SaaSus API Test';
            collection.info.description = 'Auto-generated from OpenAPI specification';
            
            // baseURL変数を設定
            collection.variable = [{
                key: "baseUrl",
                value: "https://api.saasus.io",
                type: "string"
            }];
            
            // URL書き換え関数
            function updateUrls(item) {
                if (item.request?.url) {
                    if (typeof item.request.url === 'string') {
                        item.request.url = item.request.url.replace(
                            'https://api.saasus.io/v1/auth',
                            '{{baseUrl}}/v1/auth'
                        );
                    } else if (item.request.url.raw) {
                        item.request.url.raw = item.request.url.raw.replace(
                            'https://api.saasus.io/v1/auth',
                            '{{baseUrl}}/v1/auth'
                        );
                    }
                    if (item.request.url.host) {
                        item.request.url.host = ['{{baseUrl}}'];
                    }
                }
                
                if (item.item) {
                    item.item.forEach(updateUrls);
                }
            }
            
            collection.item?.forEach(updateUrls);
            
            resolve(collection);
        });
    });
}

async function main() {
    try {
        console.log('🚀 Starting OpenAPI to Postman conversion...');
        
        // OpenAPIファイルの変換
        const collection = await convertOpenAPIToPostman(OPENAPI_FILE);
        
        // 出力ディレクトリを作成
        const outputDir = path.dirname(OUTPUT_FILE);
        fs.mkdirSync(outputDir, { recursive: true });
        
        // JSONファイルに保存
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
        
        console.log('✅ Successfully converted OpenAPI to Postman collection');
        console.log(`📁 Output file: ${OUTPUT_FILE}`);
        console.log(`📋 Collection name: ${collection.info.name}`);
        console.log(`🔗 Requests count: ${countRequests(collection)}`);
        
    } catch (error) {
        console.error('❌ Conversion failed:', error.message);
        process.exit(1);
    }
}

function countRequests(collection) {
    let count = 0;
    
    function countInItem(item) {
        if (item.request) {
            count++;
        }
        if (item.item) {
            item.item.forEach(countInItem);
        }
    }
    
    collection.item?.forEach(countInItem);
    return count;
}

// スクリプトが直接実行された場合のみ実行
if (require.main === module) {
    main();
}
