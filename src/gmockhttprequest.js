/*
 * gmockhttprequest
 * https://github.com/goliatone/gmockhttprequest
 * Created with gbase.
 * Copyright (c) 2014 goliatone
 * Licensed under the MIT license.
 */
/* jshint strict: false, plusplus: true */
/*global define: false, require: false, module: false, exports: false */
(function (root, name, deps, factory) {
    'use strict';
    // Node
     if(typeof deps === 'function') {
        factory = deps;
        deps = [];
    }

    if (typeof exports === 'object') {
        module.exports = factory.apply(root, deps.map(require));
    } else if (typeof define === 'function' && 'amd' in define) {
        //require js, here we assume the file is named as the lower
        //case module name.
        define(name.toLowerCase(), deps, factory);
    } else {
        // Browser
        var d, i = 0, global = root, old = global[name], mod;
        while((d = deps[i]) !== undefined) deps[i++] = root[d];
        global[name] = mod = factory.apply(global, deps);
        //Export no 'conflict module', aliases the module.
        mod.noConflict = function(){
            global[name] = old;
            return mod;
        };
    }
}(this, 'GMockHttpRequest', ['extend'], function(extend) {

    /**
     * Extend method.
     * @param  {Object} target Source object
     * @return {Object}        Resulting object from
     *                         meging target to params.
     */
    var _extend= extend;

    /**
     * Shim console, make sure that if no console
     * available calls do not generate errors.
     * @return {Object} Console shim.
     */
    var _shimConsole = function(con) {

        if (con) return con;

        con = {};
        var empty = {},
            noop = function() {},
            properties = 'memory'.split(','),
            methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
                'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
                'table,time,timeEnd,timeStamp,trace,warn').split(','),
            prop,
            method;

        while (method = methods.pop()) con[method] = noop;
        while (prop = properties.pop()) con[prop] = empty;

        return con;
    };


    var _unsafeHeaders = {
        'accept-charset': true,
        'accept-encoding': true,
        'connection': true,
        'content-length': true,
        'cookie': true,
        'cookie2': true,
        'content-transfer-encoding': true,
        'date': true,
        'expect': true,
        'host': true,
        'keep-alive': true,
        'referer': true,
        'te': true,
        'trailer': true,
        'transfer-encoding': true,
        'upgrade': true,
        'user-agent': true,
        'via': true
    };

    function _startsWith(target /*, ...rest*/){
        var args = Array.prototype.slice.call(arguments, 1);
        return args.some(function(str){
            return target.indexOf(str) === 0;
        });
    }

    /**
     * Preserve references to original object,
     * we delete each key instead of overwriting
     * with new instance.
     *
     * @param  {Object} obj
     * @return {void}
     */
    function _resetObject(obj){
        Object.keys(obj).forEach(function(key){
            delete obj[key];
        });
    }

///////////////////////////////////////////////////
// CONSTRUCTOR
///////////////////////////////////////////////////

	var OPTIONS = {
        autoinitialize: true,
        /*
         * List of ignored headers in `getAllResponseHeaders`
         */
        ignoredResponseHeaders: ['set-cookie', 'set-cookie2'],
        /*
         * More recent browsers, including Firefox,
         * also support listening to the XMLHttpRequest
         * events via standard addEventListener APIs in
         * addition to setting on* properties to a
         * handler function.
         */
        onload: function(){},
        onprogress: function(){},
        onerror: function(){},
        onabort: function(){},
        /**
         * A JavaScript function object that
         * is called whenever the readyState
         * attribute changes. The callback is
         * called from the user interface thread.
         * @return {void}
         */
        onreadystatechange: function(){},
        onsend: function(){},
        /**
         * The upload process can be tracked by
         * adding an event listener to upload.
         * XMLHttpRequestUpload
         * @return {[type]} [description]
         */
        upload: function(){},
        /**
         * A JavaScript function object that is
         * called whenever the request times out.
         * @return {void}
         */
        ontimeout: function(){}
    };

    /**
     * GMockHttpRequest constructor
     *
     * @param  {object} config Configuration object.
     */
    var GMockHttpRequest = function(config){
        config = _extend({}, this.constructor.DEFAULTS, config);

        if(config.autoinitialize) this.init(config);

        if(typeof this.register === 'function') this.register(this);
    };



    GMockHttpRequest.name = GMockHttpRequest.prototype.name = 'GMockHttpRequest';

    GMockHttpRequest.VERSION = '0.0.0';

    /**
     * `readyState` value
     * open() has not been called yet
     * @type {Number}
     */
    GMockHttpRequest.UNSENT = 0;
    /**
     * `readyState` value
     * send() has not been called yet.
     * @type {Number}
     */
    GMockHttpRequest.OPENED = 1;
    /**
     * `readyState` value
     * send() has been called, and headers
     * and status are available.
     * @type {Number}
     */
    GMockHttpRequest.HEADERS_RECEIVED = 2;
    /**
     * `readyState` value
     * Downloading; responseText holds
     * partial data.
     * @type {Number}
     */
    GMockHttpRequest.LOADING = 3;
    /**
     * `readyState` value
     * The operation is complete.
     * @type {Number}
     */
    GMockHttpRequest.DONE = 4;

    GMockHttpRequest.STATUS_CODES = {
        100: 'Continue',
        101: 'Switching Protocols',
        102: 'Processing',
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        203: 'Non-Authoritative Information',
        204: 'No Content',
        205: 'Reset Content',
        206: 'Partial Content',
        207: 'Multi-Status',
        300: 'Multiple Choices',
        301: 'Moved Permanently',
        302: 'Moved Temporarily',
        303: 'See Other',
        304: 'Not Modified',
        305: 'Use Proxy',
        307: 'Temporary Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Time-out',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Request Entity Too Large',
        414: 'Request-URI Too Large',
        415: 'Unsupported Media Type',
        416: 'Requested range not satisfiable',
        417: 'Expectation Failed',
        422: 'Unprocessable Entity',
        423: 'Locked',
        424: 'Failed Dependency',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Time-out',
        505: 'HTTP Version not supported',
        507: 'Insufficient Storage'
    };

    /**
     * Make default options available so we
     * can override.
     */
    GMockHttpRequest.DEFAULTS =  _extend({}, OPTIONS);

///////////////////////////////////////////////////
// PRIVATE METHODS
///////////////////////////////////////////////////

    GMockHttpRequest.prototype.init = function(config){
        if(this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        this.reset();

        console.log('GMockHttpRequest: Init!');
        _extend(this, config);
    };

    GMockHttpRequest.prototype.reset = function(){
        /*
         * The response entity body according to responseType,
         * as an ArrayBuffer, Blob, Document, JavaScript object
         * (for 'json'), or string. This is null if the request
         * is not complete or was not successful.
         */
        this.response = null;

        /*
         * The response to the request as text, or null if the
         * request was unsuccessful or has not yet been sent.
         * @readonly
         */
        this.responseText = '';

        /*
         * XMLHttpRequestResponseType.
         * '' (empty string)    String (this is the default)
         * 'arraybuffer'   ArrayBuffer
         * 'blob'  Blob
         * 'document'  Document
         * 'json'  JavaScript object, parsed from a JSON
         * string returned by the server 'text'
         */
        this.responseType = null;

        /*
         * The response to the request as a DOM Document object,
         * or null if the request was unsuccessful, has not yet
         * been sent, or cannot be parsed as XML or HTML.
         * The response is parsed as if it were a text/xml
         * stream. When the responseType is set to 'document'
         * and the request has been made asynchronously, the
         * response is parsed as a text/html stream
         *
         * Note: If the server doesn't apply the text/xml
         * Content-Type header, you can use overrideMimeType()
         * to force XMLHttpRequest to parse it as XML anyway.
         */
        this.responseXML = null;

        /*
         * The status of the response to the request.
         * This is the HTTP result code (for example,
         * status is 200 for a successful request).
         *
         * @readonly
         */
        this.status = 0;

        /*
         * The response string returned by the HTTP
         * server. Unlike status, this includes the
         * entire text of the response message
         * ('200 OK', for example).
         *
         * @readonly
         */
        this.statusText = '';

        /*
         * The number of milliseconds a request can
         * take before automatically being terminated.
         * A value of 0 (which is the default) means
         * there is no timeout. Calls `ontimeout`.
         *
         * Note: You may not use a timeout for
         * synchronous requests with an owning window.
         */
        this.timeout = 0;

        /*
         * Indicates whether or not cross-site
         * Access-Control requests should be made
         * using credentials such as cookies or
         * authorization headers.
         * The default is false.
         */
        this.withCredentials = false;

        this.sent = false;
        this.error = false;

        this.requestText = null;
        this.requestHeaders = {};
        this.responseHeaders = {};

        this.readyState = GMockHttpRequest.UNSENT;
    };

    /**
     * Initializes a request. This method is to be used
     * from JavaScript code; to initialize a request
     * from native code, use openRequest()instead.
     *
     * Note: Calling this method for an already active
     * request (one for which open() or openRequest()
     * has already been called) is the equivalent of
     * calling abort().
     *
     * @param  {String} method   The HTTP method to use, such as 'GET',
     *                           'POST', 'PUT', 'DELETE', etc. Ignored
     *                           for non-HTTP(S) URLs.
     * @param  {String} url      The URL to send the request to.
     * @param  {Boolean} async   An optional boolean parameter, defaulting
     *                           to true, indicating whether or not to
     *                           perform the operation asynchronously.
     *                           If this value is false, the send() method
     *                           does not return until the response is
     *                           received. If true, notification of a
     *                           completed transaction is provided using
     *                           event listeners. This must be true if the
     *                           multipart attribute is true, or an exception
     *                           will be thrown.
     * @param  {String} user     The optional user name to use for authentication
     *                           purposes; by default, this is an empty string.
     * @param  {String} password The optional password to use for authentication
     *                           purposes; by default, this is an empty string.
     * @return {void}
     */
    GMockHttpRequest.prototype.open = function(method, url, async, user, password){
        if(typeof method !== 'string') throw new Error('Invalid Method');
        method = method.toUpperCase();

        var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];
        // if(methods.indexOf(method) === -1) throw

        this.method = method;

        if(typeof url !== 'string') throw new Error('Invalid Url');

        this.url = url;

        this.async = async === undefined ? true : async;
        this.user = user;
        this.password = password;

        this.readyState = GMockHttpRequest.OPENED;

        this.onreadystatechange();
    };

    /**
     * Overrides the MIME type returned by the server.
     * This may be used, for example, to force a stream
     * to be treated and parsed as text/xml, even if
     * the server does not report it as such.
     * This method must be called before send().
     *
     * @param  {String} mimeType
     * @return {void}
     */
    GMockHttpRequest.prototype.overrideMimeType = function(mimeType){

    };

    /**
     * Sets the value of an HTTP request header.
     * You must call setRequestHeader() after open(),
     * but before send().
     * If this method is called several times with the
     * same header, the values are merged into one
     * single request header.
     *
     * @param {String} header   The name of the header whose value is to be set.
     * @param {String} value    The value to set as the body of the header.
     */
    GMockHttpRequest.prototype.setRequestHeader = function(header, value){
        // TypeError if not valid arguments, both required
        header = header.toLowerCase();
        if(_unsafeHeaders.hasOwnProperty(header)) return;
        if(_startsWith(header, 'proxy-', 'sec-')) return;

        var prev = this.requestHeaders[header];
        if(prev) value = prev + ', ' + value;

        this.requestHeaders[header] = value;
    };

    GMockHttpRequest.prototype.getRequestHeader = function(header){
        return this.requestHeaders[(header || '').toLowerCase()];
    };

    /**
     * Sends the request. If the request is asynchronous
     * (which is the default), this method returns as soon
     * as the request is sent. If the request is synchronous,
     * this method doesn't return until the response has arrived.
     * @param  {mixed} data
     * @return {void}
     */
    GMockHttpRequest.prototype.send = function(data){
        /*
         * If the data is a Document, it is serialized before
         * being sent. When sending a Document, versions of
         * Firefox prior to version 3 always send the request
         * using UTF-8 encoding; Firefox 3 properly sends the
         * document using the encoding specified by body.xmlEncoding,
         * or UTF-8 if no encoding is specified.
         * If it's an nsIInputStream, it must be compatible with
         * nsIUploadChannel's setUploadStream()method. In that case,
         * a Content-Length header is added to the request, with its
         * value obtained using nsIInputStream's available() method.
         *
         * Any headers included at the top of the stream are treated
         * as part of the message body. The stream's MIMEtype should be
         * specified by setting the Content-Type header using the
         * setRequestHeader() method prior to calling send().
         *
         * The best way to send binary content (like in files upload)
         * is using an ArrayBufferView or Blobs in conjunction with the
         * send() method. However, if you want to send a stringifiable
         * raw data, use the sendAsBinary() method instead, or the
         * StringView Non native typed arrays superclass.
         */
         if(this.readyState !== GMockHttpRequest.OPENED || this.sent){
            throw new Error('Failed to execute \'send\' on \'XMLHttpRequest\': The object\'s state must be OPENED');
         }

        if((/^(GET|HEAD)$/i).test(this.method)){
            data = null;
        } else {
            var headers = this.getRequestHeader('Content-Type') || 'text/plain;charset=utf-8';
            headers = (headers.split(';')[0]) + ';charset=utf-8';
            this.setRequestHeader('Content-Type', headers);
        }

         this.sent = true;
         this.error = false;

         //TODO: We want to also trigger event.
         this.onreadystatechange();

         this.requestText = data;
         this.onsend();
    };

    /**
     * Aborts the request if it has already been sent.
     * Triggers `onabort`.
     * @return {void}
     */
    GMockHttpRequest.prototype.abort = function(){
        this.responseText = null;
        this.error = true;
        this.aborted = true;

        _resetObject(this.requestHeaders);

        this.requestText = undefined;

        this.readyState = GMockHttpRequest.UNSENT;
        this.onreadystatechange();

        this.onabort();
    };

    GMockHttpRequest.prototype.setResponseHeaders = function(headers){
        console.log('HEADERS', headers)
        Object.keys(headers || {}).map(function(header){
            this.setResponseHeader(header, headers[header]);
        }, this);
    };

    GMockHttpRequest.prototype.setResponseHeader = function(header, value){
        if(! header) return;
        this.responseHeaders[header.toLowerCase()] = value;
    };

    /**
     * Returns the string containing the text of the
     * specified header, or null if either the response
     * has not yet been received or the header doesn't
     * exist in the response.
     *
     * @param  {String} header
     * @return {String}
     */
    GMockHttpRequest.prototype.getResponseHeader = function(header){
        if(this.readyState <= GMockHttpRequest.OPENED || this.error) return null;
        return this.responseHeaders[(header || '').toLowerCase()] || null;
    };

    /**
     * Returns all the response headers as a string,
     * or null if no response has been received.
     *
     * Note: For multipart requests, this returns the
     * headers from the current part of the request,
     * not from the original channel.
     *
     * @return {String}
     */
    GMockHttpRequest.prototype.getAllResponseHeaders = function(){
        if(this.readyState < GMockHttpRequest.HEADERS_RECEIVED) return '';

        var headers = '';

        Object.keys(this.responseHeaders).forEach(function(header){
            if(this.ignoredResponseHeaders.indexOf(header) !== -1) return;
            headers += header + ': ' + this.responseHeaders[header] + '\r\n';
        }, this);

        return headers;
    };

    GMockHttpRequest.prototype.makeXMLResponse = function(data){
        var xmlDoc = null;

        if( typeof DOMParser !== 'undefined'){
            var parser = new DOMParser();
            xmlDoc = parser.parseFromString(data, 'text/xml');
        } else {
            xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
            xmlDoc.async = false;
            xmlDoc.loadXML(data);
        }

        return xmlDoc;
    };

    GMockHttpRequest.prototype.fakeResponse = function(status, headers, body){
        if( this.readyState !== GMockHttpRequest.OPENED || ! this.sent){
            throw new Error('Invalid state');
        }

        this.status = status;
        this.statusText = status + ' ' + GMockHttpRequest.STATUS_CODES[status];

        //set response headers
        this.setResponseHeaders(headers);
        this.readyState = GMockHttpRequest.HEADERS_RECEIVED;


        this.onprogress();
        this.onreadystatechange();

        //set response body
        this.responseText = body;
        this.responseXML = this.makeXMLResponse(body);

        this.readyState = GMockHttpRequest.LOADING;
        this.onprogress();
        this.onreadystatechange();

        this.readyState = GMockHttpRequest.DONE;
        this.onreadystatechange();
        this.onprogress();
        this.onload();
    };

    GMockHttpRequest.prototype.fakeError = function(exception){
        if( this.readyState !== GMockHttpRequest.OPENED || ! this.sent){
            throw new Error('Invalid state');
        }

        this.responseText = null;
        this.error = true;

        _resetObject(this.requestHeaders);

        this.readyState = GMockHttpRequest.DONE;

        if(!this.async) throw exception;

        this.onreadystatechange();
        this.onerror();
    };

    /**
     * Logger method, meant to be implemented by
     * mixin. As a placeholder, we use console if available
     * or a shim if not present.
     */
    GMockHttpRequest.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    GMockHttpRequest.prototype.emit = function() {
        this.logger.warn(GMockHttpRequest, 'emit method is not implemented', arguments);
    };
//////////////////////////////////////////////
/// Recorder
//////////////////////////////////////////////
    var READONLY = ['responseText', 'responseXML', 'status', 'statusText'];
    var GETTERS_SETTERS = ['readyState', 'response', 'responseType', 'statusText', 'timeout', 'upload', 'withCredentials', 'onload', 'onprogress', 'onerror', 'onabort', 'onreadystatechange', 'onsend', 'ontimeout'];
    var PASSTHROUGH_METHODS = ['abort', 'getAllResponseHeaders', 'getResponseHeader', 'overrideMimeType'];

    function _wrapXMLHttpRequest(wrapper, xhr){
        PASSTHROUGH_METHODS.forEach(function(method){
            wrapper[method] = function(){
                xhr[method].apply(xhr, arguments);
            };
        }, wrapper);

        GETTERS_SETTERS.map(function(prop){
            Object.defineProperty(wrapper, prop, {
                get: function(){ return xhr[prop];},
                set: function(value) {
                    xhr[prop] = value;
                },
                enumerable:true,
                configurable:true
            });
        }, wrapper);

        READONLY.map(function(prop){
            Object.defineProperty(wrapper, prop, {
                get: function(){ return xhr[prop];},
                enumerable: true,
                configurable: true
            });
        }, wrapper);
    }

    function _headerObjectFromString(headers){
        headers = (headers || '').split(';');
        var out = {};
        headers.map(function(header){
            header = header.replace('\r\n', '');
            header = header.split(':');
            out[header[0]] = header[1];
        });
        return out;
    }

    function Snapshoot(){
        this.data = {};
        this.requestHeaders = [];

        this.fixArguments = function(args){
            return Array.prototype.slice.call(args);
        };

        this.setRequestHeader = function(args){
            this.requestHeaders.push(this.fixArguments(args));
        };

        this.setOpen = function(args){
            this.open = this.fixArguments(args);
        };

        this.setSend = function(args){
            this.send = this.fixArguments(args);
            this.timestamp = Date.now();
        };

        this.setLoad = function(e){
            this.success = true;
            var headers = e.target.getAllResponseHeaders();
            this.response = {
                    status: e.target.status,
                    headers: _headerObjectFromString(headers),
                    body: e.target.responseText
            };

            this.terminate();
        };

        this.setError = function(xhr, e){
            this.error = e;
            this.success = false;
            this.terminate();
        };

        this.terminate = function(){
            this.travelTime = Date.now() - this.timestamp;
        };

        this.frame = function(){
            return {
                url: this.open[1],
                method: this.open[0],
                data: this.send[0],
                response: this.response,
                success: this.success,
                timestamp: this.timestamp,
                travelTime: this.travelTime,
            };
        };
    }


    var GHttpRecord = function(){

        this.snapshot = new Snapshoot();

        this.xhr = new SrcXMLHttpRequest();

        _wrapXMLHttpRequest(this, this.xhr);

        this.xhr.addEventListener('load', this.onLoad.bind(this), false);
        this.xhr.addEventListener('error', this.onError.bind(this), false);

        if(typeof this.register === 'function') this.register(this);
    };

    GHttpRecord.prototype.setRequestHeader = function(){
        this.snapshot.setRequestHeader(arguments);
        this.xhr.setRequestHeader.apply(this.xhr, arguments);
    };

    GHttpRecord.prototype.open = function(method, url, async, user, password){
        this.snapshot.setOpen(arguments);
        this.xhr.open.apply(this.xhr, arguments);
    };

    GHttpRecord.prototype.send = function(){
        this.snapshot.setSend(arguments);
        this.xhr.send.apply(this.xhr, arguments);
    };

    GHttpRecord.prototype.onError = function(e){
        this.snapshot.setError(this.xhr, e);
    };

    GHttpRecord.prototype.onLoad = function(e){
        this.snapshot.setLoad(e);
    };

    GHttpRecord.prototype.value = function(){
        return this.snapshot.frame();
    };

//////////////////////////////////////////////
/// Request Gateway:
/// When we open a request the URL parameter is
/// matched against a list of pass through items,
/// if matched it will behave as a GHttpRecord
/// request with a rewritten URL to hit our
/// mock server. If it's not matched
//////////////////////////////////////////////
    var GHttpGatewayRequest = function(options){

        if(typeof this.register === 'function') this.register(this);
    };

    GHttpGatewayRequest.prototype.open = function(method, url, async, user, password){
        var args = this.matchRequest(Array.prototype.slice.call(arguments));
        this.snapshot.setOpen(args);
        this.xhr.open.apply(this.xhr, args);
    };

    GHttpGatewayRequest.prototype.matchRequest = function(args){
        if(!this.matchUrl(args[1])) return args;
        return this.filterByUrl(args);
    };

    GHttpGatewayRequest.pathToRegExp = function (path, keys, options) {
        keys || (keys = []),
        options || (options = {});
        path = path
            .concat('/?')
            .replace(/\/\(/g, '(?:/')
            .replace(/(\/)?(\.)?:(\w+)(?:(\(.*?\)))?(\?)?|\*/g, function(_, slash, format, key, capture, optional){
                if (_ === "*"){
                    keys.push(undefined);
                    return _;
                }

                keys.push({name:key});
                slash = slash || '';
                return ''
                    + (optional ? '' : slash)
                    + '(?:'
                    + (optional ? slash : '')
                    + (format || '') + (capture || '([^/]+?)') + ')'
                    + (optional || '');
            })
            .replace(/([\/.])/g, '\\$1')
            .replace(/\*/g, '(.*)');

        var regexp = new RegExp('^' + path + '$', 'i');

        regexp.keys = keys;
        regexp.options = options;

        return regexp;
    };


//////////////////////////////////////////////
/// Server
//////////////////////////////////////////////
    var GMockHttpServer = function(handler){
        this.handler = handler;
        this.methodKeyword = '_method';
        this.queue = [];
        this.frames = [];
        this.requests = [];
        this.responses = [];
        this.autoRespondTimeout = 10;

        var location = window ? window.location : {};
        this.currentLocationReg = new RegExp('^' + location.prototcol + '//' + location.host);
    };

    GMockHttpServer.restore = function(){
        if(! window.SrcXMLHttpRequest) return;
        window.XMLHttpRequest = window.SrcXMLHttpRequest;
    };

    GMockHttpServer.prototype.record = function(){
        GMockHttpServer.restore();

        var server = this;

        function RecordedHttpRequest(){
            this.register = function(request){
                server.addSnapshot(request);
            };

            GHttpRecord.apply(this, arguments);
        };

        RecordedHttpRequest.prototype = GHttpRecord.prototype;

        window.SrcXMLHttpRequest = window.XMLHttpRequest;
        window.XMLHttpRequest = RecordedHttpRequest;
    };

    GMockHttpServer.prototype.start = function(){
        var server = this;

        this.startTime = Date.now();

        function MockHttpRequest(){
            this.register = function(request){
                server.addRequest(request);
            };
            GMockHttpRequest.apply(this, arguments);
        };

        MockHttpRequest.prototype = GMockHttpRequest.prototype;

        window.SrcXMLHttpRequest = window.XMLHttpRequest;
        window.XMLHttpRequest = MockHttpRequest;
    };

    GMockHttpServer.prototype.addSnapshot = function(snapshot){
        this.frames.push(snapshot);
    };

    GMockHttpServer.prototype.addRequest = function(request){
        console.log('add request', request)
        this.requests.push(request);
        var server = this;

        request.onsend = function(){
            server.handleRequest(this);

            if(!server.autoRespond || server.responding) return;

            setTimeout(function(){
                server.responding = false;
                server.respond();
            }, server.autoRespondTimeout);

            server.responding = true;
        };
    };

    GMockHttpServer.prototype.stop = function(){
        GMockHttpServer.restore();
        this.stopTime = Date.now();
    };

    GMockHttpServer.prototype.handleRequest = function(request){
        this.queue || (this.queue = []);

        if(request.async) this.queue.push(request);
        else this.processRequest(request);
    };

    GMockHttpServer.prototype.respond = function(){
        if (arguments.length > 0) this.respondWith.apply(this, arguments);

        this.queue || (this.queue = []);

        var requests = this.queue.splice(0, this.queue.length);

        var xhr;
        while(xhr = requests.shift()) this.processRequest(xhr);
    };

    //TODO: This should take an object matching a snapshot!!
    GMockHttpServer.prototype.respondWith = function(method, url, body){

        var response = {
            url: url,
            method: method,
            response: this.makeResponseObject(body)
        };

        if(typeof method === 'object') response = method;

        this.responses.push(response);
    };

    GMockHttpServer.prototype.makeResponseObject = function(body){
        if(typeof body === 'object') return body;

        var response = {
            status: 200,
            headers: {},
            body: body
        };

        return response;
    };

    GMockHttpServer.prototype.processRequest = function(request){
        try {
            if(request.aborted) return;

            var response = this.response || {status: 404, headers: {}, body: ''};

            if(this.responses){
                this.responses.map(function(resp){
                    if(this.matchResponse(resp, request)) response = resp.response;
                }, this);
            }

            if(request.readyState !== GMockHttpRequest.DONE){
                this.logger.log('ready state',response, request);
                request.fakeResponse(response.status, response.headers, response.body);
            }

        } catch(e){
            this.logger.error('GMockHttpServer error processing request', e);
        }
    };

    //TODO: We want to also match by data sent!!
    GMockHttpServer.prototype.matchResponse = function(response, request){
        var requestUrl = request.url;

        if(!this.currentLocationReg.test(requestUrl) || !/^https?:\/\//.test(requestUrl)){
            requestUrl = requestUrl.replace(this.currentLocationReg, '');
        }

        var method = this.getHttpMethod(request);

        return requestUrl === response.url && request.method === response.method;
    };

    GMockHttpServer.prototype.getHttpMethod = function(request){
        //TODO: Move this to GMockHttpRequest
        if(this.fakeHttpMethods && (/^post$/i).test(request.method)){
            //TODO: Make regexp configurable, we could have _m=PUT
            var methodReg = new RegExp( this.methodKeyword + '=([^\\b;]+)');
            var matches = (request.requestText || '').match(methodReg);
            return !!matches ? matches[1] : request.method;
        }

        return request.method;
    };

    GMockHttpServer.prototype.logger = _shimConsole(console);

    GMockHttpRequest.Record = GHttpRecord;
    GMockHttpRequest.Server = GMockHttpServer;
    GMockHttpRequest.XMLHttpRequest = window.XMLHttpRequest;

    return GMockHttpRequest;
}));
