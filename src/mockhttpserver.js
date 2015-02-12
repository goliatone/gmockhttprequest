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
}(this, 'MockHttpServer', ['extend', 'mockedhttprequest', 'recordedhttprequest', 'gatewayhttprequest'],
    function(extend, MockedHttpRequest, RecordedHttpRequest, GatewayHttpRequest) {

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

///////////////////////////////////////////////////
// CONSTRUCTOR
///////////////////////////////////////////////////

    var OPTIONS = {
        autoinitialize: true,

    };

    /**
     * MockHttpServer constructor
     *
     * @param  {object} config Configuration object.
     */
     var MockHttpServer = function(handler){
        this.handler = handler;
        this.methodKeyword = '_method';
        this.queue = [];
        this.frames = [];
        this.proxies = [];
        this.requests = [];
        this.responses = [];
        this.autoRespondTimeout = 10;

        var location = window ? window.location : {};
        this.currentLocationReg = new RegExp('^' + location.prototcol + '//' + location.host);
    };

    MockHttpServer.VERSION = '0.0.0';


    /**
     * Make default options available so we
     * can override.
     */
    MockHttpServer.DEFAULTS =  _extend({}, OPTIONS);

    MockHttpServer.restore = function(){
        if(! window.SrcXMLHttpRequest) return;
        window.XMLHttpRequest = window.SrcXMLHttpRequest;
    };

    MockHttpServer.prototype.record = function(){
        MockHttpServer.restore();
        RecordedHttpRequest.prototype.register = this.addSnapshot.bind(this);
        window.XMLHttpRequest = RecordedHttpRequest;
    };

    MockHttpServer.prototype.start = function(){
        this.startTime = Date.now();
        MockedHttpRequest.prototype.register = this.addRequest.bind(this);
        window.XMLHttpRequest = MockedHttpRequest;
    };

    MockHttpServer.prototype.addProxy = function(proxy){
        proxy.owner = this;
        this.proxies.push(proxy);
    };

    MockHttpServer.prototype.addSnapshot = function(snapshot){
        this.frames.push(snapshot);
    };

    MockHttpServer.prototype.addRequest = function(request){
        console.log('add request', request);
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

    MockHttpServer.prototype.stop = function(){
        MockHttpServer.restore();
        this.stopTime = Date.now();
    };

    MockHttpServer.prototype.handleRequest = function(request){
        this.queue || (this.queue = []);

        if(request.async) this.queue.push(request);
        else this.processRequest(request);
    };

    MockHttpServer.prototype.respond = function(){
        if (arguments.length > 0) this.respondWith.apply(this, arguments);

        this.queue || (this.queue = []);

        var requests = this.queue.splice(0, this.queue.length);

        var xhr;
        while(xhr = requests.shift()) this.processRequest(xhr);
    };

    //TODO: This should take an object matching a snapshot!!
    MockHttpServer.prototype.respondWith = function(method, url, body){

        var response = {
            url: url,
            method: method,
            response: this.makeResponseObject(body)
        };

        if(typeof method === 'object') response = method;

        this.responses.push(response);
    };

    MockHttpServer.prototype.makeResponseObject = function(body){
        if(typeof body === 'object') return body;

        var response = {
            status: 200,
            headers: {},
            body: body
        };

        return response;
    };

    MockHttpServer.prototype.processRequest = function(request){
        try {
            if(request.aborted) return;

            var response = this.response || {status: 404, headers: {}, body: ''};

            if(this.responses){
                this.responses.map(function(resp){
                    if(this.matchResponse(resp, request)) response = resp.response;
                }, this);
            }

            if(request.readyState !== MockedHttpRequest.DONE){
                this.logger.log('ready state',response, request);
                request.fakeResponse(response.status, response.headers, response.body);
            }

        } catch(e){
            this.logger.error('MockHttpServer error processing request', e);
        }
    };

    //TODO: We want to also match by data sent!!
    MockHttpServer.prototype.matchResponse = function(response, request){
        var requestUrl = request.url;

        if(!this.currentLocationReg.test(requestUrl) || !/^https?:\/\//.test(requestUrl)){
            requestUrl = requestUrl.replace(this.currentLocationReg, '');
        }

        var method = this.getHttpMethod(request);

        return requestUrl === response.url && request.method === response.method;
    };

    MockHttpServer.prototype.getHttpMethod = function(request){
        //TODO: Move this to MockdedHttpRequest
        if(this.fakeHttpMethods && (/^post$/i).test(request.method)){
            //TODO: Make regexp configurable, we could have _m=PUT
            var methodReg = new RegExp( this.methodKeyword + '=([^\\b;]+)');
            var matches = (request.requestText || '').match(methodReg);
            return !!matches ? matches[1] : request.method;
        }

        return request.method;
    };

    MockHttpServer.prototype.logger = _shimConsole(console);

    MockHttpServer.MockedHttpRequest   = MockedHttpRequest;
    MockHttpServer.GatewayHttpRequest  = GatewayHttpRequest;
    MockHttpServer.RecordedHttpRequest = RecordedHttpRequest;

    return MockHttpServer;
}));
