jQuery(function(){
	$('body').prepend('<div id="notification" style="background-color:white;\
													 border:2px solid red;position:absolute;\
													 \
													 height:50px;left:-110px;top:0px;\
													 z-index:1000;"></div><span id="test"></span>');
													 
	//otification will appear at the top of the page	
	$(window).scroll(function(){
		$('#notification').css({top: $(this).scrollTop() + 'px'});
      
	});
	/*
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			console.log("TEST");
			if(request.linkPushed){
				$('#notification').stop(true, true).
						animate({top: 0},'fast').delay(1500).
						animate({top: -80},'fast');
				console.log('sent');
				}
    });
    */
    
    var port = chrome.runtime.connect({name: "channel-hover"});
	
	port.onMessage.addListener(function(msg) {
		if(msg.output == true) {
			$('#test').text(msg.pageName + ' has been added');
			$('#notification').stop(true, true).text('"' + msg.pageName + '" Has Been Added To Your Streme').css({width:$('#notification').width()}).
				animate({left: 0},'fast').delay(1500).
				animate({left: -$('#notification').width()},'fast').css({width:$('#notification').width()});
			}
		
		});
	
	
	jQuery('a').hover(
		//in
		function(){/*
			console.log(this.href);
			chrome.runtime.sendMessage({hoverURL: this.href, linkText: $(this).text(), hovering: true}, function(response) {
				console.log('hovering2');
				
			});
			*/
			//console.log('body: ' + $('body').offset().left);
			port.postMessage({hoverURL: this.href, linkText: $(this).text(), hovering: true});
		}
		
		//out
		,function(){/*
			chrome.runtime.sendMessage({hoverURL: this.href, linkText: $(this).text(), hovering: false}, function(response) {
				console.log('not hovering');
				
			});
			*/ 
			port.postMessage({hoverURL: this.href, linkText: $(this).text(), hovering: false});
		});



  
});
