(function(){
    let url, data = navigator.platform.substring(0, 5);
    if (data === "Linux") {
        url = "./lib/cordova.js";
    } else {
        url = "./lib/cordova_ios.js";
    }
    let obj = document.getElementsByTagName("head");
    let newEle = document.createElement("script");
    newEle.type = "text/javascript";
    newEle.src = url;
    obj[0].appendChild(newEle);
})()


function requireBack() {
    ToNativeBridge.sendDataToNative({
        action: "ACTIVITY_CONTROL_FINISH"
    });
}

function onResume() {
    return;
}
function setReturn() {
    return;
}