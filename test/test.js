document.domain = 'test.com';

pmlib.setTrustedDomainList(['http://b.test.com']);

(function (pmServer) {
    pmServer.clientMap = { };

    //init
    pmlib.initServer();
    pmlib.receive('init', function (message, source) {
        if(message['type'] === '_postMessageInited') {
            if(message['data']['_inited']) {
                pmlib.send({
                    '_postmessagename': source.frameElement.id,
                    'window': source,
                    'type': '_ask',
                    'data': {
                        'ask': 'usePostMessage'
                    }
                });
            }
        }
    });

    pmlib.receive('testiframe', function (message) {
        if(message['type'] === '_response') {
            if(message['data']['response'] === 'yes') {
                pmServer.clientMap['testiframe'] = document.getElementById('testiframe').contentWindow;
            }
        } else if(message['type'] === 'message') {
            if(message['data']['subType'] === 'double') {
                alert('receive response from iframe: ' + message['data']['data'])
            }
        }
    });
    
})(window.pmServer = window.pmServer || {});

var button = document.getElementById('send');
var input = document.getElementById('ipt');
button.onclick = function () {
    pmlib.send({
        '_postmessagename': 'testiframe',
        'window': window.pmServer.clientMap['testiframe'],
        'type': 'message',
        'data': {
            'subType': 'double',
            'data': input.value
        }
    });
};
