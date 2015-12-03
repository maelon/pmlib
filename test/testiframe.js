document.domain = 'test.com';

pmlib.setTrustedDomainList(['http://a.test.com']);

window.onload = function () {
    if(window.frameElement && (/iframe/i).test(window.frameElement.tagName)) {
        pmlib.init(window.parent);
        pmlib.receive(function (message) {
            console.log(message);
            if(message['type'] === 'message') {
                if(message['data']['subType'] === 'double') {
                    var num = message['data']['data'].toString();
                    pmlib.send({
                        'window': window.parent,
                        'data': {
                            'subType': 'double',
                            'data': num + num
                        }
                    });
                }
            }
        });
    }
};
