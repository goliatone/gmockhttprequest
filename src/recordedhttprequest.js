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
}(this, 'RecordedHttpRequest', ['extend'], function(extend) {

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

///////////////////////////////////////////////////
// CONSTRUCTOR
///////////////////////////////////////////////////

    var RecordedHttpRequest = function(){

        this.createXmlHttpRequest();

        if(typeof this.register === 'function') this.register(this);
    };

    RecordedHttpRequest.prototype.createXmlHttpRequest = function(){

        this.snapshot = new Snapshoot();

        this.xhr = new SrcXMLHttpRequest();

        _wrapXMLHttpRequest(this, this.xhr);

        this.xhr.addEventListener('load', this.onLoad.bind(this), false);
        this.xhr.addEventListener('error', this.onError.bind(this), false);
    };

    RecordedHttpRequest.name = RecordedHttpRequest.prototype.name = 'RecordedHttpRequest';

    RecordedHttpRequest.VERSION = '0.0.0';

    RecordedHttpRequest.prototype.applyTo = function(request){
        //we transfer all the data to passed in request;
        this.snapshot.requestHeaders.map(function(header){
            request.setRequestHeader(header);
        });

        //responseType, onreadystatechange, readyState, response, timeout, ontimeout, upload, withCredentials

        GETTERS_SETTERS.map(function(prop){
            request[prop] = this[prop];
        }, this);

        return request;
    };

    RecordedHttpRequest.prototype.setRequestHeader = function(){
        this.snapshot.setRequestHeader(arguments);
        this.xhr.setRequestHeader.apply(this.xhr, arguments);
    };

    RecordedHttpRequest.prototype.open = function(method, url, async, user, password){
        this.snapshot.setOpen(arguments);
        this.xhr.open.apply(this.xhr, arguments);
    };

    RecordedHttpRequest.prototype.overrideMimeType = function(mimeType){
        if(this.xhr.readyState < 3) throw new Error('Failed to execute \'overrideMimeType\' on \'XMLHttpRequest\': MimeType cannot be overridden when the state is LOADING or DONE.');
        //this might throw error
        this.xhr.overrideMimeType(mimeType);
        this.snapshot.setMimeType(mimeType);
    };

    RecordedHttpRequest.prototype.send = function(){
        this.snapshot.setSend(arguments);
        //TODO: we should check if we have mimeType, if so overrid
        if(this.mimeType) this.xhr.overrideMimeType(this.mimeType);
        this.xhr.send.apply(this.xhr, arguments);
    };

    RecordedHttpRequest.prototype.onError = function(e){
        this.snapshot.setError(this.xhr, e);
    };

    RecordedHttpRequest.prototype.onLoad = function(e){
        this.snapshot.setLoad(e);
    };

    RecordedHttpRequest.prototype.value = function(){
        return this.snapshot.frame();
    };

    return RecordedHttpRequest;
}));
