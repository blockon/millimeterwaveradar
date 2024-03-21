cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "file": "plugins/com.superapp.dataplugin/www/DataTransport.js",
        "id": "com.superapp.dataplugin.DataTransport",
        "clobbers": [
            "DataTransport"
        ]
    },
    {
        "file": "plugins/com.changhong.superapp.webview.plugin.tonativebridge/www/ToNativeBridge.js",
        "id": "com.changhong.superapp.webview.plugin.tonativebridge.ToNativeBridge",
        "clobbers": [
            "ToNativeBridge"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "com.superapp.dataplugin": "0.1",
    "com.changhong.superapp.webview.plugin.tonativebridge": "0.1"
}
// BOTTOM OF METADATA
});