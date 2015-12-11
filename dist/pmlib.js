/*===================================================================
#    FileName: postmessagelib.js
#      Author: Maelon.J
#       Email: maelon.j@gmail.com
#  CreateTime: 2015-12-01 17:56
# Description: cross domain communication
               based on postmessage
===================================================================*/

(function (pmlib) {

    /**
    * 设置信任域，用于消息过滤，只有信任的域可以收发消息
    * ['http://www.ymatou.com', 'https://www.baidu.com']
    */
    pmlib.setTrustedDomainList = function (list) {
        if(list && list instanceof Array) {
            //check list
            for(var i = 0; i < list.length; i++) {
                if(typeof list[i] === 'string') {
                    if((/https?:\/\/\w+/i).test(list[i])) {
                        //do nothing
                    } else {
                        throw new TypeError('error trusted list item, should be correct url', list[i]);
                    }
                } else {
                    throw new TypeError('error trusted list item, should be string', list[i]);
                }
            }
            pmlib._trustedList = list;
        } else {
            throw new TypeError('error trusted list');
        }
    };

    /**
    * 页面完成加载后初始化(作为客户端的初始化)
    * window.onload = function () {
    *   pmlib.init();
    * }
    */
    pmlib.init = function (win) {
       if(window.postMessage) {
            if(!pmlib._inited) {
                window.addEventListener('message', pmlib._onPostMessage);
                if(win && win.postMessage) {
                    pmlib.receive('initAsk', function (message) {
                        pmlib._postMessageName = message['_postmessagename'] || pmlib._postmessagename;
                        pmlib.refuse('initAsk');
                        if(message['data']['ask'] === 'usePostMessage') {
                            pmlib._send({
                                '_postmessagename': pmlib._postMessageName,
                                'window': window.parent,
                                'type': '_response',
                                'data': {
                                    'response': 'yes'
                                }
                            });
                            pmlib._inited = true;
                            pmlib._readyCall();
                        }
                    });
                    pmlib._send({
                        '_postmessagename': 'init',
                        'window': win,
                        'type': '_postMessageInited',
                        'data': {
                            '_inited': true
                        }
                    });
                } else {
                    throw new Error('pmlib.init should be a correct or postMessage supported window object');
                }
            }
       } else {
           throw new Error('Your browser does not support postmessage');
       }
    };

    /**
    * 页面完成加载后初始化(作为服务端的初始化)
    * window.onload = function () {
    *   pmlib.initServer();
    * }
    */
    pmlib.initServer = function () {
       if(window.postMessage) {
           window.addEventListener('message', pmlib._onPostMessage);
           pmlib._inited = true;
       } else {
           throw new Error('Your browser does not support postmessage');
       }
    };

    /**
    * 发送信息(作为客户端)
    * info:
    * {
    *     window: object, //消息目标窗体对象
    *     data: {} //消息数据
    * }
    */
    pmlib.send = function (info, errorback) {
        if(pmlib._inited) {
            if(pmlib._messagePool.length > 0) {
                pmlib._messagePool.push({
                    'info': info,
                    'errorback': errorback
                });
                var msg;
                while(pmlib._messagePool.length) {
                    msg = pmlib._messagePool.shift();
                    pmlib._send(msg['info'], msg['errorback']);
                }
            } else {
                pmlib._send(info, errorback);
            }
        } else {
            pmlib._messagePool.push({
                'info': info,
                'errorback': errorback
            });
        }
    };

    /**
    * 侦听器名称，侦听器处理函数
    * arguments:
    * 1. function
    * 2. name, function
    */
    pmlib.receive = function () {
        var name;
        var handler;
        if(arguments.length === 2) {
            if(typeof arguments[0] === 'string' && typeof arguments[1] === 'function') {
                name = arguments[0];
                handler = arguments[1];
            }
        } else if(arguments.length === 1) {
            if(typeof arguments[0] === 'function') {
                handler = arguments[0];
            }
        }
        if(name || handler) {
            if(pmlib._hasListener(name || listener)) {

            } else {
                var listener = {};
                listener['name'] = name || 'handler' + Math.random().toString().slice(1);
                listener['handler'] = handler;
                pmlib._addListener(listener);
            }
        } else {
            throw new Error('pmlib.receive arguments error');
        }
    };

    /**
    * 清除侦听器
    * arguments:
    * 1. function
    * 2. name, function
    */
    pmlib.refuse = function () {
        var name;
        var handler;
        if(arguments.length === 2) {
            if(typeof arguments[0] === 'string' && typeof arguments[1] === 'function') {
                name = arguments[0];
                handler = arguments[1];
            }
        } else if(arguments.length === 1) {
            if(typeof arguments[0] === 'function') {
                handler = arguments[0];
            } else if(typeof arguments[0] === 'string') {
                name = arguments[0];
            }
        }
        if(name || handler) {
            if(pmlib._hasListener(name || handler)) {
                pmlib._removeListener(name || handler);
            } else {
            }
        } else {
            throw new Error('pmlib.refuse arguments error');
        }
    };

    /**
    * 侦听器列表
    * {
    *     name: string,
    *     handler: function
    * }
    */
    pmlib._listener = [];

    /**
    * 信任域列表
    */
    pmlib._trustedList = [];

    /**
    * 初始化状态
    */
    pmlib._inited = false;

    /**
    * 消息端标识
    * postMessageName
    */
    pmlib._postMessageName = Math.random().toString().slice(2);

    /**
    * 待发送的消息池
    */
    pmlib._messagePool = [];

    /**
    * 通讯初始化后回调
    */
    pmlib._readyCall = function () {
        //清空消息池
        if(pmlib._messagePool.length > 0) {
            var msg;
            while(pmlib._messagePool.length) {
                msg = pmlib._messagePool.shift();
                pmlib._send(msg['info'], msg['errorback']);
            }
        }
    };

    /**
    * 根据条件判断是否已经有消息侦听
    * 条件可以是侦听名或者是侦听处理函数
    */
    pmlib._hasListener = function (condition) {
        for(var i = 0; i < pmlib._listener.length; i++) {
            if((typeof condition === 'string' && pmlib._listener[i]['name'] === condition)
              || (typeof condition === 'function' && pmlib._listener[i]['handler'] === condition)) {
                return true;
            } 
        }
        return false;
    };

    /**
    * 添加侦听器
    * {
    *     name: string,
    *     handler: function
    * }
    */ 
    pmlib._addListener = function (listener) {
        pmlib._listener.push(listener);
        return true;
    };

    /**
    * 根据条件删除侦听器
    * 条件可以是侦听器名称或者侦听器处理函数
    */
    pmlib._removeListener = function (condition) {
        if(pmlib._hasListener(condition)) {
            for(var i = 0; i < pmlib._listener.length; i++) {
                if((typeof condition === 'string' && pmlib._listener[i]['name'] === condition) 
                  || (typeof condition === 'function' && pmlib._listener[i]['handler'] === condition)) {
                    pmlib._listener.splice(i, 1);
                    i -= 1;
                } 
            }
        }
        return true;
    };

    /**
    *  postmessage消息回调
    *  过滤消息，调用侦听器处理函数
    */
    pmlib._onPostMessage = function (event) {
        if(pmlib._trustedList.indexOf(event.origin) > -1) {
            if(event.data['type'] === '_postMessageInited') {
                pmlib._getListenerHandler('init')(event.data, event.source);
            } else if(event.data['type'] === '_ask') {
                pmlib._getListenerHandler('initAsk')(event.data);
            } else {
                if(event.data['_postmessagename']) {
                    for(var i = 0; i < pmlib._listener.length; i++) {
                        if(pmlib._listener[i]['name'] === event.data['_postmessagename']) {
                            pmlib._listener[i]['handler'](event.data, event.source);
                            break;
                        }
                    }
                }
            }
            for(i = 0; i < pmlib._listener.length; i++) {
                if((/handler.\d+/i).test(pmlib._listener[i]['name'])) {
                    pmlib._listener[i]['handler'](event.data, event.source);
                }
            }
        }
    };

    /**
    * 发送信息
    * info:
    * {
    *     window: object, //消息目标窗体对象
    *     data: {} //消息数据
    * }
    */
    pmlib._send = function (info, errorback) {
        if(info['window'] && info['window'].postMessage) {
            !info['_postmessagename'] && (info['_postmessagename'] = pmlib._postMessageName);
            !info['type'] && (info['type'] = 'message');
            var win = info['window'];
            delete info['window'];
            win.postMessage(info, '*');
        } else {
            errorback && (typeof errorback === 'function') && errorback('window error');
        }
    };

    /**
    * 根据侦听器名获取侦听器处理方法
    */
    pmlib._getListenerHandler = function (name) {
        for(var i = 0; i < pmlib._listener.length; i++) {
            if(pmlib._listener[i]['name'] === name) {
                return pmlib._listener[i]['handler'];
            }
        }
    };

})(window.pmlib = window.pmlib || {});
