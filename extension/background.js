username = "";

/**
 * Grab the user from github
 * Then parse the repsonse html with the DOMParser to extract the username
 * @param Closure callback if it's set, it will be executed after the username is retrieved.
 */
function get_username(callback) {
    var url = "https://github.com/";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(xhr.responseText, "text/html");
            parse_username(dom);
            if (callback) {
                callback();
            }
        }
    };
    xhr.open("GET", url, true);
    xhr.send();
}
/**
 * Get the username from a meta tag named user-login.
 */
function parse_username(content) {
    var user_meta = content.getElementsByName("user-login");
    username = user_meta[0].getAttribute('content');
}
/**
 * This method will create a canvas later to be used as the icon in 
 * the chrome menu. Once created, it will set the image data for chrome.
 * @param hex color A hexadecimal color formated in hex.
 * @param int contributions The number of contributions for a given day.
 */
function draw(color, contributions) {
  var canvas = document.createElement('canvas');
  canvas.width = 19;
  canvas.height = 19;

  var context = canvas.getContext('2d');
  context.fillStyle = color;
  context.fillRect(0, 0, 19, 19);

  color_hex = parseInt("0x" + color.slice(1));
  if (color_hex < 0x44a340) {
      text_color = "#FFFFFF";
  } else {
      text_color = "#000000";
  }
  context.fillStyle = text_color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "11px Arial";
  context.fillText(contributions, 10, 10);

  chrome.browserAction.setIcon({
    imageData: context.getImageData(0, 0, 19, 19)
  });
}

/**
 * Handle the contributions data by parsing through the temporary dom
 * Then calls draw to build the icon for the extention icon
 * @param DOM response_dom
 */
function handle_contrib_data(response_dom) {
    var weeks = response_dom.getElementsByTagName("g");
    weeks = weeks[weeks.length-1];
    var days = weeks.getElementsByTagName("rect");
    var last_day = days[days.length-1];

    var todays_contributions = last_day.getAttribute("data-count");
    var color = last_day.getAttribute("fill");
    draw(color, todays_contributions);
}

/**
 * Get the contrbutions for the given user and parse the data 
 */
function get_contrib() {
    console.log(username);
    var contrib_url = "https://github.com/users/" + username + "/contributions";
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function(){
        if (xhr.readyState == 4) {
            var parser = new DOMParser();
            var dom = parser.parseFromString(xhr.responseText, "text/html");
            handle_contrib_data(dom);
        }
    };
    xhr.open("GET", contrib_url, true);
    xhr.send();
}
// Grab the username from github
get_username(get_contrib);
// Grab the contribution data once a minute.
setInterval(get_contrib, 60 /*seconds*/ * 1000 /*miliseconds*/);
