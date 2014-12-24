/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'gmockhttprequest': 'gmockhttprequest'
    }
});

define(['gmockhttprequest', 'jquery'], function (GMockHttpRequest, $) {
    console.log('Loading');
    window.GMockHttpRequest = GMockHttpRequest;

    // GMockHttpRequest.Server.record();
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
*/
    /*$.ajax({
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

    return;*/
	var Server = new GMockHttpRequest.Server(function(){
        console.log('server', arguments);
    });
    Server.start();
    Server.respondWith('POST', 'http://localhost:9000', '{"status": true}');

    //=====================
    $.ajax({
        url:'http://localhost:9000',
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

    window.Server = Server;
});