jQuery(function(){
	$('body').prepend('<div id="notification" style="background-color:white;\
													 border:2px solid red;position:absolute;\
													 width:100px;\
													 height:50px;left:-110px;top:0px;"></div>');
													 
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
		if(msg.output ==true) {
			console.log('output is true');
			$('#notification').stop(true, true).text('"' + msg.pageName + '" Has Been Added To Your Streme').
				animate({left: 0},'fast').delay(1500).
				animate({left: -110},'fast');
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
