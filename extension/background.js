var username = "";

/**
 * Grab the user from github, then parse the response html
 * with the DOMParser to extract the username.
 * @param callback if it's set, it will be executed after the username is retrieved.
 */
function get_username(callback) {
    request('get', "https://github.com")
        .then(function(res) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(res.responseText, "text/html");
            parse_username(dom);
        })
        .then(callback);
}
/**
 * Get the username from a meta tag named user-login.
 */
function parse_username(content) {
    var user_meta = content.getElementsByName("user-login");
    username = user_meta[0].getAttribute('content');
    chrome.runtime.sendMessage({username: username});
}
/**
 * This method will create a canvas later to be used as the icon in
 * the chrome menu. Once created, it will set the image data for chrome.
 * @param color A hexadecimal color formatted in hex.
 * @param contributions The number of contributions for a given day.
 */
function draw(color, contributions) {
    var canvas = document.createElement('canvas');
    canvas.width = 19;
    canvas.height = 19;

    var context = canvas.getContext('2d');
    context.beginPath();
    context.arc(10, 10, 9, 0, Math.PI*2, true);
    context.closePath();
    context.fillStyle = color;
    context.fill();

    var color_hex = parseInt("0x" + color.slice(1));
    // Ternary operator to determine the fill style.
    context.fillStyle = color_hex < 0x44a340 ? "#FFFFFF" : "#000000";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "11px Arial";
    context.fillText(contributions, 10, 10);

    chrome.browserAction.setIcon({
        imageData: context.getImageData(0, 0, 19, 19)
    });
}

/**
 * Handle the contributions data by parsing through the temporary dom,
 * Then calls draw to build the icon for the extension icon.
 * @param response_dom
 */
function handle_contrib_data(response_dom) {
    var weeks = response_dom.getElementsByTagName("g");
    weeks = weeks[weeks.length - 1];
    var days = weeks.getElementsByTagName("rect");
    var last_day = days[days.length - 1];

    var todays_contributions = last_day.getAttribute("data-count");
    var color = last_day.getAttribute("fill");
    draw(color, todays_contributions);
}

/**
 * Get the contributions for the given user and parse the data.
 */
function get_contrib() {
    request('get', "https://github.com/users/" + username + "/contributions")
        .then(function (xhr) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(xhr.responseText, "text/html");
            chrome.runtime.sendMessage({contributions: xhr.responseText});
            handle_contrib_data(dom);
        });
}

/**
 * Make AJAX request and call closure when ready.
 * @param url Where we're requesting the data.
 * @param method GET|POST|PUT|DELETE
 */
function request(method, url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr);
            } else {
                reject(xhr);
            }
        };
        xhr.onerror = function () {
            reject(xhr);
        };
        xhr.send();
    });
}
// Grab the username from github.
get_username(get_contrib);

chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    if (message.go) {
        get_contrib();
    }
});

// Grab the contribution data once a minute.
setInterval(get_contrib, 60 /*seconds*/ * 1000 /*miliseconds*/);
