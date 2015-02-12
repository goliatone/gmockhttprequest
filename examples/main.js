/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'mockedhttprequest': 'mockedhttprequest',
        'gatewayhttprequest': 'gatewayhttprequest',
        'recordedhttprequest': 'recordedhttprequest',
        'mockhttpserver': 'mockhttpserver'
        // 'gmockhttprequest': 'gmockhttprequest'
    }
});

define(['mockhttpserver', 'jquery'], function (MockHttpServer, $) {
    console.log('Loading');
    // window.GMockHttpRequest = GMockHttpRequest;
/*
    var Server = new GMockHttpRequest.Server();
    Server.record();
    window.server = Server;
*/

/*
    $.ajax({
        url:'http://localhost:9000',
        // type:'POST',
        // data:'json'
    })
    .done(function(data){
        console.log('DONE', data)
    })
    .fail(function(err){
        console.log('ERROR', arguments);
    })
    .always(function(){
        // console.log('RUNNNNN')
    });
    return
*/
/*
$.ajax({
        url:'http://duckduckgo.com',
        // type:'POST',
        // data:'json'
    })
    .done(function(data){
        console.log('DONE', data)
    })
    .fail(function(err){
        console.error('==>ERROR', arguments);
    })
    .always(function(){
        // console.log('RUNNNNN')
    });
    return
*/
/*
    $.ajax({
        url:'http://localhost:3232/console',
        type:'POST',
        data: { name: "John", location: "Boston" },
        dataType:'json'
    })
    .done(function(data){
        console.log('DONE', data)
    })
    .fail(function(err){
        console.log('ERROR', arguments);
    })
    .always(function(){
        // console.log('RUNNNNN')
    });

    $.ajax({
        url:'http://localhost:3232/console',
        type:'POST',
        data: { name: "Peperone", location: "Barcelona" },
        dataType:'json'
    })
    .done(function(data){
        console.log('DONE', data)
    })
    .fail(function(err){
        console.log('ERROR', arguments);
    })
    .always(function(){
        // console.log('RUNNNNN')
    });

    $.ajax({
        url:'http://localhost:3232/console',
        type:'POST',
        data: { name: "Kiko", location: "Ibiza" },
        dataType:'json'
    })
    .done(function(data){
        console.log('DONE', data)
    })
    .fail(function(err){
        console.log('ERROR', arguments);
    })
    .always(function(){
        // console.log('RUNNNNN')
    });

    return;
*/

	var Server = new MockHttpServer(function(){
        console.log('server', arguments);
    });
    // Server.record()
    Server.start();

    Server.respondWith({
        "url": "http://localhost:3232/console",
        "method": "POST",
        "data": "name=John&location=Boston",
        "response": {
            "status": 200,
            "headers": {
                "Content-Type": " application/json"
            },
            "body": "{\"status\":true, \"mesasge\":\"This is a mesasge\"}"
        },
        "success": true,
        "timestamp": 1419396584251,
        "travelTime": 6
    });

    //=====================
    $.ajax({
        url:'http://localhost:3232/console',
        type:'POST',
        data: { name: "John", location: "Boston" },
        dataType:'json'
    })
    .done(function(data){
        console.log('DONE', data)
    })
    .fail(function(err){
        console.log('ERROR', arguments);
    })
    .always(function(){
        console.log('RUNNNNN')
    });
    //=====================

    Server.respond();

    window.server = Server;
});