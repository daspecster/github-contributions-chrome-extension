var username = '';
var contributions = '';
chrome.runtime.sendMessage({go: true});
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    // message is the message you sent, probably an object
    // messageSender is an object that contains info about the context that sent the message
    // sendResponse is a function to run when you have a response
    if ("username" in message) {
        username = message["username"];
    }
    if ("contributions" in message) {
        contributions = message['contributions'];
        document.getElementById('contributions').innerHTML = contributions;

        var parser = new DOMParser();
        var dom = parser.parseFromString(contributions, 'text/html');

        var weeks = dom.getElementsByTagName("g");
        week = weeks[weeks.length - 1];
        var days = week.getElementsByTagName("rect");

        var total_count = 0;
        for(var i = days.length - 1; i >= 0; i--) {
            total_count += parseInt(days[i].getAttribute("data-count"));
        }

        document.getElementById('weekly').innerHTML = total_count;
    }
});
